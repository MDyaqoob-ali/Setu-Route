"""
Source Registry and Trust Hierarchy for SETU-ROUTE Real-Time Intelligence.
Defines verified online sources, rate limits, update intervals, and reliability levels.
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


class SourceTrustLevel(str, Enum):
    OFFICIAL = "OFFICIAL"                      # Level 1: Govt agencies, USGS, GDACS, IMD, Police, PWD
    VERIFIED_PROVIDER = "VERIFIED_PROVIDER"    # Level 2: Open-Meteo, established geospatial APIs
    REPUTABLE_NEWS = "REPUTABLE_NEWS"          # Level 3: Verified news feeds (EastMojo, Northeast Now)
    UNVERIFIED = "UNVERIFIED"                  # Level 4: Crowdsourced / field citizen reports


class SourceCategory(str, Enum):
    SEISMIC = "SEISMIC"
    WEATHER = "WEATHER"
    DISASTER = "DISASTER"
    ROAD_AGENCY = "ROAD_AGENCY"
    NEWS = "NEWS"


class SourceConfig:
    def __init__(
        self,
        name: str,
        category: SourceCategory,
        trust_level: SourceTrustLevel,
        endpoint_url: str,
        timeout_sec: float = 12.0,
        refresh_interval_sec: int = 300,
        headers: Optional[Dict[str, str]] = None,
        is_enabled: bool = True,
        source_id: str = ""
    ):
        self.name = name
        self.category = category
        self.trust_level = trust_level
        self.endpoint_url = endpoint_url
        self.timeout_sec = timeout_sec
        self.refresh_interval_sec = refresh_interval_sec
        self.headers = headers or {"User-Agent": "SETU-Route-Intelligence/2.0 (+https://github.com/MDyaqoob-ali/Setu-Route)"}
        self.is_enabled = is_enabled
        self.source_id = source_id or name.lower().replace(" ", "_")


# Registered Legitimate Online Sources for Northeast India
SOURCE_REGISTRY: Dict[str, SourceConfig] = {
    "USGS_EARTHQUAKES": SourceConfig(
        name="USGS Earthquake Hazards Program",
        category=SourceCategory.SEISMIC,
        trust_level=SourceTrustLevel.OFFICIAL,
        endpoint_url="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
        timeout_sec=10.0,
        refresh_interval_sec=300,
        source_id="usgs_earthquakes"
    ),
    "GDACS_DISASTERS": SourceConfig(
        name="GDACS - Global Disaster Alert and Coordination System (UN/EC)",
        category=SourceCategory.DISASTER,
        trust_level=SourceTrustLevel.OFFICIAL,
        endpoint_url="https://www.gdacs.org/xml/rss.xml",
        timeout_sec=12.0,
        refresh_interval_sec=300,
        source_id="gdacs_disasters"
    ),
    "OPEN_METEO_WEATHER": SourceConfig(
        name="Open-Meteo High-Resolution Meteorological Telemetry",
        category=SourceCategory.WEATHER,
        trust_level=SourceTrustLevel.VERIFIED_PROVIDER,
        endpoint_url="https://api.open-meteo.com/v1/forecast",
        timeout_sec=10.0,
        refresh_interval_sec=300,
        source_id="openmeteo_weather"
    ),
    "OPEN_METEO_FLOOD": SourceConfig(
        name="Open-Meteo Global River Runoff & Discharge API",
        category=SourceCategory.DISASTER,
        trust_level=SourceTrustLevel.VERIFIED_PROVIDER,
        endpoint_url="https://flood-api.open-meteo.com/v1/flood",
        timeout_sec=10.0,
        refresh_interval_sec=600,
        source_id="openmeteo_flood"
    ),
    "EASTMOJO_NEWS": SourceConfig(
        name="EastMojo Regional Northeast Intelligence Feed",
        category=SourceCategory.NEWS,
        trust_level=SourceTrustLevel.REPUTABLE_NEWS,
        endpoint_url="https://www.eastmojo.com/feed/",
        timeout_sec=10.0,
        refresh_interval_sec=600,
        source_id="eastmojo_news"
    ),
    "NORTHEAST_NOW_NEWS": SourceConfig(
        name="Northeast Now Infrastructure & Disaster Feed",
        category=SourceCategory.NEWS,
        trust_level=SourceTrustLevel.REPUTABLE_NEWS,
        endpoint_url="https://nenow.in/feed",
        timeout_sec=10.0,
        refresh_interval_sec=600,
        source_id="northeast_now_news"
    ),
}

# Northeast India Geospatial Bounding Box (Assam, Meghalaya, Arunachal, Manipur, Mizoram, Nagaland, Tripura, Sikkim)
NER_BOUNDS = {
    "min_lat": 21.5,
    "max_lat": 29.8,
    "min_lng": 87.8,
    "max_lng": 97.5
}

def is_point_in_ner(lat: float, lng: float, margin_deg: float = 0.5) -> bool:
    """Check if coordinates fall within Northeast India and immediate border corridors."""
    return (
        (NER_BOUNDS["min_lat"] - margin_deg) <= lat <= (NER_BOUNDS["max_lat"] + margin_deg) and
        (NER_BOUNDS["min_lng"] - margin_deg) <= lng <= (NER_BOUNDS["max_lng"] + margin_deg)
    )


class SourceRegistry:
    @classmethod
    def list_sources(cls) -> List[SourceConfig]:
        return list(SOURCE_REGISTRY.values())

    @classmethod
    def get_source(cls, source_id: str) -> Optional[SourceConfig]:
        target = source_id.lower().replace(" ", "").replace("_", "").replace("-", "")
        for s in SOURCE_REGISTRY.values():
            s_key = s.source_id.lower().replace(" ", "").replace("_", "").replace("-", "")
            s_name = s.name.lower().replace(" ", "").replace("_", "").replace("-", "")
            if s_key == target or s_name == target:
                return s
        return None
