from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.exceptions import EntityNotFoundError
from src.schemas import (
    VehicleResponse, VehicleCreate, VehicleLocationUpdate,
    DriverResponse, VehicleJourneyCreate, VehicleJourneyResponse
)
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

@router.get("/drivers", response_model=List[DriverResponse])
async def get_drivers(db: AsyncSession = Depends(get_db)):
    """
    Returns available and in-transit drivers with their active vehicle assignments.
    """
    return await VehicleService.get_available_drivers(db)

@router.get("/check-reg")
async def check_registration_availability(
    reg: str = Query(..., description="Vehicle registration number to check"),
    db: AsyncSession = Depends(get_db)
):
    """
    Real-time registration check for inline validation in Add Vehicle form.
    """
    available = await VehicleService.is_registration_available(db, reg)
    return {
        "registration_number": reg.strip().upper(),
        "available": available,
        "message": "Registration number is available." if available else "Registration number is already registered in fleet."
    }

@router.post("", response_model=VehicleResponse)
async def create_vehicle(
    data: VehicleCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a standalone vehicle record in the fleet.
    """
    return await VehicleService.create(db, data)

@router.post("/journey", response_model=VehicleJourneyResponse)
async def create_vehicle_journey(
    data: VehicleJourneyCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Atomic transaction: Creates a vehicle, consignment, assigns route,
    logs initial location & dispatch event, and broadcasts telemetry.
    """
    return await VehicleService.create_journey(db, data)

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
