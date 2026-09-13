"""
Offline Field Sync & Idempotency Router for SETU-ROUTE.
Processes batched and individual field reports with idempotency keys,
photo binary saving, and conflict resolution.
"""

import os
import uuid
import base64
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.core.config import settings
from src.schemas import SyncBatchRequest, SyncBatchResponse, IncidentCreate, VehicleLocationUpdate
from src.services.incident_service import IncidentService
from src.services.vehicle_service import VehicleService
from src.models import SyncQueue, Incident, AuditLog

router = APIRouter(prefix="/sync", tags=["Offline Field Sync"])

class SingleSyncUpload(BaseModel):
    client_id: str = "field-pwa-client"
    idempotency_key: str
    type: str
    severity: str
    title: str
    description: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    road_id: Optional[str] = None
    district_id: str
    reporter_name: str
    reporter_role: str
    reporter_contact: Optional[str] = None
    photo_base64: Optional[str] = None
    photo_name: Optional[str] = None
    recorded_at: Optional[str] = None

@router.post("/upload")
async def sync_single_report(
    payload: SingleSyncUpload,
    db: AsyncSession = Depends(get_db)
):
    """
    Idempotent single report sync endpoint. Deduplicates by idempotency_key.
    """
    # 1. Check idempotency queue to prevent duplicate processing
    existing_sync = await db.execute(
        select(SyncQueue).where(
            SyncQueue.client_id == payload.idempotency_key,
            SyncQueue.sync_status == "SYNCED"
        )
    )
    if existing_sync.scalar_one_or_none():
        return {
            "status": "ALREADY_SYNCED",
            "idempotency_key": payload.idempotency_key,
            "message": "Report was previously received and acknowledged."
        }

    # 2. Save photo if provided in base64
    photo_urls = []
    if payload.photo_base64:
        try:
            # Strip data:image/...;base64, prefix if present
            raw_b64 = payload.photo_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",")[1]

            img_bytes = base64.b64decode(raw_b64)
            # Limit size to 5MB
            if len(img_bytes) <= 5 * 1024 * 1024:
                file_uuid = str(uuid.uuid4())
                safe_name = f"sync_{file_uuid}.jpg"
                save_path = os.path.join(settings.UPLOAD_DIR, safe_name)
                os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
                with open(save_path, "wb") as f:
                    f.write(img_bytes)
                photo_urls.append(f"/uploads/{safe_name}")
        except Exception as e:
            print(f"[!] Warning: Failed to decode sync photo: {e}")

    # 3. Create Incident Record
    inc_data = IncidentCreate(
        type=payload.type,
        severity=payload.severity,
        title=payload.title,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        road_id=payload.road_id,
        district_id=payload.district_id,
        reporter_name=payload.reporter_name,
        reporter_role=payload.reporter_role,
        reporter_contact=payload.reporter_contact,
        photos_json=photo_urls
    )

    incident = await IncidentService.create(db, inc_data)

    # 4. Record in SyncQueue for audit & deduplication
    sync_entry = SyncQueue(
        client_id=payload.idempotency_key,
        entity_type="incident",
        action="CREATE",
        payload_json={"incident_id": incident.id, "title": incident.title},
        sync_status="SYNCED"
    )
    db.add(sync_entry)
    await db.commit()

    return {
        "status": "SYNCED",
        "idempotency_key": payload.idempotency_key,
        "server_id": incident.id,
        "incident_code": incident.incident_code,
        "created_at": incident.created_at.isoformat()
    }

@router.post("/batch", response_model=SyncBatchResponse)
async def process_sync_batch(
    batch: SyncBatchRequest,
    db: AsyncSession = Depends(get_db)
):
    results = []
    processed = 0
    failed = 0

    for item in batch.items:
        try:
            if item.entity_type == "incident" and item.action == "CREATE":
                inc_data = IncidentCreate(**item.payload)
                inc = await IncidentService.create(db, inc_data)
                results.append({
                    "client_id": item.client_id,
                    "status": "SUCCESS",
                    "server_id": inc.id,
                    "incident_code": inc.incident_code
                })
                processed += 1
            elif item.entity_type == "vehicle_location" and item.action == "CREATE":
                veh_id = item.payload.get("vehicle_id")
                loc_data = VehicleLocationUpdate(**item.payload)
                await VehicleService.update_location(db, veh_id, loc_data)
                results.append({
                    "client_id": item.client_id,
                    "status": "SUCCESS"
                })
                processed += 1
            else:
                results.append({
                    "client_id": item.client_id,
                    "status": "IGNORED",
                    "reason": f"Unknown entity_type '{item.entity_type}'"
                })
        except Exception as e:
            failed += 1
            results.append({
                "client_id": item.client_id,
                "status": "FAILED",
                "error": str(e)
            })

    return {
        "processed_count": processed,
        "failed_count": failed,
        "results": results
    }

@router.get("/status")
async def get_sync_queue_status(db: AsyncSession = Depends(get_db)):
    """
    Returns counts of pending and processed sync queue items.
    """
    res = await db.execute(select(SyncQueue))
    items = res.scalars().all()
    return {
        "total_synced_items": len(items),
        "recent_syncs": [
            {
                "id": it.id,
                "client_id": it.client_id,
                "entity_type": it.entity_type,
                "sync_status": it.sync_status,
                "created_at": it.created_at.isoformat()
            } for it in items[-10:]
        ]
    }
