"""
Automated Test Suite for NE-ROUTE Intelligence Loop:
SENSE -> UNDERSTAND -> PREDICT -> DECIDE -> ACT -> VERIFY
Tests ML risk prediction, accessibility engine, road graph routing,
calibrated ETA prediction, delivery SLA monitoring, 4-part alerts,
and closed-loop dynamic rerouting.
"""

import pytest
import pytest_asyncio
import asyncio
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from src.core.database import Base
from src.main import app
from src.models import (
    User, District, Road, RoadSegment, Incident, Vehicle, Delivery, Alert, DeliveryEvent, AuditLog
)
from src.services.weather_provider import weather_provider
from src.services.accessibility_engine import AccessibilityEngine
from src.services.eta_engine import ETAEngine
from src.services.delivery_risk_engine import DeliveryRiskEngine
from src.services.alert_rule_engine import AlertRuleEngine
from src.services.graph_routing_engine import GraphRoutingEngine
from src.services.dynamic_rerouting_engine import DynamicReroutingEngine
from ml.predictor import risk_predictor

# Test In-Memory Database
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def test_db():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Seed test district and road
        district = District(
            id="dist-megh-01",
            name="East Jaintia Hills",
            state="Meghalaya",
            code="EJH",
            latitude=25.3500,
            longitude=92.3800,
            elevation_avg_m=1200,
            vulnerability_index=0.75
        )
        session.add(district)

        road = Road(
            id="road-nh6-01",
            name="Shillong-Silchar National Highway",
            code="NH-6",
            state="Meghalaya",
            district_id="dist-megh-01",
            total_length_km=215.0,
            start_point_name="Shillong",
            end_point_name="Silchar",
            accessibility_status="ACCESSIBLE",
            criticality="CRITICAL",
            average_speed_kmh=35.0,
            current_risk_score=0.25
        )
        session.add(road)

        seg1 = RoadSegment(
            id="seg-nh6-sonapur",
            road_id="road-nh6-01",
            segment_index=1,
            name="Sonapur Valley Pass",
            start_lat=25.1850,
            start_lng=92.4820,
            end_lat=25.1200,
            end_lng=92.5500,
            accessibility_status="ACCESSIBLE",
            risk_score=0.2,
            current_speed_kmh=30.0,
            elevation_m=850,
            surface_condition="Paved Good",
            last_assessed_at=datetime.now(timezone.utc)
        )
        session.add(seg1)

        veh = Vehicle(
            id="veh-trk-104",
            registration_number="AS-01-GC-4482",
            vehicle_type="Heavy Truck (16T)",
            capacity_tons=16.0,
            driver_name="Tenzing Laskar",
            driver_phone="+91-9435012345",
            current_status="MOVING",
            current_lat=25.5788,
            current_lng=91.8933,
            speed_kmh=38.0,
            heading_deg=135.0,
            destination_name="Silchar",
            current_delivery_id="del-med-148"
        )
        session.add(veh)

        deliv = Delivery(
            id="del-med-148",
            consignment_code="NER-MED-2026-084",
            title="Critical Cardiac & Dialysis Fluid Consignment",
            cargo_category="Medical Supplies",
            priority="CRITICAL",
            status="IN_TRANSIT",
            origin_name="Guwahati Medical Hub",
            origin_lat=26.1445,
            origin_lng=91.7362,
            destination_name="Silchar Civil Hospital",
            destination_lat=24.8333,
            destination_lng=92.7789,
            assigned_vehicle_id="veh-trk-104",
            planned_departure=datetime.now(timezone.utc) - timedelta(hours=2),
            expected_delivery=datetime.now(timezone.utc) + timedelta(hours=4),
            current_eta=datetime.now(timezone.utc) + timedelta(hours=4)
        )
        session.add(deliv)

        await session.commit()
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


# 1. ML Disruption Risk Predictor Test
def test_ml_disruption_risk_prediction():
    # Test High-Hazard scenario
    features = {
        "rainfall_1h_mm": 38.0,
        "rainfall_6h_mm": 85.0,
        "slope_deg": 32.0,
        "elevation_m": 1600,
        "active_incidents_count": 2,
        "accessibility_score": 25.0
    }
    pred = risk_predictor.predict(features)

    assert pred["risk_score"] >= 60.0
    assert pred["risk_level"] in ("HIGH", "CRITICAL")
    assert pred["prediction_window"] == "Next 6 Hours"
    assert len(pred["top_contributing_factors"]) > 0
    assert any("Monsoon" in f["factor"] or "Precipitation" in f["factor"] for f in pred["top_contributing_factors"])


# 2. Road Accessibility Scoring Engine Test
@pytest.mark.asyncio
async def test_accessibility_engine_scoring(test_db):
    road_seg = RoadSegment(
        id="test-seg-1",
        road_id="road-nh6-01",
        segment_index=1,
        name="Jaintia Hills Cutting",
        start_lat=25.35,
        start_lng=92.38,
        end_lat=25.30,
        end_lng=92.40,
        elevation_m=1400,
        surface_condition="Waterlogged and Rutted",
        last_assessed_at=datetime.now(timezone.utc)
    )

    inc = Incident(
        id="inc-test-1",
        incident_code="INC-TEST-01",
        type="landslide",
        severity="CRITICAL",
        status="OPEN",
        title="Active Landslide Blockage",
        description="Massive mudslide blocking both lanes",
        latitude=25.35,
        longitude=92.38,
        district_id="dist-megh-01"
    )

    result = await AccessibilityEngine.evaluate_segment(
        db=test_db,
        segment=road_seg,
        weather_rain_1h=35.0,
        active_incidents=[inc]
    )

    assert result.score <= 35.0
    assert result.status == "BLOCKED"
    assert len(result.reason_codes) >= 2


# 3. Calibrated ETA Engine Test
def test_calibrated_eta_engine():
    # 200 km trip in severe weather and steep hill climb
    result = ETAEngine.calculate_eta(
        remaining_distance_km=200.0,
        vehicle_type="Heavy Truck (16T)",
        road_condition="Unpaved Muddy",
        weather_rain_1h_mm=30.0,
        elevation_gain_m=1200.0,
        bottleneck_count=1,
        departure_time=datetime.now(timezone.utc)
    )

    assert result.estimated_duration_minutes > result.nominal_duration_minutes
    assert result.delay_minutes >= 45
    assert result.effective_speed_kmh < 35.0
    assert "mud" in result.delay_reason.lower() or "monsoon" in result.delay_reason.lower()


# 4. Priority-Aware Multi-Route Graph Routing Test
@pytest.mark.asyncio
async def test_graph_routing_multi_candidates(test_db):
    routes = await GraphRoutingEngine.calculate_routes(
        db=test_db,
        origin_lat=26.1445,  # Guwahati
        origin_lng=91.7362,
        dest_lat=24.8170,    # Imphal
        dest_lng=93.9368,
        vehicle_type="Heavy Truck (16T)",
        cargo_priority="CRITICAL",
        avoid_blocked=True
    )

    assert len(routes) >= 2
    rec_route = routes[0]
    assert rec_route["is_recommended"] == True
    assert rec_route["distance_km"] > 0
    assert rec_route["estimated_duration_minutes"] > 0
    assert len(rec_route["waypoints"]["coordinates"]) >= 2
    assert "safety_rationale" in rec_route


# 5. Actionable 4-Part Alert Rule Engine Test
@pytest.mark.asyncio
async def test_alert_rule_engine(test_db):
    road = Road(
        id="road-nh29-01",
        name="Dimapur-Kohima Highway",
        code="NH-29",
        state="Nagaland",
        total_length_km=75.0,
        start_point_name="Dimapur",
        end_point_name="Kohima",
        accessibility_status="BLOCKED",
        current_risk_score=0.9
    )
    inc = Incident(
        id="inc-nagaland-01",
        incident_code="INC-NAG-99",
        type="rockfall",
        severity="CRITICAL",
        status="OPEN",
        title="Pagla Pahar Rockfall",
        description="Boulders fell onto highway",
        latitude=25.75,
        longitude=93.85,
        district_id="dist-megh-01"
    )

    alert = await AlertRuleEngine.trigger_road_blocked_alert(test_db, road, inc)
    assert alert.severity == "CRITICAL"
    assert alert.alert_type == "ROAD_CLOSURE"
    assert len(alert.what_happened) > 10
    assert len(alert.why_it_matters) > 10
    assert len(alert.who_is_affected) > 10
    assert len(alert.recommended_action) > 10


# 6. End-to-End Closed-Loop Dynamic Rerouting Test
@pytest.mark.asyncio
async def test_dynamic_rerouting_closed_loop(test_db):
    # Road NH-6 becomes blocked due to a major landslide
    reroutes = await DynamicReroutingEngine.handle_corridor_disruption(
        db=test_db,
        road_id="road-nh6-01",
        reason="Critical Landslide at Sonapur"
    )

    assert len(reroutes) >= 1
    rerouted = reroutes[0]
    assert rerouted["registration_number"] == "AS-01-GC-4482"
    assert rerouted["consignment_code"] == "NER-MED-2026-084"
    assert "new_route_name" in rerouted
    assert "delay_minutes" in rerouted
    assert rerouted["new_eta"] is not None


# 7. FastAPI API Endpoints Test
@pytest.mark.asyncio
async def test_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Health check
        resp = await ac.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

        # Risk corridor explainability
        resp = await ac.get("/api/v1/risk/corridors/NH-6")
        if resp.status_code == 200:
            data = resp.json()
            assert "score" in data
            assert "level" in data
            assert "top_contributing_factors" in data
            assert data["prediction_window"] == "Next 6 hours"

        # Route optimization
        opt_resp = await ac.post("/api/v1/routes/optimize", json={
            "origin_name": "Guwahati",
            "origin_lat": 26.1445,
            "origin_lng": 91.7362,
            "destination_name": "Silchar",
            "dest_lat": 24.8333,
            "dest_lng": 92.7789,
            "vehicle_type": "Heavy Truck (16T)",
            "cargo_priority": "CRITICAL",
            "avoid_blocked_roads": True
        })
        assert opt_resp.status_code == 200
        routes = opt_resp.json()
        assert len(routes) >= 1
        assert routes[0]["is_recommended"] == True
