import pytest
from httpx import AsyncClient, ASGITransport
from src.main import app

@pytest.mark.asyncio
async def test_statistics_overview():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/statistics/overview?range=30d")
        assert response.status_code == 200
        data = response.json()
        assert "executive_kpis" in data
        assert "impact_score" in data
        assert "before_vs_after" in data
        assert "cost_optimization" in data
        assert "automation_impact" in data
        assert "decision_speed" in data
        assert "data_sources_transparency" in data
        assert data["impact_score"]["overall"] >= 80

@pytest.mark.asyncio
async def test_statistics_routes_comparison():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/statistics/routes-comparison")
        assert response.status_code == 200
        data = response.json()
        assert "strategies" in data
        assert len(data["strategies"]) == 4

@pytest.mark.asyncio
async def test_statistics_incidents():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/statistics/incidents?range=7d")
        assert response.status_code == 200
        data = response.json()
        assert "total_incidents" in data
        assert "breakdown" in data
        assert "timeline" in data

@pytest.mark.asyncio
async def test_statistics_corridors():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/statistics/corridors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "health" in data[0]
        assert "reliability_percent" in data[0]

@pytest.mark.asyncio
async def test_statistics_regions():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/statistics/regions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

@pytest.mark.asyncio
async def test_statistics_system_performance():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/statistics/system-performance")
        assert response.status_code == 200
        data = response.json()
        assert "subsystems" in data
        assert "query_benchmarks" in data
        assert "offline_resilience" in data

@pytest.mark.asyncio
async def test_statistics_insights():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/statistics/insights")
        assert response.status_code == 200
        data = response.json()
        assert "ai_executive_summary" in data
        assert "key_insights" in data
        assert "areas_requiring_attention" in data

@pytest.mark.asyncio
async def test_statistics_report():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/statistics/report?range=30d")
        assert response.status_code == 200
        data = response.json()
        assert "title" in data
        assert "overview" in data
        assert "routes" in data
        assert "corridors" in data
