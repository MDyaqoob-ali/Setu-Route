from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.services.map_service import MapService

router = APIRouter(prefix="/map", tags=["GIS Map"])

@router.get("/features")
async def get_map_features(
    bbox: Optional[str] = Query(None, description="Bounding box formatted as minLng,minLat,maxLng,maxLat"),
    layers: Optional[str] = Query("roads,incidents,vehicles,districts,weather", description="Comma-separated layers"),
    db: AsyncSession = Depends(get_db)
):
    min_lng, min_lat, max_lng, max_lat = None, None, None, None
    if bbox:
        try:
            parts = [float(p.strip()) for p in bbox.split(",")]
            if len(parts) == 4:
                min_lng, min_lat, max_lng, max_lat = parts
        except ValueError:
            pass

    return await MapService.get_features(
        db=db,
        min_lng=min_lng,
        min_lat=min_lat,
        max_lng=max_lng,
        max_lat=max_lat,
        layers=layers
    )
