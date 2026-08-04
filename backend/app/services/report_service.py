import statistics
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.focus_log import FocusLog
from app.models.report import Report
from app.models.study_session import StudySession
from app.services.focus_log_service import FocusLogService

class ReportService:
    @staticmethod
    async def generate_report(
        db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> Report:
        # Check session
        session_stmt = select(StudySession).where(
            StudySession.id == session_id,
            StudySession.user_id == user_id
        )
        res = await db.execute(session_stmt)
        session = res.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesi belajar tidak ditemukan"
            )

        logs = await FocusLogService.get_logs_for_session(db, session_id, user_id)
        if not logs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tidak ada focus log untuk sesi ini"
            )

        # Durations
        start_time = session.started_at
        end_time = session.ended_at or logs[-1].recorded_at
        total_duration = int((end_time - start_time).total_seconds()) if end_time else 0
        if total_duration <= 0:
            total_duration = len(logs)  # fallback 1 second per log

        active_duration = session.active_duration_seconds or total_duration

        # Scores
        scores = [l.focus_score for l in logs]
        avg_score = round(sum(scores) / len(scores), 2)
        median_score = round(statistics.median(scores), 2) if scores else 0.0
        max_score = round(max(scores), 2)
        min_score = round(min(scores), 2)

        # Distractions & face missing
        distractions = sum(1 for l in logs if l.is_distracted)
        face_missing_events = sum(1 for l in logs if not l.face_detected)

        # Streaks (assuming logs ~1-3s apart)
        current_streak = 0
        max_streak = 0
        current_distraction_streak = 0
        max_distraction_streak = 0

        for l in logs:
            if l.focus_level in ["high", "medium"] and not l.is_distracted:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
                current_distraction_streak = 0
            else:
                current_distraction_streak += 1
                max_distraction_streak = max(max_distraction_streak, current_distraction_streak)
                current_streak = 0

        # High/Medium focus time percentage
        focused_logs_count = sum(1 for l in logs if l.focus_level in ["high", "medium"])
        focus_time_percentage = round((focused_logs_count / len(logs)) * 100.0, 2)

        # Distribution
        levels = [l.focus_level for l in logs]
        total_logs = len(logs)
        focus_distribution = {
            "high": round((levels.count("high") / total_logs) * 100.0, 2),
            "medium": round((levels.count("medium") / total_logs) * 100.0, 2),
            "low": round((levels.count("low") / total_logs) * 100.0, 2),
            "critical": round((levels.count("critical") / total_logs) * 100.0, 2),
        }

        # Head direction summary
        directions = [l.head_direction for l in logs if l.head_direction]
        dir_count = len(directions) or 1
        head_direction_summary = {
            "front": round((directions.count("front") / dir_count) * 100.0, 2),
            "left": round((directions.count("left") / dir_count) * 100.0, 2),
            "right": round((directions.count("right") / dir_count) * 100.0, 2),
            "down": round((directions.count("down") / dir_count) * 100.0, 2),
            "up": round((directions.count("up") / dir_count) * 100.0, 2),
        }

        # Timeline aggregate for report UI
        timeline_res = await FocusLogService.get_timeline(db, session_id, user_id, interval="1m")
        focus_timeline = [t.model_dump(mode="json") for t in timeline_res.data]

        # Summary & Recommendations generator
        summary_text = (
            f"Sesi belajar '{session.title or 'Tanpa Judul'}' berlangsung selama {total_duration // 60} menit. "
            f"Rata-rata tingkat fokus Anda adalah {avg_score}/100. "
            f"Anda berada dalam kondisi fokus tinggi/sedang sebanyak {focus_time_percentage}% dari total waktu."
        )

        recommendations = []
        if avg_score < 60:
            recommendations.append("Cobalah teknik Pomodoro (25 menit belajar, 5 menit istirahat) untuk menjaga konsentrasi.")
        if distractions > 5:
            recommendations.append("Matikan notifikasi HP dan amankan lingkungan dari gangguan visual selama belajar.")
        if head_direction_summary.get("down", 0) > 20:
            recommendations.append("Posisikan layar sejajar dengan mata untuk mengurangi postur menunduk berlebih.")
        if not recommendations:
            recommendations.append("Pertahankan performa belajar yang luar biasa ini!")

        # Check existing report
        existing_stmt = select(Report).where(Report.session_id == session_id)
        exist_res = await db.execute(existing_stmt)
        report = exist_res.scalar_one_or_none()

        if not report:
            report = Report(
                session_id=session_id,
                user_id=user_id,
                total_duration_seconds=total_duration,
                active_duration_seconds=active_duration,
                avg_focus_score=avg_score,
                median_focus_score=median_score,
                max_focus_score=max_score,
                min_focus_score=min_score,
                total_distractions=distractions,
                total_face_missing_events=face_missing_events,
                longest_focus_streak_seconds=max_streak * 2,  # approx seconds
                longest_distraction_seconds=max_distraction_streak * 2,
                focus_time_percentage=focus_time_percentage,
                focus_timeline=focus_timeline,
                focus_distribution=focus_distribution,
                head_direction_summary=head_direction_summary,
                summary_text=summary_text,
                recommendations=recommendations,
                generated_at=datetime.now(timezone.utc)
            )
            db.add(report)
        else:
            report.total_duration_seconds = total_duration
            report.active_duration_seconds = active_duration
            report.avg_focus_score = avg_score
            report.median_focus_score = median_score
            report.max_focus_score = max_score
            report.min_focus_score = min_score
            report.total_distractions = distractions
            report.total_face_missing_events = face_missing_events
            report.longest_focus_streak_seconds = max_streak * 2
            report.longest_distraction_seconds = max_distraction_streak * 2
            report.focus_time_percentage = focus_time_percentage
            report.focus_timeline = focus_timeline
            report.focus_distribution = focus_distribution
            report.head_direction_summary = head_direction_summary
            report.summary_text = summary_text
            report.recommendations = recommendations
            report.generated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(report)
        return report

    @staticmethod
    async def get_report_by_id(
        db: AsyncSession, report_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Report]:
        stmt = select(Report).where(
            Report.id == report_id,
            Report.user_id == user_id
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def get_report_by_session_id(
        db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Report]:
        stmt = select(Report).where(
            Report.session_id == session_id,
            Report.user_id == user_id
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def get_user_reports(
        db: AsyncSession, user_id: uuid.UUID, page: int = 1, per_page: int = 10
    ) -> Tuple[List[Report], int]:
        query = select(Report).where(Report.user_id == user_id)

        count_query = select(func.count()).select_from(query.subquery())
        total_res = await db.execute(count_query)
        total = total_res.scalar_one()

        offset = (page - 1) * per_page
        query = query.order_by(desc(Report.generated_at)).offset(offset).limit(per_page)

        res = await db.execute(query)
        return list(res.scalars().all()), total

    @staticmethod
    async def delete_report(
        db: AsyncSession, report_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        report = await ReportService.get_report_by_id(db, report_id, user_id)
        if not report:
            return False

        await db.delete(report)
        await db.commit()
        return True
