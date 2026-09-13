from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.dependencies import get_current_user, require_roles
from src.core.exceptions import EntityNotFoundError
from src.models import User, IncidentPhoto
from src.schemas import IncidentCreate, IncidentUpdate, IncidentResponse
from src.services.incident_service import IncidentService
import os
import uuid

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    type: Optional[str] = None,
    district_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    incidents = await IncidentService.get_all(
        db=db,
        status=status,
        severity=severity,
        incident_type=type,
        district_id=district_id,
        limit=limit,
        offset=offset
    )
    return incidents

@router.post("", response_model=IncidentResponse)
async def create_incident(
    data: IncidentCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    incident = await IncidentService.create(db=db, data=data, user=current_user)
    return incident

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    incident = await IncidentService.get_by_id(db, incident_id)
    if not incident:
        raise EntityNotFoundError("Incident", incident_id)
    return incident

@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    data: IncidentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    incident = await IncidentService.update(db, incident_id, data)
    if not incident:
        raise EntityNotFoundError("Incident", incident_id)
    return incident

@router.post("/{incident_id}/photos")
async def upload_photo(
    incident_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = await IncidentService.get_by_id(db, incident_id)
    if not incident:
        raise EntityNotFoundError("Incident", incident_id)

    # 1. MIME validation
    allowed_mimes = {"image/jpeg", "image/png", "image/webp"}
    content_type = file.content_type or "image/jpeg"
    if content_type not in allowed_mimes:
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Allowed formats: JPEG, PNG, WEBP."
        )

    # 2. File size limit: 5MB
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size exceeds maximum allowed limit (5MB)."
        )

    # 3. Safe UUID filename (prevent path traversal)
    ext = ".jpg"
    if "png" in content_type:
        ext = ".png"
    elif "webp" in content_type:
        ext = ".webp"

    upload_dir = "./uploads"
    os.makedirs(upload_dir, exist_ok=True)
    safe_filename = f"inc_{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    photo_url = f"/uploads/{safe_filename}"
    current_photos = list(incident.photos_json or [])
    current_photos.append(photo_url)
    incident.photos_json = current_photos

    photo_rec = IncidentPhoto(
        incident_id=incident.id,
        file_path=photo_url,
        file_name=safe_filename,
        file_size_bytes=len(contents),
        mime_type=content_type
    )
    db.add(photo_rec)
    await db.commit()
    await db.refresh(incident)

    return {"photo_url": photo_url, "incident_id": incident_id, "size_bytes": len(contents)}

