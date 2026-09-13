"""
Incident Normalization Engine.
Converts heterogeneous external payloads into standardized canonical incident schema with data sanitation.
"""

import re
import html
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional


def compute_freshness(reported_at: datetime, expires_at: Optional[datetime] = None) -> str:
    now = datetime.now(timezone.utc)
    if reported_at.tzinfo is None:
        reported_at = reported_at.replace(tzinfo=timezone.utc)

    diff_sec = (now - reported_at).total_seconds()

    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now > expires_at:
            return "EXPIRED"

    if diff_sec <= 10800:     # <= 3 hours
        return "LIVE"
    elif diff_sec <= 43200:   # <= 12 hours
        return "RECENT"
    elif diff_sec <= 172800:  # <= 48 hours
        return "STALE"
    else:
        return "EXPIRED"


def sanitize_text(text: Optional[str]) -> str:
    if not text:
        return ""
    # Unescape HTML entities, strip dangerous tags, normalize whitespace
    cleaned = html.unescape(text)
    cleaned = re.sub(r"<[^>]+>", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


class IncidentNormalizer:
    @staticmethod
    def normalize(raw: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        reported_at = raw.get("reported_at") or now
        if isinstance(reported_at, str):
            try:
                reported_at = datetime.fromisoformat(reported_at)
            except Exception:
                reported_at = now
        if reported_at.tzinfo is None:
            reported_at = reported_at.replace(tzinfo=timezone.utc)

        expires_at = raw.get("expires_at")
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at)
            except Exception:
                expires_at = None

        freshness = compute_freshness(reported_at, expires_at)

        # Standardize severity
        raw_sev = str(raw.get("severity", "MEDIUM")).upper()
        if raw_sev in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
            severity = raw_sev
        else:
            severity = "MEDIUM"

        # Standardize status
        raw_stat = str(raw.get("status", "Caution")).title()
        valid_statuses = ("Open", "Partially Blocked", "Blocked", "Severely Affected", "Caution")
        status = raw_stat if raw_stat in valid_statuses else "Caution"

        # Standardize type
        raw_type = str(raw.get("type", "unknown")).lower().replace(" ", "_")
        valid_types = {
            "landslide", "road_closure", "flood", "heavy_rain", "flash_flood",
            "bridge_damage", "road_damage", "rockfall", "earthquake", "cyclone",
            "fallen_trees", "accident", "traffic", "construction", "sinking", "unknown"
        }
        incident_type = raw_type if raw_type in valid_types else "road_damage"

        # Trust level
        trust_level = raw.get("source_trust_level", "VERIFIED_PROVIDER")

        # Title & description sanitization
        title = sanitize_text(raw.get("title", f"{severity} {incident_type.replace('_', ' ').title()} Alert"))
        description = sanitize_text(raw.get("description", ""))

        lat = float(raw.get("latitude", 26.1445))
        lng = float(raw.get("longitude", 91.7362))

        return {
            "source_event_id": raw.get("source_event_id") or f"ext_{uuid.uuid4().hex[:8]}",
            "source_name": raw.get("source_name") or "External Intelligence",
            "source_url": raw.get("source_url"),
            "source_trust_level": trust_level,
            "type": incident_type,
            "severity": severity,
            "status": status,
            "title": title,
            "description": description,
            "latitude": lat,
            "longitude": lng,
            "address": sanitize_text(raw.get("address")),
            "affected_road_code": raw.get("affected_road_code"),
            "confidence_score": float(raw.get("confidence_score") or (0.95 if trust_level == "OFFICIAL" else (0.85 if trust_level == "VERIFIED_PROVIDER" else 0.65))),
            "verification_status": raw.get("verification_status") or ("CONFIRMED" if trust_level == "OFFICIAL" else "UNVERIFIED"),
            "impact_geometry_type": raw.get("impact_geometry_type", "POINT"),
            "impact_geometry_geojson": raw.get("impact_geometry_geojson") or {"type": "Point", "coordinates": [lng, lat]},
            "raw_source_reference": raw.get("raw_source_reference") or {},
            "reported_at": reported_at,
            "updated_at": now,
            "expires_at": expires_at,
            "freshness_state": freshness,
            "alternative_available": bool(raw.get("alternative_available", True)),
            "is_live_external": True
        }
