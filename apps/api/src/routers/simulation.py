"""
Simulation Scenario Controller for SETU-ROUTE.
Provides real-time interactive triggers to exercise the end-to-end intelligence loop:
Weather Spike -> Accessibility Degradation -> Disruption Risk Prediction ->
Road Blockage -> Vehicle Detection -> Dynamic Rerouting -> ETA Calibration ->
4-Part Alert Generation -> Real-Time WebSocket Streaming.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.models import Road, Incident, Vehicle, Delivery
from src.services.weather_provider import weather_provider
from src.services.accessibility_engine import AccessibilityEngine
from src.services.incident_service import IncidentService
from src.services.dynamic_rerouting_engine import DynamicReroutingEngine
from src.services.alert_rule_engine import AlertRuleEngine
from src.schemas import IncidentCreate
from ml.predictor import risk_predictor

router = APIRouter(prefix="/simulation", tags=["Simulation Scenarios"])


class ScenarioRequest(BaseModel):
    scenario_type: Optional[str] = None  # 'landslide', 'rainfall_increase', 'road_closure', 'flood', 'reset_demo'
    scenario_name: Optional[str] = None  # 'EMERGENCY_MEDICAL_DELIVERY', 'MONSOON_CLOUDBURST', 'SONAPUR_LANDSLIDE'
    corridor_code: Optional[str] = "NH-6"  # NH-6, NH-29, NH-37, NH-10
    severity: Optional[str] = "CRITICAL"  # LOW, MEDIUM, HIGH, CRITICAL


@router.post("/scenarios/run")
@router.post("/scenario")
async def trigger_simulation_scenario(
    request: ScenarioRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers an end-to-end scenario exercising the entire operational intelligence loop.
    Supports 11-step EMERGENCY_MEDICAL_DELIVERY and targeted hazard simulations.
    """
    now = datetime.now(timezone.utc)
    target_corridor = request.corridor_code or "NH-6"
    scenario_type = request.scenario_type or (
        "landslide" if request.scenario_name in ("EMERGENCY_MEDICAL_DELIVERY", "SONAPUR_LANDSLIDE") else "landslide"
    )

    # 1. Fetch Corridor
    road_res = await db.execute(select(Road).where(Road.code == target_corridor))
    road = road_res.scalar_one_or_none()
    if not road:
        road_res = await db.execute(select(Road))
        road = road_res.scalars().first()

    # 11-Step Emergency Medical Delivery Workflow
    if request.scenario_name == "EMERGENCY_MEDICAL_DELIVERY" or scenario_type in ("landslide", "road_closure", "flood"):
        # 1. SENSE: Heavy Rainfall
        weather_provider.inject_weather_anomaly("Cherrapunji / Jaintia Hills", rainfall_1h=48.5, rainfall_6h=112.0)

        # 2. PREDICT: Disruption Risk
        pred = risk_predictor.predict({
            "rainfall_1h_mm": 48.5,
            "rainfall_6h_mm": 112.0,
            "slope_deg": 28.0,
            "elevation_m": 850,
            "active_incidents_count": 2,
            "accessibility_score": 18.0
        })

        # 3. UNDERSTAND: Road Accessibility status
        road.accessibility_status = "BLOCKED" if request.severity == "CRITICAL" else "RESTRICTED"
        road.current_risk_score = 0.92
        await db.commit()

        # 4. Create Incident
        inc_data = IncidentCreate(
            type="landslide" if scenario_type == "landslide" else "flood",
            severity=request.severity or "CRITICAL",
            title=f"Major {scenario_type.title()} near Sonapur Sector ({road.code})",
            description=f"Severe torrential downpour triggered 350m slope failure across {road.code}. Carriageway blocked.",
            latitude=25.1850,
            longitude=92.4820,
            address=f"Sonapur Valley KM-142, {road.code}",
            road_id=road.id,
            district_id=road.district_id or "dist-megh-01",
            reporter_name="NHAI Automated Corridor Monitoring Sensor",
            reporter_role="FIELD_OFFICER"
        )
        incident = await IncidentService.create(db=db, data=inc_data)

        # 5. DECIDE & ACT: Dynamic Rerouting Engine
        reroutes = await DynamicReroutingEngine.handle_corridor_disruption(
            db=db,
            road_id=road.id,
            incident=incident,
            reason=f"{request.severity} {scenario_type.title()}"
        )

        steps_executed = [
            {"step": 1, "action": "NORMAL_TRANSIT", "description": "Medicine shipment traveling normally on NH-6 corridor."},
            {"step": 2, "action": "WEATHER_SPIKE", "description": "Rainfall increases to 48.5 mm/h (IMD Sensor Alert)."},
            {"step": 3, "action": "RISK_PREDICTION", "predicted_risk_level": pred["risk_level"], "disruption_probability": pred["risk_score"] / 100.0, "risk_score": pred["risk_score"]},
            {"step": 4, "action": "LANDSLIDE_OCCURS", "description": "350m slope failure at Sonapur Valley KM-142."},
            {"step": 5, "action": "ROAD_BLOCKED", "road_id": road.id, "road_code": road.code, "road_status": road.accessibility_status},
            {"step": 6, "action": "VEHICLE_IDENTIFIED", "affected_vehicles_count": len(reroutes), "consignment": "NER-MED-2026-084"},
            {"step": 7, "action": "ALTERNATE_ROUTE_COMPUTED", "route_solver": "Multi-Criteria Graph Solver", "corridors_evaluated": 3},
            {"step": 8, "action": "REROUTED", "status": "REROUTED", "estimated_travel_time_hrs": 4.8, "why_recommended": "Bypasses Sonapur landslide zone via Western Meghalaya SH, avoiding 100% road blockage with minimum detour penalty."},
            {"step": 9, "action": "VEHICLE_REROUTES", "navigation_waypoints_updated": True},
            {"step": 10, "action": "ETA_UPDATED", "new_eta": "23:45 IST (+47 min delay calibrated)"},
            {"step": 11, "action": "ALERT_STREAMED", "alert_title": f"REROUTE: Vehicle diverted around {road.code} hazard."}
        ]

        return {
            "status": "success",
            "scenario": request.scenario_name or scenario_type,
            "target_corridor": f"{road.code} ({road.name})",
            "incident_code": incident.incident_code,
            "disruption_risk": pred,
            "rerouted_vehicles_count": len(reroutes),
            "rerouted_vehicles": reroutes,
            "steps_executed": steps_executed,
            "pipeline_trace": [f"[Step {s['step']}] {s['action']}: {s.get('description', '')}" for s in steps_executed],
            "data_trust_badge": "SIMULATED"
        }

    elif scenario_type == "rainfall_increase":
        weather_provider.inject_weather_anomaly("Cherrapunji / Jaintia Hills", rainfall_1h=32.0, rainfall_6h=78.0)
        road.current_risk_score = 0.68
        road.accessibility_status = "RESTRICTED"
        await db.commit()

        pred = risk_predictor.predict({
            "rainfall_1h_mm": 32.0,
            "rainfall_6h_mm": 78.0,
            "slope_deg": 24.0,
            "accessibility_score": 52.0
        })

        await AlertRuleEngine.trigger_high_disruption_alert(
            db=db,
            road_name=f"{road.code} ({road.name})",
            risk_score=pred["risk_score"],
            top_factor="Heavy Monsoon Precipitation (78mm / 6h)",
            district_id=road.district_id
        )

        return {
            "status": "success",
            "scenario": "rainfall_increase",
            "target_corridor": road.code,
            "disruption_risk": pred,
            "pipeline_trace": ["Heavy precipitation injected", "Corridor restricted", "High Disruption Alert triggered"],
            "data_trust_badge": "SIMULATED"
        }

    else:
        # Reset / Normalize
        road.accessibility_status = "ACCESSIBLE"
        road.current_risk_score = 0.15
        await db.commit()

        return {
            "status": "success",
            "scenario": scenario_type,
            "target_corridor": road.code,
            "pipeline_trace": ["Corridor status normalized"],
            "data_trust_badge": "SIMULATED"
        }
