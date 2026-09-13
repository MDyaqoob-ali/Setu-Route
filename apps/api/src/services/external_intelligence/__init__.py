"""
External Intelligence Aggregation Layer for SETU-ROUTE.
"""

from src.services.external_intelligence.source_registry import (
    SOURCE_REGISTRY,
    SourceTrustLevel,
    SourceCategory,
    SourceConfig,
    is_point_in_ner
)
from src.services.external_intelligence.usgs_collector import USGSCollector
from src.services.external_intelligence.gdacs_collector import GDACSCollector
from src.services.external_intelligence.openmeteo_collector import OpenMeteoCollector
from src.services.external_intelligence.news_collector import NewsCollector
from src.services.external_intelligence.normalizer import IncidentNormalizer, compute_freshness
from src.services.external_intelligence.deduplication_engine import (
    IncidentDeduplicationEngine,
    haversine_distance_km
)
from src.services.external_intelligence.ingestion_coordinator import (
    IngestionCoordinator,
    ingestion_coordinator
)

__all__ = [
    "SOURCE_REGISTRY",
    "SourceTrustLevel",
    "SourceCategory",
    "SourceConfig",
    "is_point_in_ner",
    "USGSCollector",
    "GDACSCollector",
    "OpenMeteoCollector",
    "NewsCollector",
    "IncidentNormalizer",
    "compute_freshness",
    "IncidentDeduplicationEngine",
    "haversine_distance_km",
    "IngestionCoordinator",
    "ingestion_coordinator",
]
