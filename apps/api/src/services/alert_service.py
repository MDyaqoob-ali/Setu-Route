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
