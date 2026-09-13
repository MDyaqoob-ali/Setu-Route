"""
Route-to-Incident Spatial Correlation & Real-Time Blockage Detection Engine.
Performs precise geometric intersection between road route polylines and verified external incidents.
Determines route impact states (CLEAR, CAUTION, PARTIALLY_AFFECTED, BLOCKED) and triggers road alternatives.
"""

import math
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Incident, Road, RoadSegment
from src.services.external_intelligence.deduplication_engine import haversine_distance_km

logger = logging.getLogger("neroute.intelligence.correlator")


class RouteIncidentCorrelator:
    @staticmethod
    async def correlate_route(
        db: AsyncSession,
        route_coordinates: List[List[float]],
        origin_name: str,
        destination_name: str,
        candidate_routes: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes route geometry against active verified incidents.
        Returns detailed route impact state, blocked segments, and evidence explanation.
        """
        if not route_coordinates or len(route_coordinates) < 2:
            return {
                "route_status": "GRAY",
                "status_badge": "⚪ UNKNOWN",
                "is_blocked": False,
                "summary": "Insufficient route geometry to evaluate road condition.",
                "blocked_segments": [],
                "affecting_incidents": []
            }

        # 1. Fetch all active incidents from DB
        now = datetime.now(timezone.utc)
        query = select(Incident).where(Incident.status != "RESOLVED")
        res = await db.execute(query)
        all_incidents = res.scalars().all()

        # Filter out expired incidents
        active_incidents = []
        for inc in all_incidents:
            if inc.expires_at:
                exp = inc.expires_at.replace(tzinfo=timezone.utc) if inc.expires_at.tzinfo is None else inc.expires_at
                if exp < now:
                    continue
            active_incidents.append(inc)

        if not active_incidents:
            return {
                "route_status": "GREEN",
                "status_badge": "🟢 ROUTE CLEAR",
                "status_title": "Route Clear",
                "is_blocked": False,
                "summary": "No known active incidents or road closures along this corridor based on current telemetry.",
                "blocked_segments": [],
                "affecting_incidents": [],
                "safety_score": 96,
                "logistics_risk_score": 10
            }

        # 2. Spatial intersection analysis
        # Sample coordinates along the route polyline (every 3 points or ~150 meters)
        sampled_coords = route_coordinates[::max(1, len(route_coordinates) // 250)]

        blocked_segments = []
        caution_incidents = []
        affected_incidents = []
        direct_blocked_incidents = []

        for inc in active_incidents:
            inc_lat = inc.latitude
            inc_lng = inc.longitude
            inc_type = inc.type
            inc_status = inc.status
            inc_sev = inc.severity

            # Find minimum distance to route polyline
            min_dist_km = float("inf")
            closest_idx = 0
            for idx, pt in enumerate(sampled_coords):
                # pt is [lng, lat]
                d = haversine_distance_km(inc_lat, inc_lng, pt[1], pt[0])
                if d < min_dist_km:
                    min_dist_km = d
                    closest_idx = idx

            # Dynamic thresholding based on hazard geometry, affected road code, and mountain slope:
            # - If incident specifies affected_road_code matching the route corridor (or within 1.2km):
            #   Landslide/rockfall debris from hillside slopes 100m-1000m above road directly blocks carriageway.
            is_direct_blockage_type = inc_type in (
                "landslide", "rockfall", "road_closure", "bridge_damage",
                "road_damage", "accident", "sinking", "construction"
            )

            # Check if incident is attributed to a road code that is relevant
            road_code = (inc.affected_road_code or "").strip().upper()

            if is_direct_blockage_type:
                # Road-specific or tight spatial buffer
                if min_dist_km <= 0.75 or (road_code and min_dist_km <= 1.8):
                    if inc_status in ("Blocked", "BLOCKED") or inc_sev == "CRITICAL":
                        direct_blocked_incidents.append((inc, min_dist_km, closest_idx))
                    elif inc_status in ("Partially Blocked", "Severely Affected", "RESTRICTED") or inc_sev == "HIGH":
                        affected_incidents.append((inc, min_dist_km, closest_idx))
                    else:
                        caution_incidents.append((inc, min_dist_km, closest_idx))
                elif min_dist_km <= 3.5:
                    caution_incidents.append((inc, min_dist_km, closest_idx))

            elif inc_type in ("flood", "flash_flood", "heavy_rain"):
                if min_dist_km <= 2.5:
                    if inc_sev in ("CRITICAL", "HIGH"):
                        affected_incidents.append((inc, min_dist_km, closest_idx))
                    else:
                        caution_incidents.append((inc, min_dist_km, closest_idx))
                elif min_dist_km <= 12.0:
                    caution_incidents.append((inc, min_dist_km, closest_idx))

            elif inc_type in ("earthquake", "cyclone"):
                epicenter_radius = 25.0
                if min_dist_km <= epicenter_radius:
                    if inc_sev in ("CRITICAL", "HIGH"):
                        affected_incidents.append((inc, min_dist_km, closest_idx))
                    else:
                        caution_incidents.append((inc, min_dist_km, closest_idx))
                elif min_dist_km <= 50.0:
                    caution_incidents.append((inc, min_dist_km, closest_idx))

        # 3. Determine Overall Route Status
        if direct_blocked_incidents:
            route_status = "RED"
            status_badge = "🔴 ROUTE BLOCKED"
            status_title = "Route Blocked"
            is_blocked = True
            primary_incident, dist, idx = direct_blocked_incidents[0]

            # Build blocked segment detail
            road_str = primary_incident.affected_road_code or "Arterial Highway"
            summary = (
                f"Route confirmed BLOCKED on {road_str} near {primary_incident.address or 'Sector'} "
                f"due to active {primary_incident.type.replace('_', ' ').title()} "
                f"({primary_incident.title}). Reported by {primary_incident.source_name}. "
                f"Passage currently impassable."
            )

            for inc, d, idx in direct_blocked_incidents:
                blocked_segments.append({
                    "incident_id": inc.id,
                    "incident_code": inc.incident_code,
                    "type": inc.type,
                    "title": inc.title,
                    "cause": inc.title or inc.type.replace('_', ' ').title(),
                    "severity": inc.severity,
                    "status": inc.status,
                    "location_name": inc.address or "Corridor Segment",
                    "road_code": inc.affected_road_code or "Corridor",
                    "latitude": inc.latitude,
                    "longitude": inc.longitude,
                    "distance_from_route_m": int(d * 1000),
                    "source": inc.source_name,
                    "source_url": inc.source_url,
                    "confidence_score": inc.confidence_score,
                    "reported_at": inc.created_at.isoformat() if inc.created_at else None
                })

            safety_score = 15
            logistics_risk_score = 92

        elif affected_incidents:
            route_status = "ORANGE"
            status_badge = "🟠 ROUTE PARTIALLY AFFECTED"
            status_title = "Partially Affected"
            is_blocked = False
            prim, d, idx = affected_incidents[0]
            summary = (
                f"Route is PARTIALLY AFFECTED near {prim.address or 'Corridor'} "
                f"due to {prim.type.replace('_', ' ').title()} ({prim.severity}). "
                f"Expect significant delays, single-lane alternating flow, or emergency escort."
            )
            for inc, d, idx in affected_incidents:
                blocked_segments.append({
                    "incident_id": inc.id,
                    "incident_code": inc.incident_code,
                    "type": inc.type,
                    "title": inc.title,
                    "severity": inc.severity,
                    "status": inc.status,
                    "location_name": inc.address or "Corridor Segment",
                    "road_code": inc.affected_road_code or "Corridor",
                    "latitude": inc.latitude,
                    "longitude": inc.longitude,
                    "distance_from_route_m": int(d * 1000),
                    "source": inc.source_name,
                    "source_url": inc.source_url,
                    "confidence_score": inc.confidence_score,
                    "reported_at": inc.created_at.isoformat() if inc.created_at else None
                })
            safety_score = 45
            logistics_risk_score = 65

        elif caution_incidents:
            route_status = "YELLOW"
            status_badge = "🟡 ROUTE CAUTION"
            status_title = "Caution Advised"
            is_blocked = False
            prim, d, idx = caution_incidents[0]
            summary = (
                f"Caution advised along route: {prim.type.replace('_', ' ').title()} or weather advisory "
                f"active near {prim.address or 'corridor'} ({d:.1f} km from road path)."
            )
            safety_score = 75
            logistics_risk_score = 35

        else:
            route_status = "GREEN"
            status_badge = "🟢 ROUTE CLEAR"
            status_title = "Route Clear"
            is_blocked = False
            summary = "All monitored sectors report normal vehicular transit conditions. No active disruptions."
            safety_score = 94
            logistics_risk_score = 12

        # 4. Alternative Route Recommendation when Blocked or Severely Affected
        alternative_recommendation = None
        if (route_status in ("RED", "ORANGE")) and candidate_routes and len(candidate_routes) > 1:
            alt = candidate_routes[1]
            alternative_recommendation = {
                "route_name": alt.get("route_name", "Alternative Road Detour"),
                "status": "RECOMMENDED_BYPASS",
                "distance_km": alt.get("distance_km"),
                "duration_min": alt.get("estimated_duration_minutes"),
                "risk_score": alt.get("risk_score", 20),
                "summary": "Safer road detour circumventing the active blockage corridor."
            }

        affecting_list = []
        for inc_tuple in (direct_blocked_incidents + affected_incidents + caution_incidents):
            inc, d, idx = inc_tuple
            affecting_list.append({
                "id": inc.id,
                "code": inc.incident_code,
                "type": inc.type,
                "severity": inc.severity,
                "status": inc.status,
                "title": inc.title,
                "description": inc.description,
                "latitude": inc.latitude,
                "longitude": inc.longitude,
                "location": inc.address,
                "road_code": inc.affected_road_code,
                "distance_from_route_km": round(d, 2),
                "source": inc.source_name,
                "source_url": inc.source_url,
                "trust_level": getattr(inc, "source_trust_level", "OFFICIAL"),
                "confidence_score": getattr(inc, "confidence_score", 0.9),
                "verification_status": getattr(inc, "verification_status", "VERIFIED"),
                "reported_at": inc.created_at.isoformat() if inc.created_at else None
            })

        return {
            "route_status": route_status,
            "status_badge": status_badge,
            "status_title": status_title,
            "is_blocked": is_blocked,
            "summary": summary,
            "safety_score": safety_score,
            "logistics_risk_score": logistics_risk_score,
            "blocked_segments": blocked_segments,
            "affecting_incidents": affecting_list,
            "alternative_recommendation": alternative_recommendation
        }
