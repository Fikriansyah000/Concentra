import math
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.report import ReportListResponse, ReportResponse
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate/{session_id}", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menghasilkan laporan analitik lengkap untuk sesi belajar yang telah selesai."""
    return await ReportService.generate_report(db, session_id, current_user.id)

@router.get("", response_model=ReportListResponse)
async def list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil daftar laporan analitik milik pengguna."""
    items, total = await ReportService.get_user_reports(
        db, current_user.id, page=page, per_page=per_page
    )
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    return ReportListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )

@router.get("/session/{session_id}", response_model=ReportResponse)
async def get_report_by_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil laporan analitik berdasarkan Session ID."""
    report = await ReportService.get_report_by_session_id(db, session_id, current_user.id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan untuk sesi ini belum dibuat",
        )
    return report

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil rincian laporan analitik berdasarkan Report ID."""
    report = await ReportService.get_report_by_id(db, report_id, current_user.id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan tidak ditemukan",
        )
    return report

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menghapus laporan analitik."""
    success = await ReportService.delete_report(db, report_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan tidak ditemukan",
        )
