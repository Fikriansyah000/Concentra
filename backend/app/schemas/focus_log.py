import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

class FocusLogCreate(BaseModel):
    focus_score: float = Field(..., ge=0.0, le=100.0)
    face_detected: bool
    face_count: int = 0
    head_yaw: Optional[float] = None
    head_pitch: Optional[float] = None
    head_roll: Optional[float] = None
    head_direction: Optional[Literal["front", "left", "right", "down", "up"]] = "front"
    focus_level: Literal["high", "medium", "low", "critical"]
    is_distracted: bool = False
    face_missing_duration_ms: int = 0
    raw_landmarks: Optional[Dict[str, Any]] = None
    recorded_at: datetime

class FocusLogBatchCreate(BaseModel):
    session_id: uuid.UUID
    logs: List[FocusLogCreate]

class FocusLogResponse(FocusLogCreate):
    id: uuid.UUID
    session_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FocusLogBatchResponse(BaseModel):
    inserted_count: int
    session_id: uuid.UUID
    latest_score: Optional[float] = None

class TimelinePoint(BaseModel):
    timestamp: datetime
    avg_score: float
    min_score: float
    max_score: float
    face_detected_ratio: float
    distraction_count: int
    dominant_direction: Optional[str] = "front"

class TimelineResponse(BaseModel):
    session_id: uuid.UUID
    interval: str
    data: List[TimelinePoint]
