from datetime import date
from typing import Dict, List, Optional
from pydantic import BaseModel

class AnalyticsSummary(BaseModel):
    total_study_sessions: int
    total_study_hours: float
    avg_focus_score: float
    best_focus_score: float
    total_distractions: int
    focus_improvement_percentage: float

class DailyAnalytics(BaseModel):
    date: date
    total_sessions: int
    total_duration_minutes: float
    avg_focus_score: float

class WeeklyAnalytics(BaseModel):
    week_start: date
    week_end: date
    total_sessions: int
    total_study_hours: float
    avg_focus_score: float
    daily_breakdown: List[DailyAnalytics]

class FocusTrendPoint(BaseModel):
    date: date
    avg_focus_score: float
    high_focus_minutes: float
    medium_focus_minutes: float
    low_focus_minutes: float

class StudyPattern(BaseModel):
    most_productive_hour: int
    most_productive_day: str
    preferred_source_type: Optional[str] = None
    avg_session_length_minutes: float
    hourly_distribution: Dict[int, float]  # hour (0-23) -> avg score
