import random
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from src.models import Delivery, DeliveryEvent, Vehicle, Alert
from src.schemas import DeliveryCreate, DeliveryUpdate
from src.ws.connection_manager import ws_manager

class DeliveryService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        cargo_category: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Delivery]:
        query = select(Delivery).order_by(desc(Delivery.created_at))
        if status:
            query = query.where(Delivery.status == status)
        if priority:
            query = query.where(Delivery.priority == priority)
        if cargo_category:
            query = query.where(Delivery.cargo_category == cargo_category)
        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, delivery_id: str) -> Optional[Delivery]:
        query = select(Delivery).where(Delivery.id == delivery_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, data: DeliveryCreate) -> Delivery:
        code_num = random.randint(10000, 99999)
        consignment_code = f"NER-DEL-{code_num}"

        delivery = Delivery(
            consignment_code=consignment_code,
            title=data.title,
            cargo_category=data.cargo_category,
            cargo_description=data.cargo_description,
            weight_tons=data.weight_tons,
            priority=data.priority,
            status="PLANNED",
            origin_name=data.origin_name,
            origin_lat=data.origin_lat,
            origin_lng=data.origin_lng,
            destination_name=data.destination_name,
            destination_lat=data.destination_lat,
            destination_lng=data.destination_lng,
            assigned_vehicle_id=data.assigned_vehicle_id,
            planned_departure=data.planned_departure,
            expected_delivery=data.expected_delivery,
            current_eta=data.expected_delivery,
            delay_minutes=0,
            risk_level="LOW"
        )
        db.add(delivery)
        await db.flush()

        event = DeliveryEvent(
            delivery_id=delivery.id,
            event_type="CREATED",
            title="Consignment Manifest Registered",
            description=f"Consignment registered for transit from {data.origin_name} to {data.destination_name} ({data.cargo_category})",
            latitude=data.origin_lat,
            longitude=data.origin_lng
        )
        db.add(event)
        await db.commit()
        await db.refresh(delivery)
        return delivery

    @staticmethod
    async def update(db: AsyncSession, delivery_id: str, data: DeliveryUpdate) -> Optional[Delivery]:
        delivery = await DeliveryService.get_by_id(db, delivery_id)
        if not delivery:
            return None

        update_data = data.model_dump(exclude_unset=True)
        old_status = delivery.status

        for key, value in update_data.items():
            setattr(delivery, key, value)

        delivery.updated_at = datetime.now(timezone.utc)

        # If status changed, record a delivery event
        if "status" in update_data and update_data["status"] != old_status:
            new_status = update_data["status"]
            event_title = f"Status changed to {new_status}"
            event_desc = f"Consignment transitioned from {old_status} to {new_status}."
            if delivery.delay_reason:
                event_desc += f" Reason: {delivery.delay_reason}"

            event = DeliveryEvent(
                delivery_id=delivery.id,
                event_type=f"STATUS_{new_status}",
                title=event_title,
                description=event_desc
            )
            db.add(event)

            # If AT_RISK or severe delay, generate alert
            if new_status in ("AT_RISK", "DELAYED") and delivery.priority in ("CRITICAL", "HIGH"):
                alert = Alert(
                    alert_code=f"ALT-DEL-{uuid.uuid4().hex[:6].upper()}",
                    alert_type="DELIVERY_AT_RISK",
                    severity="HIGH" if delivery.priority == "CRITICAL" else "MEDIUM",
                    title=f"Delivery At Risk: {delivery.title}",
                    what_happened=f"Consignment {delivery.consignment_code} ({delivery.cargo_category}) is {new_status} with delay of {delivery.delay_minutes} mins.",
                    why_it_matters=f"High priority delivery destined for {delivery.destination_name}. Delay threatens essential supply timeline.",
                    who_is_affected=f"Receiving facility at {delivery.destination_name}, carrier fleet dispatcher.",
                    recommended_action="Inspect corridor bottlenecks, activate alternate mountain bypass route, or expedite relief escort.",
                    entity_type="delivery",
                    entity_id=delivery.id,
                    is_acknowledged=False
                )
                db.add(alert)

        await db.commit()
        await db.refresh(delivery)
        return delivery

    @staticmethod
    async def get_events(db: AsyncSession, delivery_id: str) -> List[DeliveryEvent]:
        query = (
            select(DeliveryEvent)
            .where(DeliveryEvent.delivery_id == delivery_id)
            .order_by(desc(DeliveryEvent.created_at))
        )
        result = await db.execute(query)
        return result.scalars().all()
