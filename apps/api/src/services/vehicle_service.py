from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from src.models import Vehicle, VehicleLocation, Delivery
from src.schemas import VehicleLocationUpdate
from src.ws.connection_manager import ws_manager

class VehicleService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        status: Optional[str] = None,
        vehicle_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Vehicle]:
        query = select(Vehicle).order_by(Vehicle.registration_number)
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

        # Record history location
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

        # Broadcast real-time location update
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
