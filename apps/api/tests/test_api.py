import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from src.main import app
from src.core.security import create_access_token

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "MDoNER" in data["agency"]

@pytest.mark.asyncio
async def test_auth_login_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/auth/login", json={
            "email": "admin@neroute.gov.in",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "admin@neroute.gov.in"
        assert data["user"]["role"] == "SUPER_ADMIN"

@pytest.mark.asyncio
async def test_auth_login_invalid():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/auth/login", json={
            "email": "admin@neroute.gov.in",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_dashboard_summary():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        assert "network_accessibility_percent" in data
        assert data["active_incidents_count"] > 0
        assert data["vehicles_in_transit_count"] >= 0
        assert len(data["corridor_risks"]) > 0

@pytest.mark.asyncio
async def test_list_and_create_incident():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login to get token
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "field.cachar@neroute.gov.in",
            "password": "field123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get districts to find a valid ID
        dist_resp = await client.get("/api/v1/districts")
        districts = dist_resp.json()
        assert len(districts) > 0
        district_id = districts[0]["id"]

        # 3. Create Incident
        create_resp = await client.post("/api/v1/incidents", json={
            "type": "rockfall",
            "severity": "MEDIUM",
            "title": "Minor boulder slip on approach road",
            "description": "Loose soil and small rocks cleared to shoulder by local crew.",
            "latitude": 25.5,
            "longitude": 92.2,
            "district_id": district_id,
            "address": "State Highway Km 14"
        }, headers=headers)
        assert create_resp.status_code == 200
        inc_data = create_resp.json()
        assert inc_data["type"] == "rockfall"
        assert "INC-2026" in inc_data["incident_code"]

        # 4. List Incidents
        list_resp = await client.get("/api/v1/incidents")
        assert list_resp.status_code == 200
        assert len(list_resp.json()) >= 1

@pytest.mark.asyncio
async def test_map_features_geojson():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/map/features")
        assert response.status_code == 200
        geojson = response.json()
        assert geojson["type"] == "FeatureCollection"
        assert len(geojson["features"]) > 0

@pytest.mark.asyncio
async def test_route_optimization():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/routes/optimize", json={
            "origin_name": "Guwahati Transport Terminal",
            "origin_lat": 26.1445,
            "origin_lng": 91.7362,
            "destination_name": "Imphal Wholesale Market",
            "dest_lat": 24.8170,
            "dest_lng": 93.9368,
            "vehicle_type": "Heavy Truck (16T)",
            "avoid_blocked_roads": True
        })
        assert response.status_code == 200
        routes = response.json()
        assert len(routes) >= 1
        primary = routes[0]
        assert primary["is_recommended"] is True
        assert primary["distance_km"] > 0
        assert primary["waypoints"]["type"] == "LineString"

@pytest.mark.asyncio
async def test_alert_acknowledgement():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Get unacknowledged alerts
        alerts_resp = await client.get("/api/v1/alerts?is_acknowledged=false")
        assert alerts_resp.status_code == 200
        alerts = alerts_resp.json()
        if len(alerts) > 0:
            alert_id = alerts[0]["id"]
            ack_resp = await client.post(f"/api/v1/alerts/{alert_id}/acknowledge")
            assert ack_resp.status_code == 200
            assert ack_resp.json()["is_acknowledged"] is True
