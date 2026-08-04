import math
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.session import (
    SessionCreate,
    SessionListResponse,
    SessionResponse,
    SessionUpdate,
)
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["Study Sessions"])

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_in: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Membuat sesi belajar baru (start session)."""
    return await SessionService.create_session(db, current_user.id, session_in)

@router.get("/active", response_model=Optional[SessionResponse])
async def get_active_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil sesi belajar yang sedang aktif/paused."""
    return await SessionService.get_active_session(db, current_user.id)

@router.get("", response_model=SessionListResponse)
async def list_sessions(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter status: active, paused, completed, abandoned"),
    sort_by: str = Query("started_at", description="Sort field: started_at, total_duration_seconds, avg_focus_score"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    from_date: Optional[datetime] = Query(None, description="Filter tanggal awal ISO format"),
    to_date: Optional[datetime] = Query(None, description="Filter tanggal akhir ISO format"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil daftar sesi belajar pengguna dengan pagination dan filter."""
    items, total = await SessionService.get_user_sessions(
        db,
        current_user.id,
        page=page,
        per_page=per_page,
        status_filter=status,
        sort_by=sort_by,
        sort_order=sort_order,
        from_date=from_date,
        to_date=to_date,
    )
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    return SessionListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil rincian sesi belajar berdasarkan ID."""
    session = await SessionService.get_session_by_id(db, session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesi belajar tidak ditemukan",
        )
    return session

@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: uuid.UUID,
    update_in: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Memperbarui status atau data sesi belajar (pause, resume, stop, abandon)."""
    return await SessionService.update_session(db, session_id, current_user.id, update_in)

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menghapus sesi belajar beserta data log dan report terkait."""
    success = await SessionService.delete_session(db, session_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesi belajar tidak ditemukan",
        )
