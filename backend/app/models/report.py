import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import Float, ForeignKey, Integer, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study_sessions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    total_duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    active_duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)

    avg_focus_score: Mapped[float] = mapped_column(Float, nullable=False)
    median_focus_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_focus_score: Mapped[float] = mapped_column(Float, nullable=False)
    min_focus_score: Mapped[float] = mapped_column(Float, nullable=False)

    total_distractions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_face_missing_events: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    longest_focus_streak_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    longest_distraction_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    focus_time_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    focus_timeline: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, default=list, nullable=False)
    focus_distribution: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    head_direction_summary: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    summary_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendations: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)

    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    session: Mapped["StudySession"] = relationship("StudySession", back_populates="report")
    user: Mapped["User"] = relationship("User", back_populates="reports")
