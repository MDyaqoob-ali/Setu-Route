from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.dependencies import get_current_user_optional
from src.core.exceptions import EntityNotFoundError
from src.models import User
from src.schemas import AlertResponse
from src.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/summary")
async def get_alerts_summary(db: AsyncSession = Depends(get_db)):
    """
    Returns high-frequency operational alert summary including counts and latest threat.
    """
    return await AlertService.get_summary(db)

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    severity: Optional[str] = None,
    is_acknowledged: Optional[bool] = None,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    return await AlertService.get_all(
        db=db,
        severity=severity,
        is_acknowledged=is_acknowledged,
        limit=limit,
        offset=offset
    )

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    alert = await AlertService.acknowledge(db, alert_id, current_user)
    if not alert:
        raise EntityNotFoundError("Alert", alert_id)
    return alert
