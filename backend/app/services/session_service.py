import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy import select, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.study_session import StudySession
from app.schemas.session import SessionCreate, SessionUpdate

class SessionService:
    @staticmethod
    async def create_session(
        db: AsyncSession, user_id: uuid.UUID, session_in: SessionCreate
    ) -> StudySession:
        # Check if user already has an active session. If so, auto-stop it or return error
        stmt = select(StudySession).where(
            StudySession.user_id == user_id,
            StudySession.status.in_(["active", "paused"])
        )
        result = await db.execute(stmt)
        active_sessions = result.scalars().all()
        for session in active_sessions:
            session.status = "completed"
            session.ended_at = datetime.now(timezone.utc)
            if session.started_at:
                session.total_duration_seconds = int((session.ended_at - session.started_at).total_seconds())
                if session.active_duration_seconds is None:
                    session.active_duration_seconds = session.total_duration_seconds

        new_session = StudySession(
            user_id=user_id,
            title=session_in.title or "Sesi Belajar Tanpa Judul",
            source_url=session_in.source_url,
            source_type=session_in.source_type,
            status="active",
            started_at=datetime.now(timezone.utc),
            pause_count=0
        )
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        return new_session

    @staticmethod
    async def get_session_by_id(
        db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[StudySession]:
        stmt = select(StudySession).where(
            StudySession.id == session_id,
            StudySession.user_id == user_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_active_session(
        db: AsyncSession, user_id: uuid.UUID
    ) -> Optional[StudySession]:
        stmt = select(StudySession).where(
            StudySession.user_id == user_id,
            StudySession.status.in_(["active", "paused"])
        ).order_by(desc(StudySession.started_at))
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def get_user_sessions(
        db: AsyncSession,
        user_id: uuid.UUID,
        page: int = 1,
        per_page: int = 10,
        status_filter: Optional[str] = None,
        sort_by: str = "started_at",
        sort_order: str = "desc",
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None
    ) -> Tuple[List[StudySession], int]:
        query = select(StudySession).where(StudySession.user_id == user_id)

        if status_filter:
            query = query.where(StudySession.status == status_filter)
        if from_date:
            query = query.where(StudySession.started_at >= from_date)
        if to_date:
            query = query.where(StudySession.started_at <= to_date)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # Sorting
        sort_column = getattr(StudySession, sort_by, StudySession.started_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        # Pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        result = await db.execute(query)
        sessions = list(result.scalars().all())
        return sessions, total

    @staticmethod
    async def update_session(
        db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID, update_in: SessionUpdate
    ) -> StudySession:
        session = await SessionService.get_session_by_id(db, session_id, user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesi belajar tidak ditemukan"
            )

        now = datetime.now(timezone.utc)

        if update_in.title is not None:
            session.title = update_in.title

        if update_in.action:
            if update_in.action == "pause" and session.status == "active":
                session.status = "paused"
                session.paused_at = now
                session.pause_count += 1
            elif update_in.action == "resume" and session.status == "paused":
                session.status = "active"
                session.paused_at = None
            elif update_in.action in ["stop", "abandon"]:
                session.status = "completed" if update_in.action == "stop" else "abandoned"
                session.ended_at = now
                if session.started_at:
                    session.total_duration_seconds = int((now - session.started_at).total_seconds())
                    # If active_duration was never tracked, default to total
                    if session.active_duration_seconds is None:
                        session.active_duration_seconds = session.total_duration_seconds

        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def delete_session(
        db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        session = await SessionService.get_session_by_id(db, session_id, user_id)
        if not session:
            return False

        await db.delete(session)
        await db.commit()
        return True
