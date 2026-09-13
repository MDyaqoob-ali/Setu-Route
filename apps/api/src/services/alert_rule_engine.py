"""
Extensible Alert Rule Engine for NE-ROUTE.
Evaluates state transitions and generates structured 4-part actionable operational alerts.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import random
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import Alert, Road, Vehicle, Delivery, Incident
from src.ws.connection_manager import ws_manager

class AlertRuleResult:
    def __init__(
        self,
        alert_code: str,
        alert_type: str,
        severity: str,
        title: str,
        what_happened: str,
        why_it_matters: str,
        who_is_affected: str,
        recommended_action: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        district_id: Optional[str] = None
    ):
        self.alert_code = alert_code
        self.alert_type = alert_type
        self.severity = severity
        self.title = title
        self.what_happened = what_happened
        self.why_it_matters = why_it_matters
        self.who_is_affected = who_is_affected
        self.recommended_action = recommended_action
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.district_id = district_id

class AlertRuleEngine:
    @staticmethod
    async def trigger_road_blocked_alert(
        db: AsyncSession,
        road: Road,
        incident: Incident
    ) -> Alert:
        code = f"ALT-BLK-{uuid.uuid4().hex[:6].upper()}"
        title = f"Corridor Closure Alert: {road.code} Blocked"
        what = f"{road.code} ({road.name}) is completely BLOCKED near {incident.address or 'mile marker'} due to {incident.severity} {incident.type.upper()}."
        why = f"Directly severs freight passage on this strategic artery. Strands vehicles and halts outbound essential supplies."
        who = f"Commercial convoys, fuel tankers, and medical transports bound across {road.state}."
        action = f"Enforce immediate staging at nearest toll plaza; activate alternate bypass corridor and deploy BRO/PWD clearance machinery."

        alert = Alert(
            alert_code=code,
            alert_type="ROAD_CLOSURE",
            severity="CRITICAL",
            title=title,
            what_happened=what,
            why_it_matters=why,
            who_is_affected=who,
            recommended_action=action,
            entity_type="road",
            entity_id=road.id,
            district_id=incident.district_id,
            is_acknowledged=False
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)

        await ws_manager.broadcast("alerts", "ALERT_CREATED", {
            "id": alert.id,
            "alert_code": alert.alert_code,
            "title": alert.title,
            "severity": alert.severity,
            "what_happened": alert.what_happened,
            "created_at": alert.created_at.isoformat()
        })
        return alert

    @staticmethod
    async def trigger_delivery_at_risk_alert(
        db: AsyncSession,
        delivery: Delivery,
        delay_minutes: int,
        reason: str
    ) -> Alert:
        code = f"ALT-DEL-{uuid.uuid4().hex[:6].upper()}"
        title = f"Critical Supply At Risk: {delivery.consignment_code}"
        what = f"Consignment '{delivery.title}' ({delivery.cargo_category}) is AT_RISK with delay of +{delay_minutes} mins."
        why = f"High priority delivery destined for {delivery.destination_name}. Delay threatens essential stock buffer and hospital supply timeline."
        who = f"Receiving facility at {delivery.destination_name}, regional logistics dispatcher."
        action = f"Inspect live alternate corridor recommendations; dispatch police convoy clearance escort or reroute via secondary state highway."

        alert = Alert(
            alert_code=code,
            alert_type="DELIVERY_AT_RISK",
            severity="HIGH" if delivery.priority == "CRITICAL" else "MEDIUM",
            title=title,
            what_happened=what,
            why_it_matters=why,
            who_is_affected=who,
            recommended_action=action,
            entity_type="delivery",
            entity_id=delivery.id,
            is_acknowledged=False
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)

        await ws_manager.broadcast("alerts", "ALERT_CREATED", {
            "id": alert.id,
            "alert_code": alert.alert_code,
            "title": alert.title,
            "severity": alert.severity,
            "what_happened": alert.what_happened,
            "created_at": alert.created_at.isoformat()
        })
        return alert

    @staticmethod
    async def trigger_high_disruption_alert(
        db: AsyncSession,
        road_name: str,
        risk_score: float,
        top_factor: str,
        district_id: Optional[str] = None
    ) -> Alert:
        code = f"ALT-RISK-{uuid.uuid4().hex[:6].upper()}"
        title = f"High Disruption Probability Predicted: {road_name}"
        what = f"AI Disruption Risk Model generated {risk_score:.0f}/100 hazard probability for {road_name} over next 6 hours."
        why = f"High probability of slope instability and vehicle stranding due to {top_factor}."
        who = f"Transport fleet operators and district disaster management teams."
        action = "Halt non-essential heavy transport; advise drivers to hold at staging depots until rainfall subsides."

        alert = Alert(
            alert_code=code,
            alert_type="PREDICTED_DISRUPTION",
            severity="HIGH" if risk_score >= 75 else "MEDIUM",
            title=title,
            what_happened=what,
            why_it_matters=why,
            who_is_affected=who,
            recommended_action=action,
            entity_type="road",
            district_id=district_id,
            is_acknowledged=False
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)

        await ws_manager.broadcast("alerts", "ALERT_CREATED", {
            "id": alert.id,
            "alert_code": alert.alert_code,
            "title": alert.title,
            "severity": alert.severity,
            "what_happened": alert.what_happened,
            "created_at": alert.created_at.isoformat()
        })
        return alert
