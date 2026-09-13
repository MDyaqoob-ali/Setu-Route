from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from src.models import Alert, User
from src.ws.connection_manager import ws_manager

class AlertService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        severity: Optional[str] = None,
        is_acknowledged: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Alert]:
        query = select(Alert).order_by(desc(Alert.created_at))
        if severity:
            query = query.where(Alert.severity == severity)
        if is_acknowledged is not None:
            query = query.where(Alert.is_acknowledged == is_acknowledged)
        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def acknowledge(db: AsyncSession, alert_id: str, user: Optional[User] = None) -> Optional[Alert]:
        query = select(Alert).where(Alert.id == alert_id)
        result = await db.execute(query)
        alert = result.scalar_one_or_none()
        if not alert:
            return None

        alert.is_acknowledged = True
        alert.acknowledged_at = datetime.now(timezone.utc)
        if user:
            alert.acknowledged_by_id = user.id

        await db.commit()
        await db.refresh(alert)

        await ws_manager.broadcast("alerts", "ALERT_ACKNOWLEDGED", {
            "id": alert.id,
            "alert_code": alert.alert_code,
            "is_acknowledged": True,
            "acknowledged_at": alert.acknowledged_at.isoformat()
        })
        return alert

    @staticmethod
    async def get_summary(db: AsyncSession) -> dict:
        query = select(Alert).where(Alert.is_acknowledged == False).order_by(desc(Alert.created_at))
        result = await db.execute(query)
        unacked = result.scalars().all()

        critical_count = sum(1 for a in unacked if a.severity == "CRITICAL")
        high_count = sum(1 for a in unacked if a.severity == "HIGH")
        medium_count = sum(1 for a in unacked if a.severity == "MEDIUM")
        low_count = sum(1 for a in unacked if a.severity == "LOW")

        latest_threat = None
        for a in unacked:
            if a.severity in ["CRITICAL", "HIGH"]:
                latest_threat = {
                    "id": a.id,
                    "alert_code": a.alert_code,
                    "title": a.title,
                    "severity": a.severity,
                    "what_happened": a.what_happened,
                    "why_it_matters": a.why_it_matters,
                    "who_is_affected": a.who_is_affected,
                    "recommended_action": a.recommended_action,
                    "created_at": a.created_at.isoformat() if a.created_at else None
                }
                break

        return {
            "total_unacknowledged": len(unacked),
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count,
            "low_count": low_count,
            "latest_threat": latest_threat,
            "status": "LIVE_TELEMETRY"
        }
