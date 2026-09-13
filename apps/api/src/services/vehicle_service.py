import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from src.models import (
    Vehicle, VehicleLocation, Delivery, DeliveryEvent,
    RouteRequest, RouteResult, AuditLog, User
)
from src.schemas import (
    VehicleLocationUpdate, VehicleCreate, DriverResponse,
    VehicleJourneyCreate, VehicleJourneyResponse, VehicleResponse, DeliveryResponse
)
from src.ws.connection_manager import ws_manager


def generate_uuid() -> str:
    return str(uuid.uuid4())


class VehicleService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        status: Optional[str] = None,
        vehicle_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Vehicle]:
        query = select(Vehicle).order_by(desc(Vehicle.created_at), Vehicle.registration_number)
        if status:
            query = query.where(Vehicle.current_status == status)
        if vehicle_type:
            query = query.where(Vehicle.vehicle_type == vehicle_type)
        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, vehicle_id: str) -> Optional[Vehicle]:
        query = select(Vehicle).where(Vehicle.id == vehicle_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_registration(db: AsyncSession, registration_number: str) -> Optional[Vehicle]:
        query = select(Vehicle).where(func.upper(Vehicle.registration_number) == registration_number.strip().upper())
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def is_registration_available(db: AsyncSession, registration_number: str) -> bool:
        vehicle = await VehicleService.get_by_registration(db, registration_number)
        return vehicle is None

    @staticmethod
    async def get_track(db: AsyncSession, vehicle_id: str, limit: int = 50) -> List[VehicleLocation]:
        query = (
            select(VehicleLocation)
            .where(VehicleLocation.vehicle_id == vehicle_id)
            .order_by(desc(VehicleLocation.recorded_at))
            .limit(limit)
        )
        result = await db.execute(query)
        locations = result.scalars().all()
        return list(reversed(locations))

    @staticmethod
    async def get_available_drivers(db: AsyncSession) -> List[DriverResponse]:
        """
        Gathers known drivers from users table and existing vehicle fleet.
        Computes active assignment status (AVAILABLE vs IN_TRANSIT).
        """
        # 1. Fetch active vehicles with assigned drivers
        veh_res = await db.execute(select(Vehicle))
        vehicles = veh_res.scalars().all()

        in_transit_drivers: Dict[str, str] = {}
        all_drivers: Dict[str, Dict[str, Any]] = {}

        for v in vehicles:
            d_name = v.driver_name.strip()
            if v.current_status in ["MOVING", "DELAYED", "EMERGENCY"]:
                in_transit_drivers[d_name.lower()] = v.registration_number

            if d_name.lower() not in all_drivers:
                all_drivers[d_name.lower()] = {
                    "driver_name": d_name,
                    "driver_phone": v.driver_phone,
                    "id": None,
                    "current_vehicle_reg": v.registration_number if v.current_status in ["MOVING", "DELAYED", "EMERGENCY"] else None
                }

        # 2. Fetch system users with role = DRIVER
        user_res = await db.execute(select(User).where(User.role == "DRIVER"))
        driver_users = user_res.scalars().all()

        for u in driver_users:
            key = u.full_name.strip().lower()
            if key not in all_drivers:
                all_drivers[key] = {
                    "driver_name": u.full_name,
                    "driver_phone": u.phone or "+91 98000 00000",
                    "id": u.id,
                    "current_vehicle_reg": None
                }
            else:
                all_drivers[key]["id"] = u.id

        # 3. Build response list
        result = []
        for key, info in sorted(all_drivers.items(), key=lambda x: x[1]["driver_name"]):
            status = "IN_TRANSIT" if key in in_transit_drivers else "AVAILABLE"
            result.append(DriverResponse(
                id=info.get("id"),
                driver_name=info["driver_name"],
                driver_phone=info["driver_phone"],
                status=status,
                current_vehicle_reg=in_transit_drivers.get(key)
            ))

        return result

    @staticmethod
    async def create(db: AsyncSession, data: VehicleCreate) -> Vehicle:
        """
        Creates a standalone vehicle record with duplicate prevention and initial GPS point.
        """
        clean_reg = data.registration_number.strip().upper()
        existing = await VehicleService.get_by_registration(db, clean_reg)
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Vehicle with registration '{clean_reg}' already exists."
            )

        if data.capacity_tons <= 0:
            raise HTTPException(status_code=422, detail="Vehicle capacity must be greater than zero.")

        now = datetime.now(timezone.utc)
        vehicle = Vehicle(
            id=generate_uuid(),
            registration_number=clean_reg,
            vehicle_type=data.vehicle_type,
            capacity_tons=data.capacity_tons,
            driver_name=data.driver_name.strip(),
            driver_phone=data.driver_phone.strip(),
            current_status=data.current_status or "STOPPED",
            current_lat=data.current_lat,
            current_lng=data.current_lng,
            speed_kmh=0.0,
            heading_deg=0.0,
            fuel_percent=data.fuel_percent,
            last_ping_at=now,
            destination_name=data.destination_name,
            current_delivery_id=None,
            is_sos=False,
            created_at=now,
            updated_at=now
        )
        db.add(vehicle)

        # Initial location point
        loc = VehicleLocation(
            vehicle_id=vehicle.id,
            latitude=data.current_lat,
            longitude=data.current_lng,
            speed_kmh=0.0,
            heading_deg=0.0,
            accuracy_m=5.0,
            recorded_at=now
        )
        db.add(loc)

        await db.commit()
        await db.refresh(vehicle)

        # Broadcast WebSocket event
        await ws_manager.broadcast("vehicles", "VEHICLE_LOCATION_UPDATE", {
            "id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "status": vehicle.current_status,
            "latitude": vehicle.current_lat,
            "longitude": vehicle.current_lng,
            "speed_kmh": vehicle.speed_kmh,
            "heading_deg": vehicle.heading_deg,
            "fuel_percent": vehicle.fuel_percent,
            "is_sos": vehicle.is_sos,
            "last_ping_at": vehicle.last_ping_at.isoformat(),
            "destination_name": vehicle.destination_name
        })

        return vehicle

    @staticmethod
    async def create_journey(
        db: AsyncSession,
        data: VehicleJourneyCreate,
        user_id: Optional[str] = None
    ) -> VehicleJourneyResponse:
        """
        Atomic Transaction: Creates Vehicle + Consignment + Waypoints/Route + Event + Audit.
        Enforces:
        - Duplicate registration rejection (HTTP 409)
        - Consignment payload weight <= Vehicle capacity (HTTP 422)
        - Immediate real-time WebSocket broadcast
        """
        clean_reg = data.vehicle.registration_number.strip().upper()

        # 1. Validation: Registration Uniqueness
        existing = await VehicleService.get_by_registration(db, clean_reg)
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Vehicle registration '{clean_reg}' already exists in fleet."
            )

        # 2. Validation: Payload Capacity
        if data.vehicle.capacity_tons <= 0:
            raise HTTPException(status_code=422, detail="Vehicle capacity must be greater than zero.")
        if data.consignment.weight_tons <= 0:
            raise HTTPException(status_code=422, detail="Consignment weight must be greater than zero.")

        if data.consignment.weight_tons > data.vehicle.capacity_tons:
            raise HTTPException(
                status_code=422,
                detail=f"Consignment weight ({data.consignment.weight_tons}T) exceeds vehicle payload capacity ({data.vehicle.capacity_tons}T)."
            )

        now = datetime.now(timezone.utc)
        vehicle_id = generate_uuid()
        delivery_id = generate_uuid()
        code_num = random.randint(10000, 99999)
        consignment_code = f"NER-DEL-{code_num}"

        departure = data.pickup.scheduled_time or now
        duration_min = data.selected_route.estimated_duration_minutes if data.selected_route else 240
        expected_delivery = departure + timedelta(minutes=duration_min)

        # 3. Build Models
        vehicle = Vehicle(
            id=vehicle_id,
            registration_number=clean_reg,
            vehicle_type=data.vehicle.vehicle_type,
            capacity_tons=data.vehicle.capacity_tons,
            driver_name=data.vehicle.driver_name.strip(),
            driver_phone=data.vehicle.driver_phone.strip(),
            current_status=data.vehicle.initial_status or "STOPPED",
            current_lat=data.pickup.lat,
            current_lng=data.pickup.lng,
            speed_kmh=0.0,
            heading_deg=0.0,
            fuel_percent=data.vehicle.fuel_percent or 90.0,
            last_ping_at=now,
            destination_name=data.destination.name,
            current_delivery_id=delivery_id,
            is_sos=False,
            created_at=now,
            updated_at=now
        )
        db.add(vehicle)

        delivery = Delivery(
            id=delivery_id,
            consignment_code=consignment_code,
            title=data.consignment.title,
            cargo_category=data.consignment.cargo_category,
            cargo_description=data.consignment.cargo_description or "",
            weight_tons=data.consignment.weight_tons,
            priority=data.consignment.priority or "NORMAL",
            status="PLANNED",
            origin_name=data.pickup.name,
            origin_lat=data.pickup.lat,
            origin_lng=data.pickup.lng,
            destination_name=data.destination.name,
            destination_lat=data.destination.lat,
            destination_lng=data.destination.lng,
            assigned_vehicle_id=vehicle_id,
            planned_departure=departure,
            expected_delivery=expected_delivery,
            current_eta=expected_delivery,
            delay_minutes=0,
            risk_level=data.selected_route.risk_level if data.selected_route else "LOW",
            created_at=now,
            updated_at=now
        )
        db.add(delivery)

        loc = VehicleLocation(
            vehicle_id=vehicle_id,
            latitude=data.pickup.lat,
            longitude=data.pickup.lng,
            speed_kmh=0.0,
            heading_deg=0.0,
            accuracy_m=5.0,
            recorded_at=now
        )
        db.add(loc)

        route_title = data.selected_route.route_name if data.selected_route else "Direct Corridor"
        event = DeliveryEvent(
            delivery_id=delivery_id,
            event_type="CREATED",
            title="Consignment Manifest Registered & Dispatched",
            description=f"Vehicle {vehicle.registration_number} ({vehicle.vehicle_type}) assigned with {data.consignment.title} ({data.consignment.weight_tons}T) along route: {route_title}.",
            latitude=data.pickup.lat,
            longitude=data.pickup.lng,
            created_at=now
        )
        db.add(event)

        # Store Selected Route Record if provided
        route_summary = None
        if data.selected_route:
            route_req = RouteRequest(
                id=generate_uuid(),
                origin_name=data.pickup.name,
                origin_lat=data.pickup.lat,
                origin_lng=data.pickup.lng,
                destination_name=data.destination.name,
                dest_lat=data.destination.lat,
                dest_lng=data.destination.lng,
                vehicle_type=data.vehicle.vehicle_type,
                cargo_priority=data.consignment.priority or "NORMAL",
                avoid_blocked_roads=True,
                created_at=now
            )
            db.add(route_req)
            await db.flush()

            waypoints_geo = data.selected_route.waypoints_geojson or {
                "type": "LineString",
                "coordinates": [[data.pickup.lng, data.pickup.lat], [data.destination.lng, data.destination.lat]]
            }
            route_res = RouteResult(
                id=generate_uuid(),
                request_id=route_req.id,
                route_name=data.selected_route.route_name,
                distance_km=data.selected_route.distance_km,
                estimated_duration_minutes=data.selected_route.estimated_duration_minutes,
                risk_score=data.selected_route.risk_score,
                risk_level=data.selected_route.risk_level,
                waypoints_geojson=waypoints_geo,
                is_recommended=data.selected_route.is_recommended if data.selected_route.is_recommended is not None else True,
                created_at=now
            )
            db.add(route_res)

            route_summary = {
                "route_name": data.selected_route.route_name,
                "distance_km": data.selected_route.distance_km,
                "estimated_duration_minutes": data.selected_route.estimated_duration_minutes,
                "risk_level": data.selected_route.risk_level,
                "route_status": data.selected_route.route_status
            }

        audit = AuditLog(
            user_id=user_id,
            action="VEHICLE_JOURNEY_CREATED",
            entity_type="vehicle",
            entity_id=vehicle_id,
            details_json={
                "registration": clean_reg,
                "delivery_id": delivery_id,
                "consignment_code": consignment_code,
                "driver": vehicle.driver_name,
                "cargo": data.consignment.title,
                "origin": data.pickup.name,
                "destination": data.destination.name,
                "route": route_title
            },
            created_at=now
        )
        db.add(audit)

        # Commit Transaction
        await db.commit()
        await db.refresh(vehicle)
        await db.refresh(delivery)

        # Real-time WebSocket broadcasts
        await ws_manager.broadcast("vehicles", "VEHICLE_LOCATION_UPDATE", {
            "id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "status": vehicle.current_status,
            "latitude": vehicle.current_lat,
            "longitude": vehicle.current_lng,
            "speed_kmh": vehicle.speed_kmh,
            "heading_deg": vehicle.heading_deg,
            "fuel_percent": vehicle.fuel_percent,
            "is_sos": vehicle.is_sos,
            "last_ping_at": vehicle.last_ping_at.isoformat(),
            "destination_name": vehicle.destination_name
        })

        await ws_manager.broadcast("deliveries", "DELIVERY_UPDATED", {
            "id": delivery.id,
            "consignment_code": delivery.consignment_code,
            "status": delivery.status,
            "assigned_vehicle_id": delivery.assigned_vehicle_id,
            "origin_name": delivery.origin_name,
            "destination_name": delivery.destination_name
        })

        return VehicleJourneyResponse(
            success=True,
            message=f"Vehicle {vehicle.registration_number} registered with consignment {delivery.consignment_code} along {route_title}.",
            vehicle=VehicleResponse.model_validate(vehicle),
            delivery=DeliveryResponse.model_validate(delivery),
            route_summary=route_summary
        )

    @staticmethod
    async def update_location(db: AsyncSession, vehicle_id: str, data: VehicleLocationUpdate) -> Optional[Vehicle]:
        vehicle = await VehicleService.get_by_id(db, vehicle_id)
        if not vehicle:
            return None

        now = datetime.now(timezone.utc)
        vehicle.current_lat = data.latitude
        vehicle.current_lng = data.longitude
        vehicle.speed_kmh = data.speed_kmh
        vehicle.heading_deg = data.heading_deg
        vehicle.last_ping_at = now
        vehicle.updated_at = now

        if data.fuel_percent is not None:
            vehicle.fuel_percent = data.fuel_percent
        if data.is_sos is not None:
            vehicle.is_sos = data.is_sos
            if data.is_sos:
                vehicle.current_status = "EMERGENCY"

        if not vehicle.is_sos:
            if data.speed_kmh > 5.0:
                vehicle.current_status = "MOVING"
            else:
                vehicle.current_status = "STOPPED"

        loc = VehicleLocation(
            vehicle_id=vehicle.id,
            latitude=data.latitude,
            longitude=data.longitude,
            speed_kmh=data.speed_kmh,
            heading_deg=data.heading_deg,
            accuracy_m=data.accuracy_m,
            recorded_at=now
        )
        db.add(loc)
        await db.commit()
        await db.refresh(vehicle)

        await ws_manager.broadcast("vehicles", "VEHICLE_LOCATION_UPDATE", {
            "id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "status": vehicle.current_status,
            "latitude": vehicle.current_lat,
            "longitude": vehicle.current_lng,
            "speed_kmh": vehicle.speed_kmh,
            "heading_deg": vehicle.heading_deg,
            "fuel_percent": vehicle.fuel_percent,
            "is_sos": vehicle.is_sos,
            "last_ping_at": vehicle.last_ping_at.isoformat()
        })

        return vehicle
