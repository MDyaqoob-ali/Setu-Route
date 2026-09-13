from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.exceptions import EntityNotFoundError
from src.schemas import VehicleResponse, VehicleLocationUpdate
from src.services.vehicle_service import VehicleService

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[VehicleResponse])
async def list_vehicles(
    status: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    vehicles = await VehicleService.get_all(
        db=db,
        status=status,
        vehicle_type=type,
        limit=limit,
        offset=offset
    )
    return vehicles

@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    vehicle = await VehicleService.get_by_id(db, vehicle_id)
    if not vehicle:
        raise EntityNotFoundError("Vehicle", vehicle_id)
    return vehicle

@router.get("/{vehicle_id}/track")
async def get_vehicle_track(vehicle_id: str, limit: int = Query(50, ge=1, le=200), db: AsyncSession = Depends(get_db)):
    track = await VehicleService.get_track(db, vehicle_id, limit=limit)
    return [
        {
            "latitude": t.latitude,
            "longitude": t.longitude,
            "speed_kmh": t.speed_kmh,
            "heading_deg": t.heading_deg,
            "recorded_at": t.recorded_at.isoformat()
        }
        for t in track
    ]

@router.post("/{vehicle_id}/location", response_model=VehicleResponse)
async def update_vehicle_location(
    vehicle_id: str,
    data: VehicleLocationUpdate,
    db: AsyncSession = Depends(get_db)
):
    vehicle = await VehicleService.update_location(db, vehicle_id, data)
    if not vehicle:
        raise EntityNotFoundError("Vehicle", vehicle_id)
    return vehicle
