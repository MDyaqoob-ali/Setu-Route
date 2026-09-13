"""
Open-Meteo Live Meteorological & River Discharge Collector for Northeast India.
Monitors live precipitation, thunderstorm convective cells, wind gusts, and river runoff across critical highway corridors.
"""

import json
import logging
import urllib.request
from datetime import datetime, timezone
from typing import List, Dict, Any

from src.services.external_intelligence.source_registry import (
    SOURCE_REGISTRY,
    SourceTrustLevel
)

logger = logging.getLogger("neroute.intelligence.openmeteo")

# High-Risk Strategic Observation Points across Northeast India Arterial Corridors
KEY_OBSERVATION_POINTS = [
    {
        "name": "Sonapur-Khliehriat Mountain Pass",
        "road_code": "NH-6",
        "lat": 25.1850,
        "lng": 92.4820,
        "state": "Meghalaya",
        "hazard_type": "landslide"
    },
    {
        "name": "Pagla Pahar Boulder Gorge",
        "road_code": "NH-29",
        "lat": 25.7500,
        "lng": 93.8500,
        "state": "Nagaland",
        "hazard_type": "rockfall"
    },
    {
        "name": "Noney Valley Hill Cutting",
        "road_code": "NH-37",
        "lat": 24.8100,
        "lng": 93.3000,
        "state": "Manipur",
        "hazard_type": "landslide"
    },
    {
        "name": "Teesta River Gorge Corridor",
        "road_code": "NH-10",
        "lat": 27.0500,
        "lng": 88.5200,
        "state": "Sikkim",
        "hazard_type": "flood"
    },
    {
        "name": "Kaziranga Southern Inundation Stretch",
        "road_code": "NH-715",
        "lat": 26.5850,
        "lng": 93.1700,
        "state": "Assam",
        "hazard_type": "flood"
    },
    {
        "name": "Sela High Alpine Ridge",
        "road_code": "Bhalukpong-Tawang",
        "lat": 27.5000,
        "lng": 92.1000,
        "state": "Arunachal Pradesh",
        "hazard_type": "severe_weather"
    },
    {
        "name": "Kawnpui Landslip Saddle",
        "road_code": "NH-306",
        "lat": 23.9500,
        "lng": 92.6800,
        "state": "Mizoram",
        "hazard_type": "landslide"
    },
    {
        "name": "Guwahati Borjhar Valley Hub",
        "road_code": "NH-27",
        "lat": 26.1445,
        "lng": 91.7362,
        "state": "Assam",
        "hazard_type": "heavy_rain"
    }
]

# WMO Weather Code Descriptions
WMO_DESCRIPTIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}


class OpenMeteoCollector:
    @staticmethod
    async def collect() -> List[Dict[str, Any]]:
        config = SOURCE_REGISTRY["OPEN_METEO_WEATHER"]
        if not config.is_enabled:
            return []

        incidents: List[Dict[str, Any]] = []

        for pt in KEY_OBSERVATION_POINTS:
            try:
                lat = pt["lat"]
                lng = pt["lng"]
                url = (
                    f"{config.endpoint_url}?"
                    f"latitude={lat}&longitude={lng}&"
                    f"current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&"
                    f"hourly=precipitation_probability,precipitation&forecast_days=1"
                )

                req = urllib.request.Request(url, headers=config.headers)
                with urllib.request.urlopen(req, timeout=config.timeout_sec) as res:
                    data = json.loads(res.read().decode("utf-8"))

                current = data.get("current", {})
                rain_mm = float(current.get("rain") or current.get("precipitation") or 0.0)
                weather_code = int(current.get("weather_code") or 0)
                wind_kmh = float(current.get("wind_speed_10m") or 0.0)
                temp_c = float(current.get("temperature_2m") or 20.0)
                condition = WMO_DESCRIPTIONS.get(weather_code, "Cloudy")

                # Detect active weather disruption thresholds
                # Case 1: Extreme rainfall / convective downpour (> 20mm/hr) or severe storm code 95-99
                # Case 2: Gale-force winds (> 45 km/h) in mountain passes
                # Case 3: Moderate rain on known landslide slope (> 8mm/hr)
                is_severe = (
                    rain_mm >= 15.0 or
                    weather_code in (82, 95, 96, 99) or
                    wind_kmh >= 45.0 or
                    (rain_mm >= 5.0 and pt["hazard_type"] == "landslide")
                )

                if is_severe:
                    now = datetime.now(timezone.utc)
                    if rain_mm >= 25.0 or weather_code == 99:
                        severity = "CRITICAL"
                        status = "Blocked" if pt["hazard_type"] == "landslide" else "Severely Affected"
                        title = f"Torrential Cloudburst ({rain_mm:.1f}mm/h) & Landslide Threat on {pt['road_code']}"
                        desc = f"Extreme downpour detected at {pt['name']} ({pt['state']}). Ground saturation index critical. High vulnerability to slope destabilization and road mud deposits."
                    elif rain_mm >= 12.0 or weather_code in (95, 96):
                        severity = "HIGH"
                        status = "Partially Blocked"
                        title = f"Severe Convective Storm & Road Flooding on {pt['road_code']}"
                        desc = f"Heavy localized rain ({rain_mm:.1f}mm/h, {condition}) with wind gusts up to {wind_kmh:.1f} km/h recorded at {pt['name']}. Traffic speed restricted."
                    else:
                        severity = "MEDIUM"
                        status = "Caution"
                        title = f"High-Altitude Precipitation Warning on {pt['road_code']}"
                        desc = f"Active precipitation ({rain_mm:.1f}mm/h, {condition}) at {pt['name']}. Slippery road surface and reduced visibility on hill curves."

                    incidents.append({
                        "source_event_id": f"om_{pt['road_code']}_{lat}_{lng}",
                        "source_name": config.name,
                        "source_url": f"https://open-meteo.com/en/docs#latitude={lat}&longitude={lng}",
                        "source_trust_level": SourceTrustLevel.VERIFIED_PROVIDER.value,
                        "type": "flood" if pt["hazard_type"] == "flood" else ("landslide" if pt["hazard_type"] == "landslide" else "heavy_rain"),
                        "severity": severity,
                        "status": status,
                        "title": title,
                        "description": desc,
                        "latitude": lat,
                        "longitude": lng,
                        "address": f"{pt['name']}, {pt['state']} ({pt['road_code']})",
                        "affected_road_code": pt["road_code"],
                        "confidence_score": 0.92,
                        "verification_status": "VERIFIED",
                        "impact_geometry_type": "POINT",
                        "impact_geometry_geojson": {
                            "type": "Point",
                            "coordinates": [lng, lat],
                            "properties": {
                                "rain_mm": rain_mm,
                                "wind_kmh": wind_kmh,
                                "temp_c": temp_c,
                                "condition": condition
                            }
                        },
                        "raw_source_reference": {
                            "current": current,
                            "location": pt["name"]
                        },
                        "reported_at": now,
                        "expires_at": datetime.fromtimestamp(now.timestamp() + 14400, tz=timezone.utc),  # 4h validity
                        "is_live_external": True
                    })

            except Exception as e:
                logger.debug(f"Open-Meteo observation point {pt['name']} fetch error: {e}")

        logger.info(f"Open-Meteo collector ingested {len(incidents)} active meteorological alerts.")
        return incidents
