"""
Incident Deduplication & Multi-Source Canonicalization Engine.
Correlates incoming reports across spatial and temporal proximity, merges multi-source evidence,
detects conflicting claims, and boosts confidence for corroborated events.
"""

import math
import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone

logger = logging.getLogger("neroute.intelligence.dedup")


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2 +
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
        math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


COMPATIBLE_TYPES = {
    "landslide": {"landslide", "rockfall", "road_damage", "road_closure", "sinking"},
    "rockfall": {"landslide", "rockfall", "road_damage", "road_closure"},
    "flood": {"flood", "heavy_rain", "flash_flood", "road_damage", "bridge_damage", "road_closure"},
    "heavy_rain": {"flood", "heavy_rain", "flash_flood", "cyclone"},
    "bridge_damage": {"bridge_damage", "flood", "road_damage", "road_closure"},
    "road_closure": {"road_closure", "landslide", "flood", "accident", "construction"},
    "earthquake": {"earthquake"},
    "accident": {"accident", "road_closure", "traffic"},
    "traffic": {"traffic", "accident", "road_closure"}
}


class IncidentDeduplicationEngine:
    @staticmethod
    def deduplicate(raw_incidents: List[Dict[str, Any]], spatial_threshold_km: float = 5.0) -> List[Dict[str, Any]]:
        if not raw_incidents:
            return []

        # Sort by trust level priority (OFFICIAL first, then VERIFIED_PROVIDER, then REPUTABLE_NEWS, then UNVERIFIED)
        trust_weights = {
            "OFFICIAL": 4,
            "VERIFIED_PROVIDER": 3,
            "REPUTABLE_NEWS": 2,
            "UNVERIFIED": 1
        }
        sorted_incidents = sorted(
            raw_incidents,
            key=lambda x: (trust_weights.get(x.get("source_trust_level", "UNVERIFIED"), 0), x.get("confidence_score", 0.5)),
            reverse=True
        )

        canonical_list: List[Dict[str, Any]] = []

        for inc in sorted_incidents:
            matched_canonical = None

            for canon in canonical_list:
                # 1. Spatial proximity
                dist_km = haversine_distance_km(
                    inc["latitude"], inc["longitude"],
                    canon["latitude"], canon["longitude"]
                )

                # Broader radius for earthquakes / severe weather storms
                effective_radius = 25.0 if inc["type"] in ("earthquake", "cyclone") else spatial_threshold_km
                if dist_km > effective_radius:
                    continue

                # 2. Type compatibility
                inc_type = inc["type"]
                canon_type = canon["type"]
                is_type_compatible = (
                    inc_type == canon_type or
                    canon_type in COMPATIBLE_TYPES.get(inc_type, set()) or
                    inc_type in COMPATIBLE_TYPES.get(canon_type, set())
                )
                if not is_type_compatible:
                    continue

                # 3. Temporal overlap (< 24 hours difference)
                t1 = inc["reported_at"]
                t2 = canon["reported_at"]
                if abs((t1 - t2).total_seconds()) > 86400:
                    continue

                # Match found!
                matched_canonical = canon
                break

            if matched_canonical:
                # Merge into canonical record
                canon = matched_canonical
                sources = canon.setdefault("sources", [
                    {
                        "source_name": canon["source_name"],
                        "source_url": canon["source_url"],
                        "trust_level": canon["source_trust_level"],
                        "status_claim": canon["status"]
                    }
                ])

                # Append new source
                new_source_entry = {
                    "source_name": inc["source_name"],
                    "source_url": inc["source_url"],
                    "trust_level": inc["source_trust_level"],
                    "status_claim": inc["status"]
                }
                if not any(s["source_name"] == inc["source_name"] for s in sources):
                    sources.append(new_source_entry)

                # Conflict detection (e.g. one claims Blocked, another claims Open)
                status_claims = {s.get("status_claim") for s in sources}
                if "Blocked" in status_claims and "Open" in status_claims:
                    canon["verification_status"] = "CONFLICTING"
                    canon["status"] = "Caution"
                    canon["title"] = f"CONFLICTING REPORTS: {canon['title']}"
                    canon["description"] += f" (Note: conflicting status reports received across {len(sources)} sources; exercising operational caution)."
                elif len(sources) >= 2:
                    canon["verification_status"] = "CONFIRMED"

                # Boost confidence with multiple corroborating sources
                canon["confidence_score"] = min(0.99, canon["confidence_score"] + 0.08)

                # Retain highest severity
                sev_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
                if sev_order.get(inc["severity"], 1) > sev_order.get(canon["severity"], 1):
                    canon["severity"] = inc["severity"]
                    canon["status"] = inc["status"]

            else:
                # Create new canonical entry
                canon_entry = dict(inc)
                canon_entry["sources"] = [
                    {
                        "source_name": inc["source_name"],
                        "source_url": inc["source_url"],
                        "trust_level": inc["source_trust_level"],
                        "status_claim": inc["status"]
                    }
                ]
                canonical_list.append(canon_entry)

        logger.info(f"Deduplication completed: {len(raw_incidents)} raw reports merged into {len(canonical_list)} canonical incidents.")
        return canonical_list
