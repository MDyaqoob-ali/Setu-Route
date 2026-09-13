"""
Road Accessibility Scoring Engine for NE-ROUTE.
Computes fine-grained corridor accessibility (0-100), operational status,
and reason codes based on active hazards, meteorological saturation, and road condition.
"""

from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.models import Road, RoadSegment, Incident
from src.services.weather_provider import weather_provider

class AccessibilityScoreResult:
    def __init__(
        self,
        score: float,
        status: str,
        reason_codes: List[str],
        timestamp: datetime
    ):
        self.score = score
        self.status = status
        self.reason_codes = reason_codes
        self.timestamp = timestamp

    def to_dict(self) -> Dict[str, Any]:
        return {
            "accessibility_score": self.score,
            "status": self.status,
            "reason_codes": self.reason_codes,
            "timestamp": self.timestamp.isoformat()
        }

class AccessibilityEngine:
    @staticmethod
    async def evaluate_segment(
        db: AsyncSession,
        segment: RoadSegment,
        weather_rain_1h: float = 0.0,
        active_incidents: List[Incident] = None
    ) -> AccessibilityScoreResult:
        now = datetime.now(timezone.utc)
        reasons = []
        score = 100.0

        # 1. Active Incidents Impact
        if active_incidents is None:
            # Query incidents on this segment or road
            query = select(Incident).where(
                (Incident.road_segment_id == segment.id) | (Incident.road_id == segment.road_id),
                Incident.status != "RESOLVED"
            )
            res = await db.execute(query)
            active_incidents = res.scalars().all()

        for inc in active_incidents:
            if inc.severity == "CRITICAL":
                score -= 75.0
                reasons.append(f"Critical {inc.type.replace('_', ' ').title()}: {inc.title}")
            elif inc.severity == "HIGH":
                score -= 40.0
                reasons.append(f"High-severity {inc.type.replace('_', ' ').title()} blocking lane")
            elif inc.severity == "MEDIUM":
                score -= 20.0
                reasons.append(f"Moderate obstruction ({inc.type.replace('_', ' ').title()}) causing slowdown")
            elif inc.severity == "LOW":
                score -= 8.0

        # 2. Road Surface Condition Impact
        cond = segment.surface_condition or "Good"
        if "Waterlogged" in cond:
            score -= 35.0
            reasons.append("Road surface submerged / waterlogged")
        elif "Unpaved Muddy" in cond or "Damaged" in cond:
            score -= 20.0
            reasons.append("Severe surface rutting and mud accumulation")
        elif "Fair" in cond:
            score -= 5.0

        # 3. Weather / Precipitation Impact
        if weather_rain_1h > 25.0:
            score -= 25.0
            reasons.append(f"Intense torrential downpour ({weather_rain_1h:.1f} mm/h)")
        elif weather_rain_1h > 10.0:
            score -= 10.0
            reasons.append(f"Moderate rainfall ({weather_rain_1h:.1f} mm/h)")

        # 4. Slope & Elevation Terrain Factor
        if segment.elevation_m > 2000 and weather_rain_1h > 15.0:
            score -= 15.0
            reasons.append("High altitude saturated slope risk (>2,000m)")

        # 5. Data Freshness Check
        if segment.last_assessed_at:
            age_hours = (now - segment.last_assessed_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600.0
            if age_hours > 24.0:
                score -= 10.0
                reasons.append(f"Telemetry stale ({int(age_hours)}h without field verification)")

        # Clamp score between 0 and 100
        score = max(0.0, min(100.0, round(score, 1)))

        # Determine Operational Status
        if score >= 75.0:
            status = "ACCESSIBLE"
        elif score >= 35.0:
            status = "RESTRICTED"
        else:
            status = "BLOCKED"

        if not reasons:
            reasons.append("Clear carriageway, normal gradient, optimal operating conditions")

        return AccessibilityScoreResult(
            score=score,
            status=status,
            reason_codes=reasons,
            timestamp=now
        )

    @staticmethod
    async def update_all_segments(db: AsyncSession):
        """
        Recomputes accessibility across all road segments in the database.
        """
        segments_res = await db.execute(select(RoadSegment))
        segments = segments_res.scalars().all()

        for seg in segments:
            # Get local weather
            obs = await weather_provider.get_observation_for_location(seg.start_lat, seg.start_lng)
            result = await AccessibilityEngine.evaluate_segment(db, seg, weather_rain_1h=obs.rainfall_1h_mm)

            seg.accessibility_status = result.status
            seg.risk_score = round(1.0 - (result.score / 100.0), 2)
            seg.last_assessed_at = result.timestamp

        # Also aggregate to parent Road status
        roads_res = await db.execute(select(Road))
        roads = roads_res.scalars().all()
        for r in roads:
            road_segs = [s for s in segments if s.road_id == r.id]
            if road_segs:
                if any(s.accessibility_status == "BLOCKED" for s in road_segs):
                    r.accessibility_status = "BLOCKED"
                    r.current_risk_score = max(0.8, max(s.risk_score for s in road_segs))
                elif any(s.accessibility_status == "RESTRICTED" for s in road_segs):
                    r.accessibility_status = "RESTRICTED"
                    r.current_risk_score = max(0.5, max(s.risk_score for s in road_segs))
                else:
                    r.accessibility_status = "ACCESSIBLE"
                    r.current_risk_score = min(s.risk_score for s in road_segs)

        await db.commit()
