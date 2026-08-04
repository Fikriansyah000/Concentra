import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Float, ForeignKey, Integer, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class StudySession(Base):
    __tablename__ = "study_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False, index=True
    )  # 'active', 'paused', 'completed', 'abandoned'
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    source_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'google_meet', 'youtube', 'coursera', 'zoom', 'lms', 'other'

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    paused_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    total_duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    active_duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pause_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    avg_focus_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_focus_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_focus_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="study_sessions")
    focus_logs: Mapped[List["FocusLog"]] = relationship(
        "FocusLog", back_populates="session", cascade="all, delete-orphan"
    )
    report: Mapped[Optional["Report"]] = relationship(
        "Report", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )
