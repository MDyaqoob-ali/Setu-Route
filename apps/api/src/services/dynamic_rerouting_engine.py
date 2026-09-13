"""
Dynamic Rerouting Engine for SETU-ROUTE.
Executes the closed-loop reaction when a corridor is disrupted:
1. Identify affected vehicles on the corridor
2. Identify affected consignments/deliveries
3. Calculate optimal bypass detour using GraphRoutingEngine
4. Recalculate calibrated ETA and delay minutes via ETAEngine
5. Generate structured 4-part alert via AlertRuleEngine
6. Update vehicle trajectory, status, and delivery in DB
7. Record auditable event in DeliveryEvent & AuditLog
8. Broadcast real-time notifications over WebSockets
"""

import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.models import Vehicle, Delivery, Road, Incident, DeliveryEvent, AuditLog
from src.services.graph_routing_engine import GraphRoutingEngine
from src.services.eta_engine import ETAEngine
from src.services.alert_rule_engine import AlertRuleEngine
from src.ws.connection_manager import ws_manager

logger = logging.getLogger("neroute.rerouting")

class DynamicReroutingEngine:
    @staticmethod
    async def handle_corridor_disruption(
        db: AsyncSession,
        road_id: str,
        incident: Optional[Incident] = None,
        reason: str = "Landslide / Corridor Blockage"
    ) -> List[Dict[str, Any]]:
        """
        Executes automated closed-loop rerouting for all in-transit vehicles
        traversing or heading toward the disrupted corridor.
        """
        now = datetime.now(timezone.utc)
        
        # 1. Fetch Road details
        road_res = await db.execute(select(Road).where(Road.id == road_id))
        road = road_res.scalar_one_or_none()
        if not road:
            logger.warning(f"Road {road_id} not found for rerouting.")
            return []

        road_code = road.code
        road_name = road.name

        # 2. Identify in-transit vehicles associated with this corridor
        vehicles_res = await db.execute(
            select(Vehicle).where(
                Vehicle.current_status.in_(["MOVING", "DELAYED", "STOPPED"])
            )
        )
        vehicles = vehicles_res.scalars().all()

        rerouted_summary = []

        for veh in vehicles:
            # Check if vehicle has an active delivery
            if not veh.current_delivery_id:
                continue

            deliv_res = await db.execute(
                select(Delivery).where(Delivery.id == veh.current_delivery_id)
            )
            delivery = deliv_res.scalar_one_or_none()
            if not delivery:
                continue

            # Determine if vehicle route or destination passes near this corridor
            is_affected = False
            if road.state in delivery.destination_name or road.code in (veh.destination_name or ""):
                is_affected = True
            elif delivery.status in ("IN_TRANSIT", "DELAYED", "AT_RISK", "PLANNED"):
                is_affected = True

            if not is_affected:
                continue

            logger.info(f"Rerouting vehicle {veh.registration_number} for delivery {delivery.consignment_code}...")

            # 3. Calculate alternate route avoiding the blocked highway
            candidate_routes = await GraphRoutingEngine.calculate_routes(
                db=db,
                origin_lat=veh.current_lat,
                origin_lng=veh.current_lng,
                dest_lat=delivery.destination_lat,
                dest_lng=delivery.destination_lng,
                vehicle_type=veh.vehicle_type,
                cargo_priority=delivery.priority,
                avoid_blocked=True
            )

            if not candidate_routes:
                logger.warning(f"No detour found for vehicle {veh.registration_number}")
                continue

            # Pick the best detour candidate
            chosen_route = candidate_routes[0]
            if chosen_route.get("risk_score", 0) > 70.0 and len(candidate_routes) > 1:
                lowest_risk_routes = [r for r in candidate_routes if r.get("route_type") == "LOWEST_RISK"]
                if lowest_risk_routes:
                    chosen_route = lowest_risk_routes[0]

            # 4. Compute calibrated ETA with the new distance and detour
            remaining_km = chosen_route["distance_km"]
            eta_result = ETAEngine.calculate_eta(
                remaining_distance_km=remaining_km,
                vehicle_type=veh.vehicle_type,
                road_condition="Fair",
                weather_rain_1h_mm=18.0,
                elevation_gain_m=650.0,
                bottleneck_count=len(chosen_route.get("bottlenecks", [])),
                current_speed_kmh=veh.speed_kmh,
                departure_time=now
            )

            # 5. Update Delivery & Vehicle
            delivery.current_eta = eta_result.estimated_arrival
            delivery.delay_minutes = eta_result.delay_minutes
            delivery.delay_reason = f"Detour via {chosen_route['route_name']}. {eta_result.delay_reason}"
            if eta_result.delay_minutes > 90 and delivery.priority in ("CRITICAL", "HIGH"):
                delivery.status = "AT_RISK"
                delivery.risk_level = "HIGH"
            else:
                delivery.status = "IN_TRANSIT"
                delivery.risk_level = "MEDIUM"

            veh.current_status = "MOVING"
            veh.speed_kmh = max(25.0, eta_result.effective_speed_kmh)

            # 6. Log DeliveryEvent
            dev_event = DeliveryEvent(
                delivery_id=delivery.id,
                event_type="REROUTED",
                title=f"Dynamic Rerouting Activated: Detour via {chosen_route['route_name']}",
                description=f"Original route via {road_code} disrupted ({reason}). Detour adds {round(remaining_km, 1)}km. New ETA: {eta_result.estimated_arrival.strftime('%H:%M IST')}.",
                latitude=veh.current_lat,
                longitude=veh.current_lng,
                created_at=now
            )
            db.add(dev_event)

            # 7. Audit Log
            audit = AuditLog(
                user_id=None,
                action="DYNAMIC_VEHICLE_REROUTE",
                entity_type="vehicle",
                entity_id=veh.id,
                details_json={
                    "vehicle": veh.registration_number,
                    "delivery": delivery.consignment_code,
                    "disrupted_road": road_code,
                    "new_route": chosen_route["route_name"],
                    "distance_km": remaining_km,
                    "delay_minutes": eta_result.delay_minutes,
                    "new_eta": eta_result.estimated_arrival.isoformat()
                },
                created_at=now
            )
            db.add(audit)

            # 8. Trigger Delivery At Risk Alert if delay is significant
            if eta_result.delay_minutes > 45 or delivery.priority == "CRITICAL":
                await AlertRuleEngine.trigger_delivery_at_risk_alert(
                    db=db,
                    delivery=delivery,
                    delay_minutes=eta_result.delay_minutes,
                    reason=f"Blockage on {road_code} necessitated {chosen_route['route_name']} detour."
                )

            # Broadcast WebSocket updates
            await ws_manager.broadcast("vehicles", "VEHICLE_REROUTED", {
                "vehicle_id": veh.id,
                "registration_number": veh.registration_number,
                "status": veh.current_status,
                "new_route_name": chosen_route["route_name"],
                "waypoints": chosen_route["waypoints"],
                "eta": eta_result.estimated_arrival.isoformat(),
                "delay_minutes": eta_result.delay_minutes
            })

            await ws_manager.broadcast("deliveries", "DELIVERY_UPDATED", {
                "delivery_id": delivery.id,
                "consignment_code": delivery.consignment_code,
                "status": delivery.status,
                "risk_level": delivery.risk_level,
                "current_eta": delivery.current_eta.isoformat(),
                "delay_minutes": delivery.delay_minutes
            })

            rerouted_summary.append({
                "vehicle_id": veh.id,
                "registration_number": veh.registration_number,
                "consignment_code": delivery.consignment_code,
                "priority": delivery.priority,
                "disrupted_corridor": f"{road_code} ({road_name})",
                "new_route_name": chosen_route["route_name"],
                "detour_distance_km": round(remaining_km, 1),
                "delay_minutes": eta_result.delay_minutes,
                "new_eta": eta_result.estimated_arrival.isoformat(),
                "safety_rationale": chosen_route.get("safety_rationale", "Optimal bypass chosen.")
            })

        await db.commit()
        return rerouted_summary
