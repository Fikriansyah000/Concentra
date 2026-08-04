from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsSummary,
    DailyAnalytics,
    FocusTrendPoint,
    StudyPattern,
    WeeklyAnalytics,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil ringkasan statistik fokus dan sesi belajar akumulatif pengguna."""
    return await AnalyticsService.get_summary(db, current_user.id)

@router.get("/weekly", response_model=WeeklyAnalytics)
async def get_weekly_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil statistik analitik mingguan beserta rincian harian (Senin - Minggu)."""
    return await AnalyticsService.get_weekly_analytics(db, current_user.id)

@router.get("/daily", response_model=List[DailyAnalytics])
async def get_daily_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil statistik harian dalam minggu ini."""
    weekly = await AnalyticsService.get_weekly_analytics(db, current_user.id)
    return weekly.daily_breakdown

@router.get("/trends", response_model=List[FocusTrendPoint])
@router.get("/focus-trend", response_model=List[FocusTrendPoint])
async def get_focus_trends(
    days: int = Query(7, ge=1, le=90, description="Jumlah hari tren yang diambil"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil tren grafik tingkat fokus harian beserta pembagian level fokus."""
    return await AnalyticsService.get_focus_trends(db, current_user.id, days=days)

@router.get("/patterns", response_model=StudyPattern)
@router.get("/study-pattern", response_model=StudyPattern)
async def get_study_patterns(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil pola dan kebiasaan belajar (jam & hari paling produktif, tipe materi favorit)."""
    return await AnalyticsService.get_study_pattern(db, current_user.id)
