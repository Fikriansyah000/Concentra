import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class FocusLog(Base):
    __tablename__ = "focus_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    focus_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 to 100.0
    face_detected: Mapped[bool] = mapped_column(Boolean, nullable=False)
    face_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    head_yaw: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    head_pitch: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    head_roll: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    head_direction: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # 'front', 'left', 'right', 'down', 'up'

    focus_level: Mapped[str] = mapped_column(String(10), nullable=False)  # 'high', 'medium', 'low', 'critical'
    is_distracted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    face_missing_duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    raw_landmarks: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    session: Mapped["StudySession"] = relationship("StudySession", back_populates="focus_logs")
    user: Mapped["User"] = relationship("User", back_populates="focus_logs")
