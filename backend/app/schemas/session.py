import uuid
from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict

class SessionCreate(BaseModel):
    title: Optional[str] = None
    source_url: Optional[str] = None
    source_type: Optional[Literal["google_meet", "youtube", "coursera", "zoom", "lms", "other"]] = "other"

class SessionUpdate(BaseModel):
    action: Optional[Literal["pause", "resume", "stop", "abandon"]] = None
    title: Optional[str] = None

class SessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    title: Optional[str] = None
    source_url: Optional[str] = None
    source_type: Optional[str] = None
    started_at: datetime
    paused_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    total_duration_seconds: Optional[int] = None
    active_duration_seconds: Optional[int] = None
    pause_count: int = 0
    avg_focus_score: Optional[float] = None
    min_focus_score: Optional[float] = None
    max_focus_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SessionListResponse(BaseModel):
    items: List[SessionResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
