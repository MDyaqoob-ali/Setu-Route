"""
USGS Earthquake Hazards Live Collector for Northeast India.
Monitors real-time seismic events along the Himalayan Thrust & Indo-Burma Subduction Zones.
"""

import json
import logging
import urllib.request
from datetime import datetime, timezone
from typing import List, Dict, Any

from src.services.external_intelligence.source_registry import (
    SOURCE_REGISTRY,
    SourceTrustLevel,
    is_point_in_ner
)

logger = logging.getLogger("neroute.intelligence.usgs")


class USGSCollector:
    @staticmethod
    async def collect() -> List[Dict[str, Any]]:
        config = SOURCE_REGISTRY["USGS_EARTHQUAKES"]
        if not config.is_enabled:
            return []

        incidents: List[Dict[str, Any]] = []
        try:
            req = urllib.request.Request(config.endpoint_url, headers=config.headers)
            with urllib.request.urlopen(req, timeout=config.timeout_sec) as response:
                data = json.loads(response.read().decode("utf-8"))

            features = data.get("features", [])
            for feat in features:
                props = feat.get("properties", {})
                geom = feat.get("geometry", {})
                coords = geom.get("coordinates", [])

                if len(coords) < 2:
                    continue

                lng = float(coords[0])
                lat = float(coords[1])
                depth_km = float(coords[2]) if len(coords) > 2 else 10.0

                # Spatial filter: Northeast India & border seismic fault zones
                if not is_point_in_ner(lat, lng, margin_deg=1.0):
                    continue

                mag = float(props.get("mag") or 3.0)
                place = props.get("place") or "Northeast India Region"
                event_time_ms = props.get("time") or int(datetime.now(timezone.utc).timestamp() * 1000)
                event_time = datetime.fromtimestamp(event_time_ms / 1000.0, tz=timezone.utc)
                source_url = props.get("url") or f"https://earthquake.usgs.gov/earthquakes/eventpage/{feat.get('id')}"

                # Classify severity based on magnitude & depth
                if mag >= 5.5:
                    severity = "CRITICAL"
                    status = "Blocked" if depth_km < 30 else "Severely Affected"
                    desc = f"Major M{mag:.1f} seismic event at {depth_km:.1f}km depth near {place}. High risk of highway landslides, structural rockfalls, and culvert fractures along mountain corridors."
                elif mag >= 4.5:
                    severity = "HIGH"
                    status = "Partially Blocked"
                    desc = f"Moderate M{mag:.1f} earthquake at {depth_km:.1f}km depth near {place}. Hill sector road inspection underway for boulder slips."
                elif mag >= 3.5:
                    severity = "MEDIUM"
                    status = "Caution"
                    desc = f"Light M{mag:.1f} tremor recorded near {place}. Slow transit recommended on steep slope cuttings."
                else:
                    severity = "LOW"
                    status = "Caution"
                    desc = f"Minor M{mag:.1f} micro-seismic activity recorded near {place}."

                # Dynamic impact radius (in km) around epicenter
                impact_radius_km = max(5.0, (mag - 2.5) * 18.0)

                incidents.append({
                    "source_event_id": f"usgs_{feat.get('id', str(event_time_ms))}",
                    "source_name": config.name,
                    "source_url": source_url,
                    "source_trust_level": SourceTrustLevel.OFFICIAL.value,
                    "type": "earthquake",
                    "severity": severity,
                    "status": status,
                    "title": f"M{mag:.1f} Earthquake — {place}",
                    "description": desc,
                    "latitude": lat,
                    "longitude": lng,
                    "address": place,
                    "affected_road_code": None,  # Correlator will match to nearest highway
                    "confidence_score": 0.98,     # USGS automated instrumental measurement
                    "verification_status": "CONFIRMED",
                    "impact_geometry_type": "POINT",
                    "impact_geometry_geojson": {
                        "type": "Point",
                        "coordinates": [lng, lat],
                        "properties": {
                            "magnitude": mag,
                            "depth_km": depth_km,
                            "impact_radius_km": impact_radius_km
                        }
                    },
                    "raw_source_reference": {
                        "mag": mag,
                        "depth_km": depth_km,
                        "place": place,
                        "felt": props.get("felt"),
                        "alert": props.get("alert"),
                        "status": props.get("status")
                    },
                    "reported_at": event_time,
                    "expires_at": datetime.fromtimestamp(event_time.timestamp() + 86400, tz=timezone.utc),  # 24h relevance
                    "is_live_external": True
                })

            logger.info(f"USGS collector ingested {len(incidents)} seismic events in Northeast India.")
        except Exception as e:
            logger.warning(f"USGS Collector fetch error: {e}")

        return incidents
