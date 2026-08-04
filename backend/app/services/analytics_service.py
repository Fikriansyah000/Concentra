import uuid
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict
from sqlalchemy import select, func, desc, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.study_session import StudySession
from app.models.report import Report
from app.models.focus_log import FocusLog
from app.schemas.analytics import (
    AnalyticsSummary,
    DailyAnalytics,
    WeeklyAnalytics,
    FocusTrendPoint,
    StudyPattern,
)

class AnalyticsService:
    @staticmethod
    async def get_summary(db: AsyncSession, user_id: uuid.UUID) -> AnalyticsSummary:
        # Total sessions & hours
        sess_stmt = select(
            func.count(StudySession.id),
            func.coalesce(func.sum(StudySession.total_duration_seconds), 0),
            func.coalesce(func.avg(StudySession.avg_focus_score), 0.0),
            func.coalesce(func.max(StudySession.max_focus_score), 0.0)
        ).where(StudySession.user_id == user_id, StudySession.status == "completed")

        res = await db.execute(sess_stmt)
        total_sessions, total_seconds, avg_score, best_score = res.fetchone() or (0, 0, 0.0, 0.0)

        # Distractions sum from reports
        dist_stmt = select(
            func.coalesce(func.sum(Report.total_distractions), 0)
        ).where(Report.user_id == user_id)
        dist_res = await db.execute(dist_stmt)
        total_distractions = dist_res.scalar_one()

        # Improvement calculation (this week vs last week avg)
        now = datetime.now(timezone.utc)
        this_week_start = now - timedelta(days=7)
        last_week_start = now - timedelta(days=14)

        tw_stmt = select(func.avg(StudySession.avg_focus_score)).where(
            StudySession.user_id == user_id,
            StudySession.started_at >= this_week_start
        )
        lw_stmt = select(func.avg(StudySession.avg_focus_score)).where(
            StudySession.user_id == user_id,
            StudySession.started_at >= last_week_start,
            StudySession.started_at < this_week_start
        )

        tw_avg = (await db.execute(tw_stmt)).scalar_one() or 0.0
        lw_avg = (await db.execute(lw_stmt)).scalar_one() or 0.0

        improvement = round(tw_avg - lw_avg, 2) if lw_avg > 0 else 0.0

        return AnalyticsSummary(
            total_study_sessions=total_sessions,
            total_study_hours=round(total_seconds / 3600.0, 2),
            avg_focus_score=round(avg_score, 2),
            best_focus_score=round(best_score, 2),
            total_distractions=total_distractions,
            focus_improvement_percentage=improvement
        )

    @staticmethod
    async def get_weekly_analytics(db: AsyncSession, user_id: uuid.UUID) -> WeeklyAnalytics:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())  # Monday
        week_end = week_start + timedelta(days=6)

        start_dt = datetime.combine(week_start, datetime.min.time(), tzinfo=timezone.utc)
        end_dt = datetime.combine(week_end, datetime.max.time(), tzinfo=timezone.utc)

        stmt = select(StudySession).where(
            StudySession.user_id == user_id,
            StudySession.started_at >= start_dt,
            StudySession.started_at <= end_dt
        )
        res = await db.execute(stmt)
        sessions = list(res.scalars().all())

        daily_map: Dict[date, List[StudySession]] = {
            week_start + timedelta(days=i): [] for i in range(7)
        }

        for s in sessions:
            s_date = s.started_at.date()
            if s_date in daily_map:
                daily_map[s_date].append(s)

        daily_breakdown: List[DailyAnalytics] = []
        total_seconds = 0

        for d_date in sorted(daily_map.keys()):
            d_sessions = daily_map[d_date]
            d_count = len(d_sessions)
            d_sec = sum(s.total_duration_seconds or 0 for s in d_sessions)
            total_seconds += d_sec

            d_scores = [s.avg_focus_score for s in d_sessions if s.avg_focus_score is not None]
            d_avg = round(sum(d_scores) / len(d_scores), 2) if d_scores else 0.0

            daily_breakdown.append(
                DailyAnalytics(
                    date=d_date,
                    total_sessions=d_count,
                    total_duration_minutes=round(d_sec / 60.0, 1),
                    avg_focus_score=d_avg
                )
            )

        all_scores = [s.avg_focus_score for s in sessions if s.avg_focus_score is not None]
        weekly_avg = round(sum(all_scores) / len(all_scores), 2) if all_scores else 0.0

        return WeeklyAnalytics(
            week_start=week_start,
            week_end=week_end,
            total_sessions=len(sessions),
            total_study_hours=round(total_seconds / 3600.0, 2),
            avg_focus_score=weekly_avg,
            daily_breakdown=daily_breakdown
        )

    @staticmethod
    async def get_focus_trends(
        db: AsyncSession, user_id: uuid.UUID, days: int = 7
    ) -> List[FocusTrendPoint]:
        start_date = date.today() - timedelta(days=days - 1)
        start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)

        stmt = select(FocusLog).where(
            FocusLog.user_id == user_id,
            FocusLog.recorded_at >= start_dt
        )
        res = await db.execute(stmt)
        logs = list(res.scalars().all())

        daily_logs: Dict[date, List[FocusLog]] = {
            start_date + timedelta(days=i): [] for i in range(days)
        }

        for l in logs:
            l_date = l.recorded_at.date()
            if l_date in daily_logs:
                daily_logs[l_date].append(l)

        trend_points: List[FocusTrendPoint] = []
        for d_date in sorted(daily_logs.keys()):
            d_list = daily_logs[d_date]
            if not d_list:
                trend_points.append(
                    FocusTrendPoint(
                        date=d_date,
                        avg_focus_score=0.0,
                        high_focus_minutes=0.0,
                        medium_focus_minutes=0.0,
                        low_focus_minutes=0.0
                    )
                )
                continue

            scores = [l.focus_score for l in d_list]
            avg_score = round(sum(scores) / len(scores), 2)

            high_count = sum(1 for l in d_list if l.focus_level == "high")
            medium_count = sum(1 for l in d_list if l.focus_level == "medium")
            low_count = sum(1 for l in d_list if l.focus_level in ["low", "critical"])

            # Each log is assumed ~2 seconds
            trend_points.append(
                FocusTrendPoint(
                    date=d_date,
                    avg_focus_score=avg_score,
                    high_focus_minutes=round((high_count * 2) / 60.0, 1),
                    medium_focus_minutes=round((medium_count * 2) / 60.0, 1),
                    low_focus_minutes=round((low_count * 2) / 60.0, 1)
                )
            )

        return trend_points

    @staticmethod
    async def get_study_pattern(db: AsyncSession, user_id: uuid.UUID) -> StudyPattern:
        stmt = select(FocusLog).where(FocusLog.user_id == user_id)
        res = await db.execute(stmt)
        logs = list(res.scalars().all())

        hourly_scores: Dict[int, List[float]] = {h: [] for h in range(24)}
        day_scores: Dict[str, List[float]] = {
            "Monday": [], "Tuesday": [], "Wednesday": [],
            "Thursday": [], "Friday": [], "Saturday": [], "Sunday": []
        }

        for l in logs:
            h = l.recorded_at.hour
            d_name = l.recorded_at.strftime("%A")
            hourly_scores[h].append(l.focus_score)
            if d_name in day_scores:
                day_scores[d_name].append(l.focus_score)

        hourly_dist: Dict[int, float] = {}
        best_hour = 9
        best_hour_score = -1.0

        for h, scores in hourly_scores.items():
            if scores:
                avg = sum(scores) / len(scores)
                hourly_dist[h] = round(avg, 2)
                if avg > best_hour_score:
                    best_hour_score = avg
                    best_hour = h
            else:
                hourly_dist[h] = 0.0

        best_day = "Monday"
        best_day_score = -1.0
        for d_name, scores in day_scores.items():
            if scores:
                avg = sum(scores) / len(scores)
                if avg > best_day_score:
                    best_day_score = avg
                    best_day = d_name

        # Preferred source type
        src_stmt = select(StudySession.source_type, func.count(StudySession.id))\
            .where(StudySession.user_id == user_id)\
            .group_by(StudySession.source_type)\
            .order_by(desc(func.count(StudySession.id)))

        src_res = await db.execute(src_stmt)
        top_src = src_res.first()
        pref_source = top_src[0] if top_src else "youtube"

        # Avg session length
        len_stmt = select(func.avg(StudySession.total_duration_seconds)).where(
            StudySession.user_id == user_id, StudySession.total_duration_seconds.is_not(None)
        )
        avg_len_sec = (await db.execute(len_stmt)).scalar_one() or 0.0

        return StudyPattern(
            most_productive_hour=best_hour,
            most_productive_day=best_day,
            preferred_source_type=pref_source,
            avg_session_length_minutes=round(avg_len_sec / 60.0, 1),
            hourly_distribution=hourly_dist
        )
