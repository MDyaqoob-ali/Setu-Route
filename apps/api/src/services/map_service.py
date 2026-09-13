from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.cache import fast_cache
from src.models import Road, RoadSegment, Incident, Vehicle, District, WeatherObservation

class MapService:
    @staticmethod
    async def get_features(
        db: AsyncSession,
        min_lng: Optional[float] = None,
        min_lat: Optional[float] = None,
        max_lng: Optional[float] = None,
        max_lat: Optional[float] = None,
        layers: Optional[str] = "roads,incidents,vehicles,districts,weather"
    ) -> Dict[str, Any]:
        cache_key = f"map:features:{min_lng}:{min_lat}:{max_lng}:{max_lat}:{layers}"
        cached = fast_cache.get(cache_key)
        if cached is not None:
            return cached

        requested_layers = set(layers.split(",")) if layers else {"roads", "incidents", "vehicles", "districts", "weather"}
        features = []

        # 1. Roads Layer
        if "roads" in requested_layers:
            roads_res = await db.execute(select(Road))
            roads = roads_res.scalars().all()
            for r in roads:
                if r.geometry_geojson:
                    # Check bbox overlap if provided
                    features.append({
                        "type": "Feature",
                        "id": f"road_{r.id}",
                        "geometry": r.geometry_geojson,
                        "properties": {
                            "layer": "roads",
                            "id": r.id,
                            "name": r.name,
                            "code": r.code,
                            "state": r.state,
                            "highway_type": r.highway_type,
                            "accessibility_status": r.accessibility_status,
                            "risk_score": r.current_risk_score,
                            "average_speed_kmh": r.average_speed_kmh,
                            "total_length_km": r.total_length_km,
                            "start_point": r.start_point_name,
                            "end_point": r.end_point_name,
                            "color": "#10b981" if r.accessibility_status == "ACCESSIBLE" else ("#f59e0b" if r.accessibility_status == "RESTRICTED" else ("#ef4444" if r.accessibility_status == "BLOCKED" else "#6b7280"))
                        }
                    })

        # 2. Incidents Layer (Clustered Point features)
        if "incidents" in requested_layers:
            inc_res = await db.execute(select(Incident).where(Incident.status != "RESOLVED"))
            incidents = inc_res.scalars().all()
            for inc in incidents:
                if min_lat is not None and max_lat is not None:
                    if not (min_lat <= inc.latitude <= max_lat and min_lng <= inc.longitude <= max_lng):
                        continue

                features.append({
                    "type": "Feature",
                    "id": f"incident_{inc.id}",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [inc.longitude, inc.latitude]
                    },
                    "properties": {
                        "layer": "incidents",
                        "id": inc.id,
                        "incident_code": inc.incident_code,
                        "type": inc.type,
                        "severity": inc.severity,
                        "status": inc.status,
                        "title": inc.title,
                        "description": inc.description,
                        "road_id": inc.road_id,
                        "district_id": inc.district_id,
                        "reporter_name": inc.reporter_name,
                        "created_at": inc.created_at.isoformat(),
                        "color": "#ef4444" if inc.severity == "CRITICAL" else ("#f97316" if inc.severity == "HIGH" else ("#f59e0b" if inc.severity == "MEDIUM" else "#3b82f6"))
                    }
                })

        # 3. Vehicles Layer
        if "vehicles" in requested_layers:
            veh_res = await db.execute(select(Vehicle))
            vehicles = veh_res.scalars().all()
            for v in vehicles:
                if min_lat is not None and max_lat is not None:
                    if not (min_lat <= v.current_lat <= max_lat and min_lng <= v.current_lng <= max_lng):
                        continue

                features.append({
                    "type": "Feature",
                    "id": f"vehicle_{v.id}",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [v.current_lng, v.current_lat]
                    },
                    "properties": {
                        "layer": "vehicles",
                        "id": v.id,
                        "registration_number": v.registration_number,
                        "vehicle_type": v.vehicle_type,
                        "driver_name": v.driver_name,
                        "driver_phone": v.driver_phone,
                        "status": v.current_status,
                        "speed_kmh": v.speed_kmh,
                        "heading_deg": v.heading_deg,
                        "fuel_percent": v.fuel_percent,
                        "destination": v.destination_name,
                        "is_sos": v.is_sos,
                        "last_ping_at": v.last_ping_at.isoformat(),
                        "color": "#dc2626" if v.is_sos else ("#3b82f6" if v.current_status == "MOVING" else ("#eab308" if v.current_status == "DELAYED" else "#64748b"))
                    }
                })

        # 4. Districts Layer
        if "districts" in requested_layers:
            dist_res = await db.execute(select(District))
            districts = dist_res.scalars().all()
            for d in districts:
                if d.boundary_geojson:
                    features.append({
                        "type": "Feature",
                        "id": f"district_{d.id}",
                        "geometry": d.boundary_geojson,
                        "properties": {
                            "layer": "districts",
                            "id": d.id,
                            "name": d.name,
                            "state": d.state,
                            "code": d.code,
                            "vulnerability_index": d.vulnerability_index,
                            "elevation_avg_m": d.elevation_avg_m,
                            "terrain_type": d.terrain_type
                        }
                    })

        # 5. Weather Risk Layer (Rainfall / Landslide hazard points)
        if "weather" in requested_layers:
            wea_res = await db.execute(select(WeatherObservation))
            weather_obs = wea_res.scalars().all()
            for w in weather_obs:
                features.append({
                    "type": "Feature",
                    "id": f"weather_{w.id}",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [w.longitude, w.latitude]
                    },
                    "properties": {
                        "layer": "weather",
                        "id": w.id,
                        "station_name": w.station_name,
                        "rainfall_3h_mm": w.rainfall_last_3h_mm,
                        "flood_warning_level": w.flood_warning_level,
                        "landslide_risk_index": w.landslide_risk_index,
                        "temperature_c": w.temperature_c,
                        "wind_speed_kmh": w.wind_speed_kmh
                    }
                })

        result = {
            "type": "FeatureCollection",
            "features": features
        }
        fast_cache.set(cache_key, result, ttl_sec=2.5)
        return result
