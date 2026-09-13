from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.exceptions import EntityNotFoundError
from src.schemas import DeliveryResponse, DeliveryCreate, DeliveryUpdate, DeliveryEventResponse
from src.services.delivery_service import DeliveryService

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])

@router.get("", response_model=List[DeliveryResponse])
async def list_deliveries(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    cargo_category: Optional[str] = None,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    deliveries = await DeliveryService.get_all(
        db=db,
        status=status,
        priority=priority,
        cargo_category=cargo_category,
        limit=limit,
        offset=offset
    )
    return deliveries

@router.post("", response_model=DeliveryResponse)
async def create_delivery(
    data: DeliveryCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DeliveryService.create(db, data)

@router.get("/{delivery_id}", response_model=DeliveryResponse)
async def get_delivery(delivery_id: str, db: AsyncSession = Depends(get_db)):
    delivery = await DeliveryService.get_by_id(db, delivery_id)
    if not delivery:
        raise EntityNotFoundError("Delivery", delivery_id)
    return delivery

@router.patch("/{delivery_id}", response_model=DeliveryResponse)
async def update_delivery(
    delivery_id: str,
    data: DeliveryUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    delivery = await DeliveryService.update(db, delivery_id, data)
    if not delivery:
        raise EntityNotFoundError("Delivery", delivery_id)
    return delivery

@router.get("/{delivery_id}/events", response_model=List[DeliveryEventResponse])
async def get_delivery_events(delivery_id: str, db: AsyncSession = Depends(get_db)):
    return await DeliveryService.get_events(db, delivery_id)
