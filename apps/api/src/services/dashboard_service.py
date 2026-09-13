from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from src.core.cache import fast_cache
from src.models import (
    Road, RoadSegment, Incident, Vehicle, Delivery, Alert, District, DeliveryEvent
)

class DashboardService:
    @staticmethod
    async def get_summary(db: AsyncSession):
        cached = fast_cache.get("dashboard:summary")
        if cached is not None:
            return cached

        # 1. Road & Network accessibility
        roads_query = select(Road)
        roads_result = await db.execute(roads_query)
        roads = roads_result.scalars().all()

        total_km = sum(r.total_length_km for r in roads) if roads else 1.0
        accessible_km = sum(r.total_length_km for r in roads if r.accessibility_status == "ACCESSIBLE")
        accessibility_pct = round((accessible_km / total_km) * 100, 1) if total_km > 0 else 100.0

        # High risk corridors (risk_score >= 0.6 or BLOCKED / RESTRICTED)
        high_risk_roads = [r for r in roads if r.current_risk_score >= 0.6 or r.accessibility_status in ("BLOCKED", "RESTRICTED")]
        high_risk_count = len(high_risk_roads)

        # 2. Incidents
        incidents_query = select(Incident).where(Incident.status != "RESOLVED")
        incidents_result = await db.execute(incidents_query)
        active_incidents = incidents_result.scalars().all()
        critical_incidents = [i for i in active_incidents if i.severity == "CRITICAL"]

        # 3. Vehicles
        vehicles_query = select(Vehicle)
        vehicles_result = await db.execute(vehicles_query)
        vehicles = vehicles_result.scalars().all()

        vehicles_in_transit = len([v for v in vehicles if v.current_status == "MOVING"])
        vehicles_delayed = len([v for v in vehicles if v.current_status == "DELAYED"])
        vehicles_stopped = len([v for v in vehicles if v.current_status in ("STOPPED", "OFFLINE")])

        # 4. Deliveries
        deliveries_query = select(Delivery).where(Delivery.status.in_(["PLANNED", "IN_TRANSIT", "DELAYED", "AT_RISK"]))
        deliveries_result = await db.execute(deliveries_query)
        active_deliveries = deliveries_result.scalars().all()

        deliveries_at_risk = len([d for d in active_deliveries if d.status == "AT_RISK" or d.risk_level in ("HIGH", "SEVERE")])
        deliveries_critical = len([d for d in active_deliveries if d.priority == "CRITICAL"])

        # 5. Alerts
        alerts_query = select(func.count(Alert.id)).where(Alert.is_acknowledged == False)
        unack_alerts_result = await db.execute(alerts_query)
        unack_alerts_count = unack_alerts_result.scalar_one()

        # 6. Recent events (Incidents + Delivery Events + Alerts)
        recent_incidents_query = select(Incident).order_by(desc(Incident.created_at)).limit(5)
        recent_inc_res = await db.execute(recent_incidents_query)
        recent_incs = recent_inc_res.scalars().all()

        recent_events = []
        for inc in recent_incs:
            recent_events.append({
                "id": inc.id,
                "type": "INCIDENT",
                "title": f"[{inc.severity}] {inc.title}",
                "description": inc.description,
                "timestamp": inc.created_at.isoformat(),
                "severity": inc.severity,
                "entity_type": "incident",
                "entity_id": inc.id
            })

        recent_events.sort(key=lambda x: x["timestamp"], reverse=True)

        # 7. Corridor Risk breakdown
        corridor_risks = []
        for r in roads[:8]:
            corridor_risks.append({
                "id": r.id,
                "code": r.code,
                "name": r.name,
                "status": r.accessibility_status,
                "risk_score": r.current_risk_score,
                "avg_speed": r.average_speed_kmh,
                "state": r.state,
                "length_km": r.total_length_km
            })

        # 8. District summaries
        districts_query = select(District).limit(8)
        districts_result = await db.execute(districts_query)
        districts = districts_result.scalars().all()
        district_summaries = []
        for d in districts:
            district_summaries.append({
                "id": d.id,
                "name": d.name,
                "state": d.state,
                "code": d.code,
                "vulnerability": d.vulnerability_index,
                "elevation": d.elevation_avg_m
            })

        summary_data = {
            "network_accessibility_percent": accessibility_pct,
            "total_road_km": round(total_km, 1),
            "accessible_road_km": round(accessible_km, 1),
            "active_incidents_count": len(active_incidents),
            "critical_incidents_count": len(critical_incidents),
            "vehicles_in_transit_count": vehicles_in_transit,
            "vehicles_delayed_count": vehicles_delayed,
            "vehicles_stopped_count": vehicles_stopped,
            "deliveries_at_risk_count": deliveries_at_risk,
            "deliveries_critical_count": deliveries_critical,
            "high_risk_corridors_count": high_risk_count,
            "unacknowledged_alerts_count": unack_alerts_count,
            "recent_events": recent_events,
            "corridor_risks": corridor_risks,
            "district_summaries": district_summaries
        }
        fast_cache.set("dashboard:summary", summary_data, ttl_sec=3.0)
        return summary_data
