from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core.config import settings

def create_local_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate a local JWT access token for development/testing."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    
    to_encode.update({"exp": expire, "iss": "concentra-local"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.LOCAL_JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def decode_and_verify_token(token: str) -> Dict[str, Any]:
    """Decode and verify JWT token (supports local mode & Supabase)."""
    # 1. Local Mode Verification
    if settings.USE_LOCAL_AUTH:
        try:
            payload = jwt.decode(
                token,
                settings.LOCAL_JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError as e:
            # Fallthrough to try Supabase secret if configured
            pass

    # 2. Supabase JWT Verification
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_aud": False}
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials / Invalid JWT token",
            headers={"WWW-Authenticate": "Bearer"},
        )
