from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.security import create_local_access_token
from app.models.study_session import StudySession
from app.models.user import User
from app.schemas.auth import HealthCheckResponse, SyncUserRequest, SyncUserResponse, TokenResponse
from app.schemas.user import UserProfileDetail, UserResponse, UserUpdate

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Unauthenticated health check endpoint."""
    return HealthCheckResponse(
        status="ok",
        app_name=settings.APP_NAME,
        environment=settings.APP_ENV
    )

@router.post("/sync-user", response_model=SyncUserResponse)
async def sync_user(
    body: SyncUserRequest,
    db: AsyncSession = Depends(get_db)
):
    """Synchronize user profile from Supabase Auth after Google login."""
    stmt = select(User).where(User.supabase_uid == body.supabase_uid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    is_new = False
    now = datetime.utcnow()

    if not user:
        # Create new user
        is_new = True
        user = User(
            supabase_uid=body.supabase_uid,
            email=body.email,
            full_name=body.full_name,
            avatar_url=body.avatar_url,
            auth_provider="google",
            last_login_at=now
        )
        db.add(user)
    else:
        # Update existing user profile
        user.email = body.email
        user.full_name = body.full_name
        if body.avatar_url:
            user.avatar_url = body.avatar_url
        user.last_login_at = now

    await db.commit()
    await db.refresh(user)

    response = SyncUserResponse.model_validate(user)
    response.is_new_user = is_new
    return response

@router.get("/me", response_model=UserProfileDetail)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get profile of current authenticated user along with study statistics."""
    # Count sessions and duration
    stmt = select(
        func.count(StudySession.id).label("total_sessions"),
        func.coalesce(func.sum(StudySession.active_duration_seconds), 0).label("total_seconds")
    ).where(StudySession.user_id == current_user.id, StudySession.status == "completed")
    
    result = await db.execute(stmt)
    row = result.one()
    
    total_sessions = row.total_sessions or 0
    total_seconds = row.total_seconds or 0
    total_hours = round(total_seconds / 3600.0, 1)

    profile = UserProfileDetail.model_validate(current_user)
    profile.total_sessions = total_sessions
    profile.total_study_hours = total_hours
    return profile

@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update profile information for current user."""
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout current user (client should discard token)."""
    return {"message": "Successfully logged out"}

@router.post("/dev/login", response_model=TokenResponse)
async def dev_login(
    email: str = "dev@concentra.local",
    db: AsyncSession = Depends(get_db)
):
    """Development login endpoint to generate JWT token without Supabase."""
    if not settings.USE_LOCAL_AUTH:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Development auth is disabled in production"
        )

    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    now = datetime.utcnow()
    if not user:
        user = User(
            supabase_uid=f"dev_{email}",
            email=email,
            full_name="Developer User",
            avatar_url=None,
            auth_provider="dev",
            last_login_at=now
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_local_access_token({
        "sub": str(user.id),
        "email": user.email,
        "supabase_uid": user.supabase_uid
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )
