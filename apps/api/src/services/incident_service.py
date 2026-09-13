import random
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from src.core.cache import fast_cache
from src.models import Incident, Road, RoadSegment, Alert, District, User
from src.schemas import IncidentCreate, IncidentUpdate
from src.ws.connection_manager import ws_manager

class IncidentService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        incident_type: Optional[str] = None,
        district_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Incident]:
        query = select(Incident).order_by(desc(Incident.created_at))

        if status:
            query = query.where(Incident.status == status)
        if severity:
            query = query.where(Incident.severity == severity)
        if incident_type:
            query = query.where(Incident.type == incident_type)
        if district_id:
            query = query.where(Incident.district_id == district_id)

        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        incidents = result.scalars().all()
        return incidents

    @staticmethod
    async def get_by_id(db: AsyncSession, incident_id: str) -> Optional[Incident]:
        query = select(Incident).where(Incident.id == incident_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, data: IncidentCreate, user: Optional[User] = None) -> Incident:
        code_num = f"{random.randint(1000, 9999)}-{uuid.uuid4().hex[:4].upper()}"
        incident_code = f"INC-2026-{code_num}"

        incident = Incident(
            incident_code=incident_code,
            type=data.type,
            severity=data.severity,
            status="OPEN",
            title=data.title,
            description=data.description,
            latitude=data.latitude,
            longitude=data.longitude,
            address=data.address,
            road_id=data.road_id,
            district_id=data.district_id,
            reporter_id=user.id if user else None,
            reporter_name=user.full_name if user else (data.reporter_name or "Field Officer"),
            reporter_role=user.role if user else (data.reporter_role or "FIELD_OFFICER"),
            reporter_contact=data.reporter_contact or (user.phone if user else None),
            estimated_clearance_time=data.estimated_clearance_time,
            affected_traffic_direction=data.affected_traffic_direction or "BOTH",
            photos_json=data.photos_json or [],
            verification_status="VERIFIED" if (user and user.role in ("SUPER_ADMIN", "REGIONAL_ADMIN", "DISTRICT_OFFICER", "FIELD_OFFICER")) else "UNVERIFIED"
        )
        db.add(incident)
        await db.flush()

        # Update Road status and risk if road_id provided
        road_name = "Corridor"
        if data.road_id:
            road_res = await db.execute(select(Road).where(Road.id == data.road_id))
            road = road_res.scalar_one_or_none()
            if road:
                road_name = f"{road.code} ({road.name})"
                if data.severity in ("CRITICAL", "HIGH"):
                    road.accessibility_status = "BLOCKED" if data.severity == "CRITICAL" else "RESTRICTED"
                    road.current_risk_score = min(1.0, road.current_risk_score + 0.4)
                elif data.severity == "MEDIUM":
                    road.accessibility_status = "RESTRICTED"
                    road.current_risk_score = min(1.0, road.current_risk_score + 0.2)

        # Generate Context-Rich Operational Alert
        alert_code = f"ALT-2026-{uuid.uuid4().hex[:6].upper()}"
        what = f"New {data.severity} {data.type.replace('_', ' ').title()} reported: {data.title}"
        why = f"Directly impacts freight flow along {road_name}. Risk of vehicle stranding and multi-hour transit bottlenecks."
        who = f"Commercial convoys, essential supply trucks, and emergency medical shipments traversing this corridor."
        action = "Halt inbound heavy transport; dispatch clearance team; reroute non-emergency cargo via secondary state link."

        alert = Alert(
            alert_code=alert_code,
            alert_type="CRITICAL_INCIDENT" if data.severity in ("CRITICAL", "HIGH") else "ROAD_CLOSURE",
            severity=data.severity,
            title=f"Incident Alert: {data.title}",
            what_happened=what,
            why_it_matters=why,
            who_is_affected=who,
            recommended_action=action,
            entity_type="incident",
            entity_id=incident.id,
            district_id=data.district_id,
            is_acknowledged=False
        )
        db.add(alert)
        await db.commit()
        await db.refresh(incident)

        # Cache values before external calls
        inc_id = incident.id
        inc_code = incident.incident_code
        inc_type = incident.type
        inc_sev = incident.severity
        inc_status = incident.status
        inc_title = incident.title
        inc_lat = incident.latitude
        inc_lng = incident.longitude
        inc_road_id = incident.road_id
        inc_created_at = incident.created_at.isoformat() if incident.created_at else datetime.now(timezone.utc).isoformat()

        # Trigger Dynamic Rerouting Engine if road is blocked or critical
        if data.road_id and data.severity in ("CRITICAL", "HIGH"):
            from src.services.dynamic_rerouting_engine import DynamicReroutingEngine
            try:
                await DynamicReroutingEngine.handle_corridor_disruption(
                    db=db,
                    road_id=data.road_id,
                    incident=incident,
                    reason=f"{data.severity} {data.type.replace('_', ' ').title()}: {data.title}"
                )
            except Exception as e:
                import logging
                logging.getLogger("neroute.incidents").error(f"Error executing dynamic rerouting: {e}")
                await db.rollback()

        # Broadcast via WebSocket
        await ws_manager.broadcast("incidents", "INCIDENT_CREATED", {
            "id": inc_id,
            "incident_code": inc_code,
            "type": inc_type,
            "severity": inc_sev,
            "status": inc_status,
            "title": inc_title,
            "latitude": inc_lat,
            "longitude": inc_lng,
            "road_id": inc_road_id,
            "created_at": inc_created_at
        })

        await ws_manager.broadcast("alerts", "ALERT_CREATED", {
            "id": alert.id,
            "alert_code": alert.alert_code,
            "title": alert.title,
            "severity": alert.severity,
            "what_happened": alert.what_happened,
            "created_at": alert.created_at.isoformat()
        })

        fast_cache.invalidate()
        return incident

    @staticmethod
    async def update(db: AsyncSession, incident_id: str, data: IncidentUpdate) -> Optional[Incident]:
        incident = await IncidentService.get_by_id(db, incident_id)
        if not incident:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(incident, key, value)

        incident.updated_at = datetime.now(timezone.utc)

        # If resolved, reset road status if no other active critical incidents
        if data.status == "RESOLVED" and incident.road_id:
            other_res = await db.execute(
                select(Incident).where(
                    Incident.road_id == incident.road_id,
                    Incident.id != incident.id,
                    Incident.status != "RESOLVED"
                )
            )
            other_active = other_res.scalars().all()
            if not other_active:
                road_res = await db.execute(select(Road).where(Road.id == incident.road_id))
                road = road_res.scalar_one_or_none()
                if road:
                    road.accessibility_status = "ACCESSIBLE"
                    road.current_risk_score = 0.15

        await db.commit()
        await db.refresh(incident)

        await ws_manager.broadcast("incidents", "INCIDENT_UPDATED", {
            "id": incident.id,
            "status": incident.status,
            "severity": incident.severity,
            "updated_at": incident.updated_at.isoformat()
        })

        fast_cache.invalidate()
        return incident
