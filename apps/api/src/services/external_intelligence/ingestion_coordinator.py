"""
Central Ingestion Coordinator for External Real-Time Intelligence.
Coordinates collectors, normalizers, deduplication, road snapping, and persistence.
"""

import time
import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import AsyncSessionLocal
from src.models import Incident, Road, RoadSegment, District, SourceHealth, Alert
from src.services.external_intelligence.source_registry import SOURCE_REGISTRY
from src.services.external_intelligence.usgs_collector import USGSCollector
from src.services.external_intelligence.gdacs_collector import GDACSCollector
from src.services.external_intelligence.openmeteo_collector import OpenMeteoCollector
from src.services.external_intelligence.news_collector import NewsCollector
from src.services.external_intelligence.normalizer import IncidentNormalizer
from src.services.external_intelligence.deduplication_engine import (
    IncidentDeduplicationEngine,
    haversine_distance_km
)
from src.ws.connection_manager import ws_manager
from src.services.alert_rule_engine import AlertRuleEngine

logger = logging.getLogger("neroute.intelligence.coordinator")


class IngestionCoordinator:
    _instance: Optional["IngestionCoordinator"] = None
    _last_sync_time: Optional[datetime] = None
    _source_health_cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get_instance(cls) -> "IngestionCoordinator":
        if cls._instance is None:
            cls._instance = IngestionCoordinator()
        return cls._instance

    async def sync_all_sources(self) -> Dict[str, Any]:
        """Execute full ingestion cycle across all registered real-world data feeds."""
        start_time = time.time()
        logger.info("[*] Starting External Intelligence Ingestion cycle across Northeast India feeds...")

        raw_records: List[Dict[str, Any]] = []
        source_results: Dict[str, Any] = {}

        # 1. Collect from USGS Earthquakes
        t0 = time.time()
        try:
            usgs_events = await USGSCollector.collect()
            raw_records.extend(usgs_events)
            latency = int((time.time() - t0) * 1000)
            source_results["USGS_EARTHQUAKES"] = {"status": "ONLINE", "count": len(usgs_events), "latency_ms": latency}
        except Exception as e:
            logger.warning(f"USGS Collector failed: {e}")
            source_results["USGS_EARTHQUAKES"] = {"status": "DEGRADED", "count": 0, "error": str(e)}

        # 2. Collect from GDACS (UN/EC)
        t0 = time.time()
        try:
            gdacs_events = await GDACSCollector.collect()
            raw_records.extend(gdacs_events)
            latency = int((time.time() - t0) * 1000)
            source_results["GDACS_DISASTERS"] = {"status": "ONLINE", "count": len(gdacs_events), "latency_ms": latency}
        except Exception as e:
            logger.warning(f"GDACS Collector failed: {e}")
            source_results["GDACS_DISASTERS"] = {"status": "DEGRADED", "count": 0, "error": str(e)}

        # 3. Collect from Open-Meteo Weather & Flood
        t0 = time.time()
        try:
            meteo_events = await OpenMeteoCollector.collect()
            raw_records.extend(meteo_events)
            latency = int((time.time() - t0) * 1000)
            source_results["OPEN_METEO_WEATHER"] = {"status": "ONLINE", "count": len(meteo_events), "latency_ms": latency}
        except Exception as e:
            logger.warning(f"Open-Meteo Collector failed: {e}")
            source_results["OPEN_METEO_WEATHER"] = {"status": "DEGRADED", "count": 0, "error": str(e)}

        # 4. Collect from Regional News Feeds (EastMojo, Northeast Now)
        t0 = time.time()
        try:
            news_events = await NewsCollector.collect()
            raw_records.extend(news_events)
            latency = int((time.time() - t0) * 1000)
            source_results["REGIONAL_NEWS"] = {"status": "ONLINE", "count": len(news_events), "latency_ms": latency}
        except Exception as e:
            logger.warning(f"News Collector failed: {e}")
            source_results["REGIONAL_NEWS"] = {"status": "DEGRADED", "count": 0, "error": str(e)}

        # 5. Normalize
        normalized_records = [IncidentNormalizer.normalize(r) for r in raw_records]

        # 6. Deduplicate & Canonicalize
        canonical_incidents = IncidentDeduplicationEngine.deduplicate(normalized_records, spatial_threshold_km=5.0)

        # 7. Persist to Database and update road linkages
        persisted_count = await self._persist_canonical_incidents(canonical_incidents, source_results)

        self._last_sync_time = datetime.now(timezone.utc)
        total_duration = time.time() - start_time
        logger.info(
            f"[+] Ingestion cycle completed in {total_duration:.2f}s: "
            f"{len(raw_records)} raw -> {len(canonical_incidents)} canonical -> {persisted_count} active in DB."
        )

        # 8. Broadcast update to connected clients via WebSocket
        try:
            await ws_manager.broadcast("intelligence", "INTELLIGENCE_STREAM_REFRESH", {
                "active_incidents_count": persisted_count,
                "sources_online": sum(1 for s in source_results.values() if s.get("status") == "ONLINE"),
                "sources_total": len(source_results),
                "last_sync": self._last_sync_time.isoformat()
            })
        except Exception:
            pass

        return {
            "status": "SUCCESS",
            "duration_sec": total_duration,
            "raw_count": len(raw_records),
            "canonical_count": len(canonical_incidents),
            "persisted_count": persisted_count,
            "sources": source_results
        }

    async def _persist_canonical_incidents(
        self,
        canonical_list: List[Dict[str, Any]],
        source_results: Dict[str, Any]
    ) -> int:
        if not canonical_list:
            return 0

        async with AsyncSessionLocal() as db:
            # Fetch all roads and districts for geospatial snapping
            res_roads = await db.execute(select(Road))
            roads = res_roads.scalars().all()

            res_districts = await db.execute(select(District))
            districts = res_districts.scalars().all()
            default_district_id = districts[0].id if districts else "dist-001"

            saved_count = 0

            for canon in canonical_list:
                c_lat = canon["latitude"]
                c_lng = canon["longitude"]
                source_event_id = canon["source_event_id"]

                # Snap to nearest road
                matched_road_id = None
                matched_road_code = canon.get("affected_road_code")
                min_road_dist = float("inf")

                for r in roads:
                    if matched_road_code and r.code.lower() == matched_road_code.lower():
                        matched_road_id = r.id
                        break

                    # Proximity check with road coordinates if available
                    if r.geometry_geojson and r.geometry_geojson.get("coordinates"):
                        coords = r.geometry_geojson["coordinates"]
                        for c in coords[::10]:  # Sample points
                            d = haversine_distance_km(c_lat, c_lng, c[1], c[0])
                            if d < min_road_dist:
                                min_road_dist = d
                                if d <= 15.0:  # Within 15km corridor buffer
                                    matched_road_id = r.id
                                    matched_road_code = r.code

                # Snap to nearest district
                matched_district_id = default_district_id
                min_dist_dist = float("inf")
                for dist in districts:
                    d = haversine_distance_km(c_lat, c_lng, dist.latitude, dist.longitude)
                    if d < min_dist_dist:
                        min_dist_dist = d
                        matched_district_id = dist.id

                # Check if incident already exists by source_event_id
                existing_res = await db.execute(
                    select(Incident).where(Incident.source_event_id == source_event_id)
                )
                existing = existing_res.scalar_one_or_none()

                if existing:
                    # Update existing record
                    existing.title = canon["title"]
                    existing.description = canon["description"]
                    existing.severity = canon["severity"]
                    existing.status = canon["status"]
                    existing.confidence_score = canon["confidence_score"]
                    existing.verification_status = canon["verification_status"]
                    existing.expires_at = canon["expires_at"]
                    existing.updated_at = datetime.now(timezone.utc)
                    if matched_road_id:
                        existing.road_id = matched_road_id
                        existing.affected_road_code = matched_road_code
                else:
                    # Insert new Incident
                    inc_code = f"INC-2026-{abs(hash(source_event_id)) % 9000 + 1000}"
                    new_inc = Incident(
                        incident_code=inc_code,
                        type=canon["type"],
                        severity=canon["severity"],
                        status=canon["status"],
                        title=canon["title"],
                        description=canon["description"],
                        latitude=c_lat,
                        longitude=c_lng,
                        address=canon.get("address") or f"Location [{c_lat:.3f}, {c_lng:.3f}]",
                        road_id=matched_road_id,
                        district_id=matched_district_id,
                        affected_traffic_direction="BOTH",
                        verification_status=canon["verification_status"],
                        source_name=canon["source_name"],
                        source_url=canon.get("source_url"),
                        source_trust_level=canon["source_trust_level"],
                        source_event_id=source_event_id,
                        raw_source_reference=canon.get("raw_source_reference") or {},
                        confidence_score=canon["confidence_score"],
                        affected_road_code=matched_road_code,
                        impact_geometry_type=canon.get("impact_geometry_type", "POINT"),
                        impact_geometry_geojson=canon.get("impact_geometry_geojson"),
                        expires_at=canon.get("expires_at"),
                        alternative_available=canon.get("alternative_available", True),
                        is_live_external=True
                    )
                    db.add(new_inc)

                    # Update road status if critical closure
                    if matched_road_id and canon["status"] == "Blocked":
                        await db.execute(
                            update(Road)
                            .where(Road.id == matched_road_id)
                            .values(accessibility_status="BLOCKED", current_risk_score=0.95)
                        )

                    # Trigger real-time actionable operational alert for severe hazards and closures
                    matched_road_obj = next((r for r in roads if r.id == matched_road_id), None)
                    if canon.get("severity") in ["CRITICAL", "HIGH"] or canon.get("status") in ["Blocked", "Partially Blocked"]:
                        try:
                            await db.flush()
                            target_inc = new_inc if not existing else existing
                            await AlertRuleEngine.trigger_external_hazard_alert(db, target_inc, matched_road_obj)
                        except Exception as alert_err:
                            logger.warning(f"Could not generate hazard alert: {alert_err}")

                saved_count += 1

            # Update SourceHealth table
            for src_key, info in source_results.items():
                health_res = await db.execute(
                    select(SourceHealth).where(SourceHealth.source_name == src_key)
                )
                h_rec = health_res.scalar_one_or_none()
                now = datetime.now(timezone.utc)
                if h_rec:
                    h_rec.status = info.get("status", "ONLINE")
                    h_rec.last_sync_at = now
                    h_rec.incident_count = info.get("count", 0)
                    h_rec.last_latency_ms = info.get("latency_ms", 0)
                    h_rec.last_error_message = info.get("error")
                else:
                    new_h = SourceHealth(
                        source_name=src_key,
                        source_category="DISASTER",
                        trust_level="OFFICIAL",
                        status=info.get("status", "ONLINE"),
                        last_sync_at=now,
                        incident_count=info.get("count", 0),
                        last_latency_ms=info.get("latency_ms", 0),
                        last_error_message=info.get("error")
                    )
                    db.add(new_h)

            await db.commit()
            return saved_count

    async def ensure_alerts_for_active_hazards(self) -> int:
        """
        Backfills operational threat alerts for active critical/high hazards in the database if not already created.
        """
        async with AsyncSessionLocal() as db:
            res = await db.execute(
                select(Incident)
                .where(
                    Incident.status != "Resolved",
                    Incident.severity.in_(["CRITICAL", "HIGH"])
                )
                .limit(20)
            )
            incidents = res.scalars().all()
            if not incidents:
                return 0

            roads_res = await db.execute(select(Road))
            roads_map = {r.id: r for r in roads_res.scalars().all()}

            generated = 0
            for inc in incidents:
                road = roads_map.get(inc.road_id)
                alert = await AlertRuleEngine.trigger_external_hazard_alert(db, inc, road)
                if alert:
                    generated += 1
            return generated


# Global singleton
ingestion_coordinator = IngestionCoordinator.get_instance()
