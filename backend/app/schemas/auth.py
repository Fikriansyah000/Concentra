from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.user import UserResponse

class SyncUserRequest(BaseModel):
    supabase_uid: str
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None

class SyncUserResponse(UserResponse):
    is_new_user: bool = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class HealthCheckResponse(BaseModel):
    status: str = "ok"
    app_name: str
    environment: str
