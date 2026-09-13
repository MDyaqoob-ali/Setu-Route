import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, delete

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.core.database import AsyncSessionLocal, init_db, engine
from src.core.security import get_password_hash
from src.models import (
    User, District, Road, RoadSegment, Incident, IncidentPhoto,
    Vehicle, VehicleLocation, Delivery, DeliveryEvent, Alert,
    WeatherObservation, RiskPrediction
)
from src.seeds.ner_data import (
    DISTRICTS_DATA, ROADS_DATA, INCIDENTS_DATA, VEHICLES_DATA,
    DELIVERIES_DATA, WEATHER_DATA
)

async def run_seed():
    print("[+] Initializing Database Schema...")
    await init_db()

    async with AsyncSessionLocal() as db:
        print("[+] Clearing existing records...")
        await db.execute(delete(RiskPrediction))
        await db.execute(delete(WeatherObservation))
        await db.execute(delete(Alert))
        await db.execute(delete(DeliveryEvent))
        await db.execute(delete(Delivery))
        await db.execute(delete(VehicleLocation))
        await db.execute(delete(Vehicle))
        await db.execute(delete(IncidentPhoto))
        await db.execute(delete(Incident))
        await db.execute(delete(RoadSegment))
        await db.execute(delete(Road))
        await db.execute(delete(User))
        await db.execute(delete(District))
        await db.commit()

        # 1. Seed Users
        print("[+] Seeding Users...")
        default_pw = get_password_hash("admin123")
        officer_pw = get_password_hash("officer123")
        field_pw = get_password_hash("field123")
        operator_pw = get_password_hash("operator123")
        driver_pw = get_password_hash("driver123")
        viewer_pw = get_password_hash("viewer123")

        users = [
            User(
                email="admin@neroute.gov.in",
                hashed_password=default_pw,
                full_name="Rajesh Sharma (IAS)",
                role="SUPER_ADMIN",
                department="MDoNER Logistics Operations",
                phone="+91 94350 00001"
            ),
            User(
                email="regional.assam@neroute.gov.in",
                hashed_password=default_pw,
                full_name="Dr. Ananya Goswami",
                role="REGIONAL_ADMIN",
                department="Assam State Disaster Management Authority",
                phone="+91 94350 00002"
            ),
            User(
                email="officer.kamrup@neroute.gov.in",
                hashed_password=officer_pw,
                full_name="Manoj Barman",
                role="DISTRICT_OFFICER",
                department="Kamrup District Emergency Operations",
                phone="+91 94350 00003"
            ),
            User(
                email="field.cachar@neroute.gov.in",
                hashed_password=field_pw,
                full_name="Debabrata Roy",
                role="FIELD_OFFICER",
                department="Cachar Field Inspection Unit",
                phone="+91 94350 00004"
            ),
            User(
                email="logistics.lead@ner-freight.in",
                hashed_password=operator_pw,
                full_name="Vikramjit Singh",
                role="LOGISTICS_OPERATOR",
                department="NER Freight Control Tower",
                phone="+91 94350 00005"
            ),
            User(
                email="driver.biren@neroute.gov.in",
                hashed_password=driver_pw,
                full_name="Biren Das",
                role="DRIVER",
                department="Commercial Fleet 1",
                phone="+91 94350 11223"
            ),
            User(
                email="viewer@neroute.gov.in",
                hashed_password=viewer_pw,
                full_name="Public Observer",
                role="VIEW_ONLY",
                department="Citizen Portal",
                phone="+91 94350 00007"
            )
        ]
        db.add_all(users)
        await db.commit()

        # 2. Seed Districts
        print("[+] Seeding NER Districts...")
        district_map = {}
        for d in DISTRICTS_DATA:
            poly_coords = [
                [d["longitude"] - 0.25, d["latitude"] - 0.2],
                [d["longitude"] + 0.25, d["latitude"] - 0.2],
                [d["longitude"] + 0.25, d["latitude"] + 0.2],
                [d["longitude"] - 0.25, d["latitude"] + 0.2],
                [d["longitude"] - 0.25, d["latitude"] - 0.2]
            ]
            dist_obj = District(
                name=d["name"],
                state=d["state"],
                code=d["code"],
                latitude=d["latitude"],
                longitude=d["longitude"],
                terrain_type=d["terrain_type"],
                elevation_avg_m=d["elevation_avg_m"],
                vulnerability_index=d["vulnerability"],
                boundary_geojson={
                    "type": "Polygon",
                    "coordinates": [poly_coords]
                }
            )
            db.add(dist_obj)
            await db.flush()
            district_map[d["code"]] = dist_obj

        # 3. Seed Roads and Segments
        print("[+] Seeding Highway Corridors and Segments...")
        road_map = {}
        for r_idx, r in enumerate(ROADS_DATA):
            road_obj = Road(
                name=r["name"],
                code=r["code"],
                highway_type=r["highway_type"],
                state=r["state"],
                total_length_km=r["total_length_km"],
                start_point_name=r["start_point_name"],
                end_point_name=r["end_point_name"],
                accessibility_status=r["accessibility_status"],
                criticality=r["criticality"],
                average_speed_kmh=r["average_speed_kmh"],
                current_risk_score=r["current_risk_score"],
                geometry_geojson=r["geometry"]
            )
            db.add(road_obj)
            await db.flush()
            road_map[r["code"]] = road_obj

            coords = r["geometry"]["coordinates"]
            for i in range(len(coords) - 1):
                p1 = coords[i]
                p2 = coords[i + 1]
                seg_status = r["accessibility_status"]
                seg_risk = r["current_risk_score"]
                # First segment may be fine even if later is blocked
                if i == 0 and seg_status == "BLOCKED":
                    seg_status = "RESTRICTED"
                    seg_risk = 0.5

                seg = RoadSegment(
                    road_id=road_obj.id,
                    segment_index=i,
                    name=f"{r['code']} Sector {i+1} ({p1[0]:.2f}, {p1[1]:.2f} -> {p2[0]:.2f}, {p2[1]:.2f})",
                    start_lat=p1[1],
                    start_lng=p1[0],
                    end_lat=p2[1],
                    end_lng=p2[0],
                    accessibility_status=seg_status,
                    risk_score=seg_risk,
                    current_speed_kmh=r["average_speed_kmh"],
                    elevation_m=450 + (i * 120),
                    geometry_geojson={
                        "type": "LineString",
                        "coordinates": [p1, p2]
                    }
                )
                db.add(seg)

        # 4. Seed Incidents and Alerts
        print("[+] Seeding Active Incidents & Strategic Alerts...")
        for inc_idx, inc in enumerate(INCIDENTS_DATA):
            road = road_map.get(inc["road_code"])
            district = district_map.get(inc["district_code"])
            
            incident_obj = Incident(
                incident_code=f"INC-2026-0{inc_idx + 101}",
                type=inc["type"],
                severity=inc["severity"],
                status="OPEN" if inc_idx < 4 else "INVESTIGATING",
                title=inc["title"],
                description=inc["description"],
                latitude=inc["latitude"],
                longitude=inc["longitude"],
                address=inc["address"],
                road_id=road.id if road else None,
                district_id=district.id if district else list(district_map.values())[0].id,
                reporter_name="Inspector S. Hazarika (PWD Field Team)",
                reporter_role="FIELD_OFFICER",
                reporter_contact="+91 98540 77112",
                estimated_clearance_time=datetime.now(timezone.utc) + timedelta(hours=6 + (inc_idx * 4)),
                affected_traffic_direction=inc.get("affected_traffic", "BOTH"),
                verification_status="VERIFIED",
                photos_json=[
                    f"https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
                    f"https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80"
                ]
            )
            db.add(incident_obj)
            await db.flush()

            # Generate Operational Alert
            alert_obj = Alert(
                alert_code=f"ALT-2026-0{inc_idx + 201}",
                alert_type="CRITICAL_INCIDENT" if inc["severity"] in ("CRITICAL", "HIGH") else "ROAD_CLOSURE",
                severity=inc["severity"],
                title=f"Incident Alert: {inc['title']}",
                what_happened=f"{inc['severity']} {inc['type'].upper()} detected at {inc['address']}.",
                why_it_matters=f"Directly impacts freight passage on {inc['road_code']}. Potential 4 to 12 hour delivery delays for outbound supplies.",
                who_is_affected="All heavy commercial cargo, fuel convoys, and emergency medical shipments on this link.",
                recommended_action="Halt heavy trucks at nearest staging yard; reroute light vehicles via approved district bypass.",
                entity_type="incident",
                entity_id=incident_obj.id,
                district_id=district.id if district else None,
                is_acknowledged=(inc_idx >= 4)
            )
            db.add(alert_obj)

        # 5. Seed Vehicles
        print("[+] Seeding Fleet Vehicles & Telemetry Logs...")
        vehicle_map = {}
        for v in VEHICLES_DATA:
            veh_obj = Vehicle(
                registration_number=v["reg"],
                vehicle_type=v["type"],
                driver_name=v["driver"],
                driver_phone=v["phone"],
                current_status=v["status"],
                current_lat=v["lat"],
                current_lng=v["lng"],
                speed_kmh=v["speed"],
                heading_deg=65.0,
                fuel_percent=v["fuel"],
                destination_name=v["dest"],
                is_sos=(v["status"] == "EMERGENCY")
            )
            db.add(veh_obj)
            await db.flush()
            vehicle_map[v["reg"]] = veh_obj

            # Add recent GPS breadcrumb trail
            for b in range(5):
                loc = VehicleLocation(
                    vehicle_id=veh_obj.id,
                    latitude=v["lat"] - (b * 0.015),
                    longitude=v["lng"] - (b * 0.012),
                    speed_kmh=max(0.0, v["speed"] - (b * 2.5)),
                    heading_deg=65.0,
                    recorded_at=datetime.now(timezone.utc) - timedelta(minutes=(5 - b) * 10)
                )
                db.add(loc)

        # 6. Seed Deliveries
        print("[+] Seeding Essential Deliveries & Consignments...")
        for d_idx, d in enumerate(DELIVERIES_DATA):
            veh = vehicle_map.get(d["veh_reg"])
            now = datetime.now(timezone.utc)
            deliv_obj = Delivery(
                consignment_code=f"NER-DEL-{d_idx + 9001}",
                title=d["title"],
                cargo_category=d["category"],
                cargo_description=d["desc"],
                weight_tons=d["weight"],
                priority=d["priority"],
                status=d["status"],
                origin_name=d["orig_name"],
                origin_lat=d["orig_lat"],
                origin_lng=d["orig_lng"],
                destination_name=d["dest_name"],
                destination_lat=d["dest_lat"],
                destination_lng=d["dest_lng"],
                assigned_vehicle_id=veh.id if veh else None,
                planned_departure=now - timedelta(hours=4),
                expected_delivery=now + timedelta(hours=6),
                current_eta=now + timedelta(hours=6 + int(d.get("delay", 0) / 60)),
                delay_minutes=d.get("delay", 0),
                risk_level=d.get("risk", "LOW"),
                delay_reason=d.get("reason", None)
            )
            db.add(deliv_obj)
            await db.flush()

            if veh:
                veh.current_delivery_id = deliv_obj.id

            # Add Delivery Events
            db.add(DeliveryEvent(
                delivery_id=deliv_obj.id,
                event_type="DISPATCHED",
                title="Consignment Dispatched from Depot",
                description=f"Loaded onto {d['veh_reg']} and cleared through weighbridge.",
                latitude=d["orig_lat"],
                longitude=d["orig_lng"],
                created_at=now - timedelta(hours=4)
            ))

            if d.get("delay", 0) > 0:
                db.add(DeliveryEvent(
                    delivery_id=deliv_obj.id,
                    event_type="CORRIDOR_BOTTLENECK",
                    title="Transit Bottleneck Encountered",
                    description=d.get("reason", "Heavy congestion and road obstruction."),
                    created_at=now - timedelta(minutes=45)
                ))

        # 7. Seed Weather Observations & Predictions
        print("[+] Seeding Weather Stations and AI Disruption Predictions...")
        for w in WEATHER_DATA:
            dist = district_map.get(w["district_code"])
            wea_obj = WeatherObservation(
                district_id=dist.id if dist else list(district_map.values())[0].id,
                station_name=w["station"],
                latitude=w["lat"],
                longitude=w["lng"],
                rainfall_last_3h_mm=w["rain_3h"],
                rainfall_24h_mm=w["rain_24h"],
                temperature_c=w["temp"],
                wind_speed_kmh=w["wind"],
                humidity_percent=88.0,
                flood_warning_level=w["flood_lvl"],
                landslide_risk_index=w["landslide_idx"]
            )
            db.add(wea_obj)

        await db.commit()
        print("\n=======================================================")
        print("  [SUCCESS] SETU-ROUTE SEED COMPLETE!")
        print("  7 Users, 20 NER Districts, 8 Major Highway Corridors,")
        print("  6 Active Incidents, 10 Fleet Vehicles, 6 Consignments,")
        print("  6 Weather Stations, and Real-time GeoJSON layers created.")
        print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(run_seed())
