import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from src.main import app

@pytest.mark.asyncio
async def test_get_drivers_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/vehicles/drivers")
        assert response.status_code == 200
        drivers = response.json()
        assert isinstance(drivers, list)
        assert len(drivers) > 0
        first = drivers[0]
        assert "driver_name" in first
        assert "driver_phone" in first
        assert "status" in first
        assert first["status"] in ["AVAILABLE", "IN_TRANSIT"]

@pytest.mark.asyncio
async def test_check_registration_availability():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Existing seeded truck
        response = await client.get("/api/v1/vehicles/check-reg?reg=AS-01-GB-4012")
        assert response.status_code == 200
        data = response.json()
        assert data["available"] is False

        # Fresh unique registration
        fresh_reg = f"AS-01-XX-{uuid.uuid4().hex[:4].upper()}"
        response_fresh = await client.get(f"/api/v1/vehicles/check-reg?reg={fresh_reg}")
        assert response_fresh.status_code == 200
        data_fresh = response_fresh.json()
        assert data_fresh["available"] is True

@pytest.mark.asyncio
async def test_create_vehicle_journey_success():
    unique_reg = f"TR-04-TEST-{uuid.uuid4().hex[:4].upper()}"
    journey_payload = {
        "vehicle": {
            "registration_number": unique_reg,
            "vehicle_type": "Heavy Truck (16T)",
            "capacity_tons": 16.0,
            "driver_name": "Tapan Mazumdar",
            "driver_phone": "+91 94350 99887",
            "initial_status": "STOPPED",
            "fuel_percent": 92.0
        },
        "consignment": {
            "title": "Emergency Pediatric Vaccine Lifeline",
            "cargo_category": "Medical Supplies",
            "cargo_description": "Cold-chain insulin and vaccine supplies for Silchar civil depot",
            "weight_tons": 8.5,
            "priority": "CRITICAL",
            "package_count": 240,
            "instructions": "Maintain temperature between 2-8 deg C"
        },
        "pickup": {
            "name": "Guwahati Logistics Hub (Assam)",
            "lat": 26.1445,
            "lng": 91.7362,
            "address": "NH-27 Junction, Guwahati Central Freight Terminal",
            "contact_name": "Dipankar Baruah",
            "contact_phone": "+91 94351 00221"
        },
        "destination": {
            "name": "Silchar Rongpur Yard (Assam/Barak)",
            "lat": 24.8333,
            "lng": 92.7789,
            "address": "Silchar Civil Depot, Barak Valley",
            "contact_name": "Joydeep Roy",
            "contact_phone": "+91 98540 88992"
        },
        "waypoints": [
            {
                "name": "Shillong Civil Depot (Meghalaya)",
                "lat": 25.5788,
                "lng": 91.8933
            }
        ],
        "selected_route": {
            "route_name": "Primary NH-6 Lifeline (Guwahati → Shillong → Silchar)",
            "distance_km": 314.0,
            "estimated_duration_minutes": 480,
            "risk_score": 0.25,
            "risk_level": "LOW",
            "route_status": "CLEAR",
            "is_recommended": True,
            "affecting_incidents_count": 0
        }
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/vehicles/journey", json=journey_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["vehicle"]["registration_number"] == unique_reg
        assert data["vehicle"]["driver_name"] == "Tapan Mazumdar"
        assert data["delivery"]["assigned_vehicle_id"] == data["vehicle"]["id"]
        assert data["vehicle"]["current_delivery_id"] == data["delivery"]["id"]
        assert data["delivery"]["title"] == "Emergency Pediatric Vaccine Lifeline"
        assert data["delivery"]["weight_tons"] == 8.5
        assert data["route_summary"]["route_name"] == "Primary NH-6 Lifeline (Guwahati → Shillong → Silchar)"

@pytest.mark.asyncio
async def test_create_vehicle_journey_duplicate_registration():
    # Use existing vehicle registration from seed
    duplicate_reg = "AS-01-GB-4012"
    payload = {
        "vehicle": {
            "registration_number": duplicate_reg,
            "vehicle_type": "Heavy Truck (16T)",
            "capacity_tons": 12.0,
            "driver_name": "Test Driver",
            "driver_phone": "+91 98000 11111",
            "initial_status": "STOPPED",
            "fuel_percent": 85.0
        },
        "consignment": {
            "title": "General Rations",
            "cargo_category": "Essential Food Grains",
            "weight_tons": 5.0,
            "priority": "NORMAL"
        },
        "pickup": {
            "name": "Guwahati",
            "lat": 26.1445,
            "lng": 91.7362
        },
        "destination": {
            "name": "Shillong",
            "lat": 25.5788,
            "lng": 91.8933
        }
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/vehicles/journey", json=payload)
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_vehicle_journey_payload_exceeds_capacity():
    unique_reg = f"SK-02-OVER-{uuid.uuid4().hex[:4].upper()}"
    payload = {
        "vehicle": {
            "registration_number": unique_reg,
            "vehicle_type": "Light Commercial (3.5T)",
            "capacity_tons": 3.5,
            "driver_name": "Karma Sherpa",
            "driver_phone": "+91 98320 12345",
            "initial_status": "STOPPED",
            "fuel_percent": 90.0
        },
        "consignment": {
            "title": "Heavy Construction Girders",
            "cargo_category": "Construction Materials",
            "weight_tons": 8.0,  # 8.0T > 3.5T!
            "priority": "NORMAL"
        },
        "pickup": {
            "name": "Siliguri Gateway Freight Terminal",
            "lat": 26.7271,
            "lng": 88.3953
        },
        "destination": {
            "name": "Gangtok STNM Hub",
            "lat": 27.3314,
            "lng": 88.6138
        }
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/vehicles/journey", json=payload)
        assert response.status_code == 422
        assert "exceeds vehicle payload capacity" in response.json()["detail"]

@pytest.mark.asyncio
async def test_route_optimize_with_waypoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/routes/optimize", json={
            "origin_name": "Guwahati Logistics Hub (Assam)",
            "origin_lat": 26.1445,
            "origin_lng": 91.7362,
            "destination_name": "Silchar Rongpur Yard (Assam/Barak)",
            "dest_lat": 24.8333,
            "dest_lng": 92.7789,
            "waypoints": [
                {
                    "name": "Shillong Civil Depot (Meghalaya)",
                    "lat": 25.5788,
                    "lng": 91.8933
                }
            ],
            "vehicle_type": "Heavy Truck (16T)",
            "cargo_priority": "CRITICAL",
            "avoid_blocked_roads": True
        })
        assert response.status_code == 200
        routes = response.json()
        assert len(routes) > 0
        rec = routes[0]
        assert "route_name" in rec
        assert "distance_km" in rec
        assert rec["distance_km"] > 0
        assert "waypoints" in rec
        assert rec["waypoints"]["type"] == "LineString"
