import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    supabase_uid: str
    auth_provider: str = "google"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(UserBase):
    id: uuid.UUID
    supabase_uid: str
    auth_provider: str
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class UserProfileDetail(UserResponse):
    total_sessions: int = 0
    total_study_hours: float = 0.0
