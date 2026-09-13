"""
GDACS (Global Disaster Alert and Coordination System - UN/EC) Live Collector.
Monitors official international disaster alerts (floods, cyclones, earthquakes, storms) for South Asia / Northeast India.
"""

import logging
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import List, Dict, Any

from src.services.external_intelligence.source_registry import (
    SOURCE_REGISTRY,
    SourceTrustLevel,
    is_point_in_ner
)

logger = logging.getLogger("neroute.intelligence.gdacs")

NS = {
    "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
    "georss": "http://www.georss.org/georss",
    "gdacs": "http://www.gdacs.org"
}


class GDACSCollector:
    @staticmethod
    async def collect() -> List[Dict[str, Any]]:
        config = SOURCE_REGISTRY["GDACS_DISASTERS"]
        if not config.is_enabled:
            return []

        incidents: List[Dict[str, Any]] = []
        try:
            req = urllib.request.Request(config.endpoint_url, headers=config.headers)
            with urllib.request.urlopen(req, timeout=config.timeout_sec) as response:
                xml_data = response.read()

            root = ET.fromstring(xml_data)
            items = root.findall(".//item")

            for item in items:
                # Extract coordinates from georss:point or geo:Point
                point_text = None
                georss_pt = item.find("georss:point", NS)
                if georss_pt is not None and georss_pt.text:
                    point_text = georss_pt.text.strip()
                elif item.find("geo:lat", NS) is not None and item.find("geo:long", NS) is not None:
                    lat_str = item.find("geo:lat", NS).text
                    lng_str = item.find("geo:long", NS).text
                    if lat_str and lng_str:
                        point_text = f"{lat_str} {lng_str}"

                if not point_text:
                    continue

                parts = point_text.split()
                if len(parts) < 2:
                    continue

                lat = float(parts[0])
                lng = float(parts[1])

                # Spatial filter for Northeast India & contiguous river basins
                if not is_point_in_ner(lat, lng, margin_deg=1.5):
                    continue

                title = item.find("title").text if item.find("title") is not None else "GDACS Alert"
                desc = item.find("description").text if item.find("description") is not None else ""
                link = item.find("link").text if item.find("link") is not None else "https://www.gdacs.org"
                guid = item.find("guid").text if item.find("guid") is not None else title

                # GDACS specific tags
                event_type_el = item.find("gdacs:eventtype", NS)
                alert_level_el = item.find("gdacs:alertlevel", NS)
                country_el = item.find("gdacs:country", NS)

                event_code = event_type_el.text.upper() if event_type_el is not None and event_type_el.text else "FL"
                alert_level = alert_level_el.text.capitalize() if alert_level_el is not None and alert_level_el.text else "Orange"
                country = country_el.text if country_el is not None and country_el.text else "India"

                type_map = {
                    "FL": "flood",
                    "TC": "cyclone",
                    "EQ": "earthquake",
                    "DR": "severe_weather",
                    "WF": "wildfire",
                    "VO": "volcano"
                }
                incident_type = type_map.get(event_code, "disaster")

                # Map alert level to severity & status
                if alert_level == "Red":
                    severity = "CRITICAL"
                    status = "Blocked"
                elif alert_level == "Orange":
                    severity = "HIGH"
                    status = "Partially Blocked"
                else:
                    severity = "MEDIUM"
                    status = "Caution"

                now = datetime.now(timezone.utc)

                incidents.append({
                    "source_event_id": f"gdacs_{guid}",
                    "source_name": config.name,
                    "source_url": link,
                    "source_trust_level": SourceTrustLevel.OFFICIAL.value,
                    "type": incident_type,
                    "severity": severity,
                    "status": status,
                    "title": f"{alert_level} Alert: {title}",
                    "description": f"Official UN/EC GDACS bulletin for {country}. {desc[:300]}",
                    "latitude": lat,
                    "longitude": lng,
                    "address": f"{country} — Coordinate [{lat:.2f}, {lng:.2f}]",
                    "affected_road_code": None,
                    "confidence_score": 0.95,
                    "verification_status": "CONFIRMED",
                    "impact_geometry_type": "POINT",
                    "impact_geometry_geojson": {
                        "type": "Point",
                        "coordinates": [lng, lat],
                        "properties": {
                            "event_type": event_code,
                            "alert_level": alert_level,
                            "country": country
                        }
                    },
                    "raw_source_reference": {
                        "title": title,
                        "event_code": event_code,
                        "alert_level": alert_level,
                        "country": country
                    },
                    "reported_at": now,
                    "expires_at": datetime.fromtimestamp(now.timestamp() + 86400, tz=timezone.utc),
                    "is_live_external": True
                })

            logger.info(f"GDACS collector ingested {len(incidents)} disaster alerts in NER area.")
        except Exception as e:
            logger.warning(f"GDACS Collector fetch error: {e}")

        return incidents
