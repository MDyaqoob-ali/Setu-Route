"""
Comprehensive Automated Test Suite for NE-ROUTE External Intelligence & Real-World Blockage Detection.
Covers:
1. Source Registry & Trust Model (Level 1 Official to Level 4 Unverified)
2. Normalization & Spatial Bounding Box Validation
3. Deduplication, Multi-Source Corroboration & Confidence Scoring
4. RouteIncidentCorrelator (Direct Blockage Intersection vs. Distant Route)
5. REST API Endpoints (/intelligence/summary, /intelligence/sources, /intelligence/incidents)
"""

import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from src.core.database import Base
from src.main import app
from src.models import (
    Incident, Road, RoadSegment, District, SourceHealth
)
from src.services.external_intelligence.source_registry import SourceRegistry, SourceTrustLevel, is_point_in_ner
from src.services.external_intelligence.normalizer import IncidentNormalizer, compute_freshness, sanitize_text
from src.services.external_intelligence.deduplication_engine import IncidentDeduplicationEngine
from src.services.route_incident_correlator import RouteIncidentCorrelator

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def test_db():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Seed test district and roads
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

        road_nh6 = Road(
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
        session.add(road_nh6)

        road_nh29 = Road(
            id="road-nh29-01",
            name="Dimapur-Kohima Highway",
            code="NH-29",
            state="Nagaland",
            district_id="dist-megh-01",
            total_length_km=75.0,
            start_point_name="Dimapur",
            end_point_name="Kohima",
            accessibility_status="ACCESSIBLE",
            criticality="CRITICAL",
            average_speed_kmh=40.0,
            current_risk_score=0.30
        )
        session.add(road_nh29)

        # Pre-seed verified external incident on NH-6 Sonapur
        inc_sonapur = Incident(
            id="inc-ext-001",
            incident_code="USGS-2026-NE-01",
            type="landslide",
            severity="CRITICAL",
            status="OPEN",
            title="Massive Landslide Debris at Sonapur Pass",
            description="Slope failure blocked both carriageways near Sonapur Tunnel.",
            latitude=25.1850,
            longitude=92.4820,
            road_id="road-nh6-01",
            affected_road_code="NH-6",
            district_id="dist-megh-01",
            source_name="USGS Earthquake Hazards / Geological Survey",
            source_url="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php",
            source_trust_level="OFFICIAL",
            confidence_score=0.95,
            verification_status="VERIFIED",
            is_live_external=True,
            created_at=datetime.now(timezone.utc)
        )
        session.add(inc_sonapur)

        # Pre-seed source health entries
        for src in SourceRegistry.list_sources():
            sh = SourceHealth(
                id=f"sh-{src.source_id}",
                source_name=src.name,
                source_category=src.category.value,
                trust_level=src.trust_level.value,
                status="ONLINE",
                last_sync_at=datetime.now(timezone.utc),
                incident_count=5,
                last_latency_ms=210,
                endpoint_url=src.endpoint_url
            )
            session.add(sh)

        await session.commit()
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_source_registry_trust_levels():
    """Verify registered sources have strict trust levels and valid categories."""
    sources = SourceRegistry.list_sources()
    assert len(sources) >= 4

    usgs = SourceRegistry.get_source("usgs_earthquakes")
    assert usgs is not None
    assert usgs.trust_level == SourceTrustLevel.OFFICIAL

    gdacs = SourceRegistry.get_source("gdacs_disasters")
    assert gdacs is not None
    assert gdacs.trust_level == SourceTrustLevel.OFFICIAL

    openmeteo = SourceRegistry.get_source("openmeteo_weather")
    assert openmeteo is not None
    assert openmeteo.trust_level == SourceTrustLevel.VERIFIED_PROVIDER

    eastmojo = SourceRegistry.get_source("eastmojo_news")
    assert eastmojo is not None
    assert eastmojo.trust_level == SourceTrustLevel.REPUTABLE_NEWS


@pytest.mark.asyncio
async def test_intelligence_normalizer_validation():
    """Verify normalizer validates Northeast India coordinates and tags freshness."""
    # Valid Sonapur, Meghalaya coordinate
    valid_raw = {
        "source_event_id": "usgs_test_001",
        "title": "M5.2 Earthquake near Shillong Plateau",
        "description": "Earthquake triggered slope instability.",
        "latitude": 25.5788,
        "longitude": 91.8933,
        "reported_at": datetime.now(timezone.utc),
        "type": "landslide",
        "severity": "HIGH",
        "source_name": "USGS Earthquake Hazards",
        "source_url": "https://earthquake.usgs.gov",
        "source_trust_level": SourceTrustLevel.OFFICIAL.value
    }
    normalized = IncidentNormalizer.normalize(valid_raw)
    assert normalized is not None
    assert normalized["freshness_state"] == "LIVE"
    assert normalized["confidence_score"] >= 0.85
    assert is_point_in_ner(normalized["latitude"], normalized["longitude"]) is True

    # Out of bounds check using is_point_in_ner
    assert is_point_in_ner(28.6139, 77.2090) is False  # New Delhi
    assert is_point_in_ner(19.0760, 72.8777) is False  # Mumbai


@pytest.mark.asyncio
async def test_deduplication_multi_source_merging():
    """Verify nearby incidents from multiple sources are clustered and confidence boosted."""
    now = datetime.now(timezone.utc)
    ev1 = IncidentNormalizer.normalize({
        "source_event_id": "ev_usgs_1",
        "title": "Seismic Landslide on NH-6",
        "description": "Rockfall near Sonapur pass",
        "latitude": 25.1850,
        "longitude": 92.4820,
        "reported_at": now,
        "type": "landslide",
        "severity": "HIGH",
        "source_name": "USGS Earthquake Hazards",
        "source_trust_level": "OFFICIAL",
        "confidence_score": 0.85
    })
    ev2 = IncidentNormalizer.normalize({
        "source_event_id": "ev_gdacs_1",
        "title": "Landslide Report Sonapur Meghalaya",
        "description": "Severe debris slide blocking highway",
        "latitude": 25.1870,  # ~250m away
        "longitude": 92.4840,
        "reported_at": now + timedelta(minutes=15),
        "type": "landslide",
        "severity": "CRITICAL",
        "source_name": "GDACS Floods and Slides",
        "source_trust_level": "OFFICIAL",
        "confidence_score": 0.90
    })

    canonical_list = IncidentDeduplicationEngine.deduplicate([ev1, ev2])
    # Both events within 5km and same day should merge into 1 canonical record
    assert len(canonical_list) == 1
    merged = canonical_list[0]
    # Multi-source corroboration boosts confidence
    assert merged["confidence_score"] > 0.90
    assert len(merged["sources"]) == 2
    assert merged["verification_status"] == "CONFIRMED"
    assert merged["severity"] == "CRITICAL"


@pytest.mark.asyncio
async def test_route_incident_correlator_blocked_route(test_db):
    """Verify that a route passing directly through a blocked corridor is identified as BLOCKED."""
    # Route passing directly over Sonapur, NH-6
    route_coords = [
        [91.8933, 25.5788], # Shillong
        [92.3500, 25.3000], # Jowai
        [92.4820, 25.1850], # Sonapur (BLOCKED!)
        [92.7789, 24.8333]  # Silchar
    ]

    result = await RouteIncidentCorrelator.correlate_route(
        db=test_db,
        route_coordinates=route_coords,
        origin_name="Shillong, Meghalaya",
        destination_name="Silchar, Assam"
    )

    assert result["is_blocked"] is True
    assert result["route_status"] == "RED"
    assert "BLOCKED" in result["status_badge"]
    assert len(result["blocked_segments"]) >= 1
    blocked_seg = result["blocked_segments"][0]
    assert blocked_seg["road_code"] == "NH-6"
    assert "Landslide" in blocked_seg["cause"]
    assert blocked_seg["source"] != ""


@pytest.mark.asyncio
async def test_route_incident_correlator_clear_route(test_db):
    """Verify that a route far away from the incident corridor remains CLEAR."""
    # Distant route in Assam / Arunachal plains (Guwahati to Tezpur)
    distant_route_coords = [
        [91.7362, 26.1445], # Guwahati
        [92.2000, 26.3500], # Nagaon bypass
        [92.7926, 26.6528]  # Tezpur
    ]

    result = await RouteIncidentCorrelator.correlate_route(
        db=test_db,
        route_coordinates=distant_route_coords,
        origin_name="Guwahati, Assam",
        destination_name="Tezpur, Assam"
    )

    assert result["is_blocked"] is False
    assert result["route_status"] == "GREEN"
    assert "CLEAR" in result["status_badge"]
    assert len(result["blocked_segments"]) == 0


@pytest.mark.asyncio
async def test_intelligence_rest_endpoints(test_db):
    """Test /api/v1/intelligence/summary, /sources, and /incidents endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Summary
        resp = await client.get("/api/v1/intelligence/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert "active_incidents" in data
        assert "road_closures" in data
        assert "sources_online" in data
        assert data["total_sources"] >= 4

        # 2. Sources
        resp_sources = await client.get("/api/v1/intelligence/sources")
        assert resp_sources.status_code == 200
        sources_list = resp_sources.json()
        assert len(sources_list) >= 4
        source_names = [s["source_name"] for s in sources_list]
        assert any("USGS" in n for n in source_names)
        assert any("GDACS" in n for n in source_names)

        # 3. Incidents
        resp_inc = await client.get("/api/v1/intelligence/incidents")
        assert resp_inc.status_code == 200
        inc_list = resp_inc.json()
        assert isinstance(inc_list, list)
        if len(inc_list) > 0:
            first = inc_list[0]
            assert "source_name" in first
            assert "confidence_score" in first
            assert "freshness_state" in first
