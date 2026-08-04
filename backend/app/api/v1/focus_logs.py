import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.focus_log import (
    FocusLogBatchCreate,
    FocusLogBatchResponse,
    FocusLogResponse,
    TimelineResponse,
)
from app.services.focus_log_service import FocusLogService

router = APIRouter(prefix="/focus-logs", tags=["Focus Logs"])

@router.post("/batch", response_model=FocusLogBatchResponse, status_code=status.HTTP_201_CREATED)
async def batch_insert_focus_logs(
    batch_in: FocusLogBatchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Batch insert data log fokus real-time dari Chrome Extension."""
    return await FocusLogService.create_batch_logs(db, current_user.id, batch_in)

@router.get("/session/{session_id}", response_model=List[FocusLogResponse])
async def get_session_focus_logs(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil seluruh log fokus mentah dari suatu sesi belajar."""
    return await FocusLogService.get_logs_for_session(db, session_id, current_user.id)

@router.get("/session/{session_id}/timeline", response_model=TimelineResponse)
async def get_session_timeline(
    session_id: uuid.UUID,
    interval: str = Query("1m", description="Interval aggregasi: 10s, 30s, 1m, 5m"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil data agregasi timeline tingkat fokus per interval waktu."""
    return await FocusLogService.get_timeline(db, session_id, current_user.id, interval=interval)

@router.get("/latest", response_model=FocusLogResponse)
async def get_latest_focus_log(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil data log fokus paling baru (terakhir direkam) untuk real-time monitoring."""
    log = await FocusLogService.get_latest_focus_log(db, current_user.id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Belum ada data focus log yang terekam",
        )
    return log

