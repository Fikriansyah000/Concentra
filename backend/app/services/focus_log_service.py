import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select, func, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.focus_log import FocusLog
from app.models.study_session import StudySession
from app.schemas.focus_log import FocusLogBatchCreate, FocusLogBatchResponse, TimelinePoint, TimelineResponse

class FocusLogService:
    @staticmethod
    async def create_batch_logs(
        db: AsyncSession, user_id: uuid.UUID, batch_in: FocusLogBatchCreate
    ) -> FocusLogBatchResponse:
        # Verify session belongs to user
        session_stmt = select(StudySession).where(
            StudySession.id == batch_in.session_id,
            StudySession.user_id == user_id
        )
        result = await db.execute(session_stmt)
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesi belajar tidak ditemukan"
            )

        new_logs = []
        scores = []
        for log_data in batch_in.logs:
            log_dict = log_data.model_dump()
            log_obj = FocusLog(
                session_id=batch_in.session_id,
                user_id=user_id,
                **log_dict
            )
            new_logs.append(log_obj)
            scores.append(log_data.focus_score)

        if new_logs:
            db.add_all(new_logs)

            # Update session focus stats dynamically
            scores_query = select(
                func.avg(FocusLog.focus_score),
                func.min(FocusLog.focus_score),
                func.max(FocusLog.focus_score)
            ).where(FocusLog.session_id == batch_in.session_id)
            
            # Execute after adding current batch
            await db.flush()
            stats_res = await db.execute(scores_query)
            avg_s, min_s, max_s = stats_res.fetchone() or (None, None, None)

            session.avg_focus_score = round(avg_s, 2) if avg_s is not None else None
            session.min_focus_score = round(min_s, 2) if min_s is not None else None
            session.max_focus_score = round(max_s, 2) if max_s is not None else None

            await db.commit()

        latest_score = scores[-1] if scores else None
        return FocusLogBatchResponse(
            inserted_count=len(new_logs),
            session_id=batch_in.session_id,
            latest_score=latest_score
        )

    @staticmethod
    async def get_logs_for_session(
        db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> List[FocusLog]:
        stmt = select(FocusLog).where(
            FocusLog.session_id == session_id,
            FocusLog.user_id == user_id
        ).order_by(asc(FocusLog.recorded_at))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_timeline(
        db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID, interval: str = "1m"
    ) -> TimelineResponse:
        logs = await FocusLogService.get_logs_for_session(db, session_id, user_id)
        if not logs:
            return TimelineResponse(session_id=session_id, interval=interval, data=[])

        # Convert interval string to seconds
        interval_seconds = 60
        if interval == "10s":
            interval_seconds = 10
        elif interval == "30s":
            interval_seconds = 30
        elif interval == "1m":
            interval_seconds = 60
        elif interval == "5m":
            interval_seconds = 300

        # Group logs by bucket
        buckets: Dict[datetime, List[FocusLog]] = {}
        start_time = logs[0].recorded_at

        for log in logs:
            elapsed_sec = int((log.recorded_at - start_time).total_seconds())
            bucket_idx = elapsed_sec // interval_seconds
            bucket_time = start_time + timedelta(seconds=bucket_idx * interval_seconds)

            if bucket_time not in buckets:
                buckets[bucket_time] = []
            buckets[bucket_time].append(log)

        points: List[TimelinePoint] = []
        for b_time in sorted(buckets.keys()):
            b_logs = buckets[b_time]
            scores = [l.focus_score for l in b_logs]
            face_detected_count = sum(1 for l in b_logs if l.face_detected)
            distractions = sum(1 for l in b_logs if l.is_distracted)

            # Dominant head direction
            dirs = [l.head_direction for l in b_logs if l.head_direction]
            dominant_dir = max(set(dirs), key=dirs.count) if dirs else "front"

            points.append(
                TimelinePoint(
                    timestamp=b_time,
                    avg_score=round(sum(scores) / len(scores), 2),
                    min_score=round(min(scores), 2),
                    max_score=round(max(scores), 2),
                    face_detected_ratio=round(face_detected_count / len(b_logs), 2),
                    distraction_count=distractions,
                    dominant_direction=dominant_dir
                )
            )

        return TimelineResponse(session_id=session_id, interval=interval, data=points)

    @staticmethod
    async def get_latest_focus_log(
        db: AsyncSession, user_id: uuid.UUID
    ) -> Optional[FocusLog]:
        stmt = select(FocusLog).where(
            FocusLog.user_id == user_id
        ).order_by(desc(FocusLog.recorded_at))
        result = await db.execute(stmt)
        return result.scalars().first()

