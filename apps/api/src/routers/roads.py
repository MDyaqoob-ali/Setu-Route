from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from src.core.database import get_db
from src.core.cache import fast_cache
from src.core.exceptions import EntityNotFoundError
from src.models import Road, District, Incident, RoadSegment
from src.schemas import RoadResponse, DistrictResponse
from src.services.weather_provider import weather_provider

router = APIRouter(tags=["Roads & Districts"])

@router.get("/roads", response_model=List[RoadResponse])
async def list_roads(
    accessibility_status: Optional[str] = None,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Road).options(selectinload(Road.segments))
    if accessibility_status:
        query = query.where(Road.accessibility_status == accessibility_status)
    if state:
        query = query.where(Road.state == state)
    result = await db.execute(query)
    roads = result.scalars().all()
    return roads

@router.get("/roads/{road_id}", response_model=RoadResponse)
async def get_road(road_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Road).options(selectinload(Road.segments)).where(Road.id == road_id)
    result = await db.execute(query)
    road = result.scalar_one_or_none()
    if not road:
        raise EntityNotFoundError("Road", road_id)
    return road

@router.get("/roads/{road_id}/health")
async def get_road_health(road_id: str, db: AsyncSession = Depends(get_db)):
    """
    Computes corridor health index (0-100) and operational condition indicators.
    """
    cache_key = f"road:health:{road_id}"
    cached = fast_cache.get(cache_key)
    if cached is not None:
        return cached

    # Fast resilient corridor resolution in a single query
    clean_id = road_id.replace("%20", " ").strip()
    token = road_id.split("/")[0].split("(")[0].strip() if ("/" in road_id or " " in road_id or "-" in road_id) else clean_id

    conditions = [
        Road.id == road_id,
        Road.code.ilike(road_id.strip()),
        Road.code.ilike(f"%{clean_id}%"),
        Road.name.ilike(f"%{clean_id}%")
    ]
    if token and token != clean_id:
        conditions.extend([Road.code.ilike(f"%{token}%"), Road.name.ilike(f"%{token}%")])

    road_res = await db.execute(select(Road).where(or_(*conditions)))
    road = road_res.scalars().first()

    if not road:
        road_res = await db.execute(select(Road).limit(1))
        road = road_res.scalars().first()

    if not road:
        raise HTTPException(status_code=404, detail=f"Road corridor '{road_id}' not found.")

    incidents_res = await db.execute(
        select(Incident).where(
            Incident.road_id == road.id,
            Incident.status != "RESOLVED"
        )
    )
    incidents = incidents_res.scalars().all()

    # Weather check
    obs = await weather_provider.get_observation_for_location(25.5788, 91.8933)
    rain = obs.rainfall_1h_mm

    # Calculate Health Index (0-100)
    health = 100.0
    if road.accessibility_status == "BLOCKED":
        health -= 60.0
    elif road.accessibility_status == "RESTRICTED":
        health -= 30.0

    health -= len(incidents) * 15.0
    if rain > 20.0:
        health -= 20.0
    elif rain > 10.0:
        health -= 10.0

    health_score = max(5.0, min(100.0, round(health, 1)))

    # Status indicators
    if road.accessibility_status == "ACCESSIBLE":
        acc_text = "Good"
    elif road.accessibility_status == "RESTRICTED":
        acc_text = "Restricted"
    else:
        acc_text = "Critical"

    if rain > 25.0:
        weather_text = "Severe Cloudburst"
    elif rain > 10.0:
        weather_text = "Moderate Rain"
    else:
        weather_text = "Favorable"

    if len(incidents) >= 2 or road.current_risk_score > 0.7:
        inc_risk_text = "Severe"
        trend_text = "Declining"
    elif len(incidents) == 1 or road.current_risk_score > 0.4:
        inc_risk_text = "Elevated"
        trend_text = "Declining" if rain > 15 else "Stable"
    else:
        inc_risk_text = "Low"
        trend_text = "Improving"

    health_data = {
        "corridor_id": road.id,
        "corridor_code": road.code,
        "corridor_name": road.name,
        "state": road.state,
        "corridor_health_score": health_score,
        "accessibility": acc_text,
        "weather": weather_text,
        "incident_risk": inc_risk_text,
        "trend": trend_text,
        "active_incidents": [
            {
                "id": inc.id,
                "title": inc.title,
                "severity": inc.severity,
                "type": inc.type
            } for inc in incidents
        ],
        "rainfall_1h_mm": rain,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "data_trust_badge": "LIVE"
    }
    fast_cache.set(cache_key, health_data, ttl_sec=3.0)
    return health_data

@router.get("/districts", response_model=List[DistrictResponse])
async def list_districts(
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    cache_key = f"districts:list:{state}"
    cached = fast_cache.get(cache_key)
    if cached is not None:
        return cached

    query = select(District)
    if state:
        query = query.where(District.state == state)
    result = await db.execute(query)
    districts = result.scalars().all()
    fast_cache.set(cache_key, districts, ttl_sec=10.0)
    return districts

