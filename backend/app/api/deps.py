from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.core.security import decode_and_verify_token
from app.models.user import User

security_scheme = HTTPBearer()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_async_db():
        yield session

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_and_verify_token(token)
    
    # Try getting user identifier (sub or email or supabase_uid)
    sub = payload.get("sub")
    email = payload.get("email")
    supabase_uid = payload.get("supabase_uid", sub)

    if not sub and not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Query user from db
    stmt = select(User).where((User.supabase_uid == supabase_uid) | (User.email == email))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with this token was not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user
