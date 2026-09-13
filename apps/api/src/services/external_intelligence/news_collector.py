"""
Regional News Intelligence Collector for Northeast India (EastMojo, Northeast Now).
Extracts published transportation and disaster bulletins.
Strictly tagged as Level 3 REPUTABLE_NEWS with UNVERIFIED infrastructure status until corroborated.
"""

import re
import logging
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import List, Dict, Any

from src.services.external_intelligence.source_registry import (
    SOURCE_REGISTRY,
    SourceTrustLevel
)

logger = logging.getLogger("neroute.intelligence.news")

# Keyword patterns indicating potential road / natural disaster impact
DISASTER_KEYWORDS = [
    r"\blandslide\b", r"\bmudslide\b", r"\brockfall\b", r"\bflood\b", r"\binundat\w+",
    r"\broad\s+(?:block|closed|damaged|cut\s+off|washed\s+away)\b",
    r"\bhighway\s+(?:block|closed|stranded|disrupted)\b",
    r"\bbridge\s+(?:collapsed?|damaged?|submerged?)\b",
    r"\bnh-?6\b", r"\bnh-?29\b", r"\bnh-?37\b", r"\bnh-?10\b", r"\bnh-?27\b", r"\bnh-?306\b",
    r"\bflash\s+flood\b", r"\bteesta\b", r"\bsonapur\b", r"\bpagla\s+pahar\b"
]

# Known Northeast India Geocoding Gazetteer
NER_GAZETTEER = {
    "sonapur": (25.1850, 92.4820, "NH-6", "Meghalaya"),
    "khliehriat": (25.3500, 92.3800, "NH-6", "Meghalaya"),
    "shillong": (25.5788, 91.8933, "NH-6", "Meghalaya"),
    "silchar": (24.8333, 92.7789, "NH-37", "Assam"),
    "dimapur": (25.9068, 93.7270, "NH-29", "Nagaland"),
    "kohima": (25.6751, 94.1086, "NH-29", "Nagaland"),
    "pagla pahar": (25.7500, 93.8500, "NH-29", "Nagaland"),
    "imphal": (24.8170, 93.9368, "NH-37", "Manipur"),
    "jiribam": (24.8000, 93.1200, "NH-37", "Manipur"),
    "noney": (24.7800, 93.6000, "NH-37", "Manipur"),
    "guwahati": (26.1445, 91.7362, "NH-27", "Assam"),
    "nagaon": (26.3450, 92.6840, "NH-27", "Assam"),
    "kaziranga": (26.5850, 93.1700, "NH-715", "Assam"),
    "dibrugarh": (27.4728, 94.9120, "NH-15", "Assam"),
    "tezpur": (26.6528, 92.7926, "NH-15", "Assam"),
    "gangtok": (27.3314, 88.6138, "NH-10", "Sikkim"),
    "teesta": (27.0500, 88.5200, "NH-10", "Sikkim"),
    "aizawl": (23.7307, 92.7173, "NH-306", "Mizoram"),
    "agartala": (23.8315, 91.2868, "NH-8", "Tripura"),
    "itanagar": (27.0844, 93.6053, "NH-415", "Arunachal Pradesh"),
    "tawang": (27.5861, 91.8594, "Bhalukpong-Tawang", "Arunachal Pradesh"),
}


class NewsCollector:
    @staticmethod
    async def collect() -> List[Dict[str, Any]]:
        sources_to_query = ["EASTMOJO_NEWS", "NORTHEAST_NOW_NEWS"]
        incidents: List[Dict[str, Any]] = []

        compiled_patterns = [re.compile(p, re.IGNORECASE) for p in DISASTER_KEYWORDS]

        for s_key in sources_to_query:
            config = SOURCE_REGISTRY[s_key]
            if not config.is_enabled:
                continue

            try:
                req = urllib.request.Request(config.endpoint_url, headers=config.headers)
                with urllib.request.urlopen(req, timeout=config.timeout_sec) as response:
                    xml_data = response.read()

                root = ET.fromstring(xml_data)
                items = root.findall(".//item")

                for item in items:
                    title = item.find("title").text if item.find("title") is not None else ""
                    desc = item.find("description").text if item.find("description") is not None else ""
                    link = item.find("link").text if item.find("link") is not None else ""
                    guid = item.find("guid").text if item.find("guid") is not None else link

                    full_text = f"{title} {desc}".lower()

                    # Check for disaster or road impact keywords
                    matches = [p for p in compiled_patterns if p.search(full_text)]
                    if not matches:
                        continue

                    # Geocode against gazetteer
                    matched_location = None
                    matched_road = None
                    lat, lng = None, None
                    region = "Northeast India"

                    for loc_name, (loc_lat, loc_lng, loc_road, loc_state) in NER_GAZETTEER.items():
                        if loc_name in full_text:
                            matched_location = loc_name.title()
                            lat, lng = loc_lat, loc_lng
                            matched_road = loc_road
                            region = loc_state
                            break

                    # If no specific town matched, skip or default to Guwahati region
                    if not lat or not lng:
                        continue

                    # Classify incident type from keywords
                    inc_type = "road_damage"
                    if "landslide" in full_text or "mudslide" in full_text:
                        inc_type = "landslide"
                    elif "flood" in full_text or "inundat" in full_text:
                        inc_type = "flood"
                    elif "rockfall" in full_text:
                        inc_type = "rockfall"
                    elif "bridge" in full_text:
                        inc_type = "bridge_damage"
                    elif "traffic" in full_text:
                        inc_type = "traffic"

                    now = datetime.now(timezone.utc)

                    incidents.append({
                        "source_event_id": f"news_{guid[:60]}",
                        "source_name": config.name,
                        "source_url": link,
                        "source_trust_level": SourceTrustLevel.REPUTABLE_NEWS.value,
                        "type": inc_type,
                        "severity": "HIGH" if inc_type in ("landslide", "bridge_damage") else "MEDIUM",
                        "status": "Partially Blocked" if inc_type in ("landslide", "bridge_damage") else "Caution",
                        "title": f"Reported by News: {title[:90]}",
                        "description": f"Published report from {config.name}: {title}. Corroboration in progress with district disaster cells.",
                        "latitude": lat,
                        "longitude": lng,
                        "address": f"{matched_location}, {region} ({matched_road or 'State Corridor'})",
                        "affected_road_code": matched_road,
                        "confidence_score": 0.65,  # News source: Level 3 trust, unconfirmed without official corroboration
                        "verification_status": "UNVERIFIED",
                        "impact_geometry_type": "POINT",
                        "impact_geometry_geojson": {
                            "type": "Point",
                            "coordinates": [lng, lat]
                        },
                        "raw_source_reference": {
                            "headline": title,
                            "url": link,
                            "source": config.name
                        },
                        "reported_at": now,
                        "expires_at": datetime.fromtimestamp(now.timestamp() + 43200, tz=timezone.utc),  # 12h validity
                        "is_live_external": True
                    })

            except Exception as e:
                logger.warning(f"News collector ({config.name}) fetch error: {e}")

        logger.info(f"News collector extracted {len(incidents)} corroborated transport articles.")
        return incidents
