from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.services.statistics_service import StatisticsService

router = APIRouter(prefix="/statistics", tags=["Statistics & Impact"])

@router.get("/overview")
async def get_overview(
    range: str = Query("30d", description="Time range (24h, 7d, 30d, 90d, custom)"),
    state: Optional[str] = Query(None, description="Filter by NER State"),
    corridor_id: Optional[str] = Query(None, description="Filter by Road Corridor ID"),
    incident_type: Optional[str] = Query(None, description="Filter by Incident Type"),
    risk_level: Optional[str] = Query(None, description="Filter by Risk Level"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns executive KPIs, SETU-ROUTE Impact Score, Before vs After comparisons,
    cost savings breakdown, automation & decision speed metrics.
    """
    return await StatisticsService.get_overview(
        range_str=range,
        state=state,
        corridor_id=corridor_id,
        incident_type=incident_type,
        risk_level=risk_level,
        db=db
    )

@router.get("/routes-comparison")
async def get_routes_comparison(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns comparative evaluation metrics for the 4 candidate graph routing strategies:
    Recommended, Fastest, Lowest-Risk, and Alternative Bypass.
    """
    return await StatisticsService.get_four_routes_comparison(db=db)

@router.get("/incidents")
async def get_incidents_performance(
    range: str = Query("30d", description="Time range (24h, 7d, 30d, 90d)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns incident resolution statistics, hazard category distribution, and verification rates.
    """
    return await StatisticsService.get_incident_performance(range_str=range, db=db)

@router.get("/corridors")
async def get_corridor_rankings(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns ranked performance matrix for all 8 monitored North Eastern highway arteries.
    """
    return await StatisticsService.get_corridor_rankings(db=db)

@router.get("/regions")
async def get_regional_rankings(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns accessibility and resilience rankings for all 8 North Eastern states.
    """
    return await StatisticsService.get_regional_rankings(db=db)

@router.get("/system-performance")
async def get_system_performance(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns real-time sub-system health, API latencies (Avg, P95), and offline sync resilience metrics.
    """
    return await StatisticsService.get_system_performance(db=db)

@router.get("/insights")
async def get_insights_and_attention(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns dynamic AI-generated Executive Summary, Key Insights, and Areas Requiring Attention.
    """
    return await StatisticsService.get_insights_and_attention(db=db)

@router.get("/report")
async def get_management_report(
    range: str = Query("30d", description="Time range"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns complete consolidated data package formatted for the MDoNER Management Impact Report.
    """
    overview = await StatisticsService.get_overview(range_str=range, db=db)
    routes = await StatisticsService.get_four_routes_comparison(db=db)
    incidents = await StatisticsService.get_incident_performance(range_str=range, db=db)
    corridors = await StatisticsService.get_corridor_rankings(db=db)
    regions = await StatisticsService.get_regional_rankings(db=db)
    system = await StatisticsService.get_system_performance(db=db)
    insights = await StatisticsService.get_insights_and_attention(db=db)

    return {
        "title": "MDoNER Logistics Intelligence & Operational Impact Report",
        "ministry": "Ministry of Development of North Eastern Region (MDoNER), Government of India",
        "generated_at": overview.get("time_range"),
        "reporting_period": overview.get("period_label"),
        "overview": overview,
        "routes": routes,
        "incidents": incidents,
        "corridors": corridors,
        "regions": regions,
        "system": system,
        "insights": insights
    }
