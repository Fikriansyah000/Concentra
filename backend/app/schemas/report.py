import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict

class ReportResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    user_id: uuid.UUID
    total_duration_seconds: int
    active_duration_seconds: int
    avg_focus_score: float
    median_focus_score: Optional[float] = None
    max_focus_score: float
    min_focus_score: float
    total_distractions: int
    total_face_missing_events: int
    longest_focus_streak_seconds: Optional[int] = None
    longest_distraction_seconds: Optional[int] = None
    focus_time_percentage: Optional[float] = None
    focus_timeline: List[Dict[str, Any]] = []
    focus_distribution: Optional[Dict[str, float]] = None
    head_direction_summary: Optional[Dict[str, float]] = None
    summary_text: Optional[str] = None
    recommendations: Optional[List[str]] = None
    generated_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
