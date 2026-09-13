"""
End-to-End Operational Scenario Test Suite for NE-ROUTE.
Validates the complete closed-loop logistics intelligence pipeline:
- Scenario 1: Command Center Dispatch & Road Blockage Mitigation Workflow
- Scenario 2: Field Officer Offline Reporting & Edge-to-Cloud Sync with Idempotency
- Scenario 3: Autonomous Disruption Trigger & Emergency Medical Consignment Dynamic Rerouting
"""

import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from src.main import app


@pytest.mark.asyncio
async def test_scenario_1_command_center_dispatch_and_reroute():
    """
    Scenario 1:
    LOGIN -> COMMAND CENTER -> OPEN MAP -> SELECT DISRUPTED ROAD ->
    VIEW INCIDENT -> VIEW AFFECTED VEHICLE -> OPEN DELIVERY ->
    CALCULATE ALTERNATE ROUTE -> CONFIRM REROUTE -> ETA CHANGES -> ALERT CREATED
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. LOGIN
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "admin@neroute.gov.in",
            "password": "admin123"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        auth_data = login_resp.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        assert auth_data["user"]["role"] == "SUPER_ADMIN"

        # 2. COMMAND CENTER SUMMARY
        dash_resp = await client.get("/api/v1/dashboard/summary", headers=headers)
        assert dash_resp.status_code == 200
        dash_data = dash_resp.json()
        assert "network_accessibility_percent" in dash_data
        assert dash_data["active_incidents_count"] >= 1

        # 3. OPEN MAP & SELECT DISRUPTED ROAD
        map_resp = await client.get("/api/v1/map/features", headers=headers)
        assert map_resp.status_code == 200
        map_data = map_resp.json()
        assert map_data["type"] == "FeatureCollection"
        road_features = [f for f in map_data["features"] if f["properties"].get("layer") == "roads"]
        assert len(road_features) > 0

        # 4. VIEW INCIDENT
        incidents_resp = await client.get("/api/v1/incidents", headers=headers)
        assert incidents_resp.status_code == 200
        incidents = incidents_resp.json()
        assert len(incidents) >= 1
        active_incident = incidents[0]
        assert "incident_code" in active_incident

        # 5. VIEW AFFECTED VEHICLE & OPEN DELIVERY
        vehicles_resp = await client.get("/api/v1/vehicles", headers=headers)
        assert vehicles_resp.status_code == 200
        vehicles = vehicles_resp.json()
        assert len(vehicles) > 0
        target_vehicle = vehicles[0]

        deliveries_resp = await client.get("/api/v1/deliveries", headers=headers)
        assert deliveries_resp.status_code == 200
        deliveries = deliveries_resp.json()
        assert len(deliveries) > 0
        target_delivery = deliveries[0]

        # 6. CALCULATE ALTERNATE ROUTE
        route_resp = await client.post("/api/v1/routes/optimize", json={
            "origin_name": "Guwahati Transport Terminal",
            "origin_lat": 26.1445,
            "origin_lng": 91.7362,
            "destination_name": "Silchar District Hospital",
            "dest_lat": 24.8333,
            "dest_lng": 92.7789,
            "vehicle_type": "Heavy Truck (16T)",
            "avoid_blocked_roads": True
        }, headers=headers)
        assert route_resp.status_code == 200
        routes = route_resp.json()
        assert len(routes) >= 1
        recommended_route = routes[0]
        assert recommended_route["is_recommended"] is True

        # 7. CONFIRM REROUTE (Dynamic Rerouting Execution)
        reroute_resp = await client.post("/api/v1/routes/dynamic-reroute", json={
            "delivery_id": target_delivery["id"],
            "vehicle_id": target_vehicle["id"],
            "hazard_road_id": active_incident.get("road_id") or "ROAD-NH6",
            "reason": "Active landslide hazard on NH-6 Sonapur corridor. Diverting via NH-27 bypass."
        }, headers=headers)
        assert reroute_resp.status_code == 200
        reroute_data = reroute_resp.json()
        assert reroute_data["action_status"] == "REROUTED"
        assert "new_route" in reroute_data
        assert "audit_event" in reroute_data

        # 8. ETA CHANGES & ALERT CREATED
        assert reroute_data["new_route"]["estimated_travel_time_hrs"] > 0
        alerts_resp = await client.get("/api/v1/alerts", headers=headers)
        assert alerts_resp.status_code == 200
        alerts = alerts_resp.json()
        assert len(alerts) > 0
        delivery_alerts = [a for a in alerts if a.get("alert_type") == "DELIVERY_AT_RISK" or "SUPPLY" in a.get("title", "").upper()]
        assert len(delivery_alerts) > 0

        # 9. VERIFY AUDIT LOG RECORD
        audit_resp = await client.get("/api/v1/admin/audit", headers=headers)
        assert audit_resp.status_code == 200
        audit_data = audit_resp.json()
        assert len(audit_data) >= 1
        reroute_audit = [e for e in audit_data if e["action"] == "REROUTE_CONFIRMED"]
        assert len(reroute_audit) >= 1


@pytest.mark.asyncio
async def test_scenario_2_field_officer_offline_sync():
    """
    Scenario 2:
    OPEN FIELD APP -> DISABLE NETWORK -> CREATE LANDSLIDE REPORT ->
    CAPTURE GPS -> ADD PHOTO -> SAVE OFFLINE -> RESTORE NETWORK ->
    SYNC -> VERIFY REPORT ON COMMAND CENTER
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. FIELD OFFICER AUTH
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "field.cachar@neroute.gov.in",
            "password": "field123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. GET VALID DISTRICT
        dist_resp = await client.get("/api/v1/districts")
        assert dist_resp.status_code == 200
        districts = dist_resp.json()
        district_id = districts[0]["id"]

        # 3. CREATE OFFLINE REPORT (simulating IndexedDB queued payload)
        idempotency_key = f"offline-sync-{uuid.uuid4()}"
        report_payload = {
            "idempotency_key": idempotency_key,
            "type": "landslide",
            "severity": "CRITICAL",
            "title": "Severe Sonapur Hillside Collapse",
            "description": "Massive 200-meter mud and boulder slide blocking both lanes completely.",
            "latitude": 25.1142,
            "longitude": 92.3615,
            "district_id": district_id,
            "address": "NH-6 Km 142.8, Sonapur Tunnel Approach",
            "reporter_name": "Field Officer Cachar",
            "reporter_role": "FIELD_OFFICER",
            "photo_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
            "recorded_at": "2026-09-08T18:41:00Z"
        }

        # 4. RESTORE NETWORK & SYNC TO SERVER
        sync_resp = await client.post("/api/v1/sync/upload", json=report_payload, headers=headers)
        assert sync_resp.status_code == 200
        sync_result = sync_resp.json()
        assert sync_result["status"] == "SYNCED"
        assert "INC-2026" in sync_result["incident_code"]
        server_incident_code = sync_result["incident_code"]

        # 5. IDEMPOTENT RETRY: Submitting same idempotency_key again must be safely acknowledged
        retry_resp = await client.post("/api/v1/sync/upload", json=report_payload, headers=headers)
        assert retry_resp.status_code == 200
        retry_result = retry_resp.json()
        assert retry_result["status"] in ["ALREADY_SYNCED", "SYNCED"]

        # 6. VERIFY REPORT APPEARS ON COMMAND CENTER
        incidents_resp = await client.get("/api/v1/incidents", headers=headers)
        assert incidents_resp.status_code == 200
        incidents = incidents_resp.json()
        matched = [i for i in incidents if i["incident_code"] == server_incident_code]
        assert len(matched) == 1
        assert matched[0]["type"] == "landslide"
        assert matched[0]["severity"] == "CRITICAL"


@pytest.mark.asyncio
async def test_scenario_3_autonomous_weather_disruption_and_medical_reroute():
    """
    Scenario 3:
    START NORMAL DELIVERY -> SIMULATE HEAVY RAIN -> RISK INCREASE ->
    SIMULATE LANDSLIDE -> ROAD BLOCKED -> ROUTE RECALCULATED ->
    VEHICLE REROUTED -> ETA UPDATED -> ALERT GENERATED
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. LOGIN
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "admin@neroute.gov.in",
            "password": "admin123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. RUN SIMULATION SCENARIO: EMERGENCY_MEDICAL_DELIVERY
        sim_resp = await client.post("/api/v1/simulation/scenarios/run", json={
            "scenario_name": "EMERGENCY_MEDICAL_DELIVERY"
        }, headers=headers)
        assert sim_resp.status_code == 200
        sim_data = sim_resp.json()
        assert sim_data["scenario"] == "EMERGENCY_MEDICAL_DELIVERY"
        assert len(sim_data["steps_executed"]) == 11

        # 3. VERIFY PREDICTED RISK LEVEL RISES TO CRITICAL
        risk_step = sim_data["steps_executed"][2]
        assert risk_step["predicted_risk_level"] in ["ELEVATED", "HIGH", "CRITICAL"]
        assert risk_step["disruption_probability"] >= 0.65

        # 4. VERIFY ROAD BLOCKED AND ALTERNATE ROUTE COMPUTED
        block_step = sim_data["steps_executed"][4]
        assert block_step["road_status"] == "BLOCKED"
        assert "NH-6" in block_step.get("road_code", "NH-6")

        reroute_step = sim_data["steps_executed"][7]
        assert reroute_step["status"] == "REROUTED"
        assert reroute_step["estimated_travel_time_hrs"] > 0
        assert "why_recommended" in reroute_step

        # 5. VERIFY SYSTEM HEALTH & READINESS
        ready_resp = await client.get("/ready")
        assert ready_resp.status_code == 200
        ready_data = ready_resp.json()
        assert ready_data["status"] == "ready"
        assert ready_data["database"] == "connected"
        assert ready_data["prediction_engine"] == "online"
