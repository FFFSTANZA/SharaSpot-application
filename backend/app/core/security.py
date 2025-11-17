"""Security utilities"""
import bcrypt
import uuid
import secrets
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import Header, Cookie, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt

from ..models.user import User as UserModel
from .db_models import User, UserSession as DBUserSession
from .config import settings
from .database import get_session


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


# ===========================
# JWT Token Functions
# ===========================

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token

    Args:
        data: Payload data to encode in the token
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token

    Args:
        data: Payload data to encode in the token

    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token

    Args:
        token: The JWT token to verify
        token_type: Expected token type ("access" or "refresh")

    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])

        # Verify token type matches expected type
        if payload.get("type") != token_type:
            return None

        return payload
    except JWTError:
        return None


def generate_csrf_token() -> str:
    """Generate a random CSRF token"""
    return secrets.token_urlsafe(32)


def create_token_pair(user_id: str, email: str, csrf_token: Optional[str] = None) -> Dict[str, str]:
    """
    Create an access token and refresh token pair

    Args:
        user_id: User ID to encode in tokens
        email: User email to encode in tokens
        csrf_token: Optional CSRF token to include in access token

    Returns:
        Dictionary with access_token, refresh_token, and csrf_token
    """
    # Generate CSRF token if not provided
    if csrf_token is None:
        csrf_token = generate_csrf_token()

    # Create tokens with user data
    token_data = {"sub": user_id, "email": email}
    access_token_data = {**token_data, "csrf": csrf_token}

    access_token = create_access_token(access_token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "csrf_token": csrf_token,
        "token_type": "bearer"
    }


# ===========================
# Legacy Session Functions (for backward compatibility)
# ===========================

async def create_session(user_id: str, db: AsyncSession) -> str:
    """
    Create a new session for user (legacy function)
    Now creates JWT tokens instead
    """
    # For backward compatibility, return access token
    token_pair = create_token_pair(user_id, "")
    return token_pair["access_token"]


async def get_user_from_token(
    db: AsyncSession = Depends(get_session),
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None)
) -> Optional[UserModel]:
    """
    Get user from JWT access token (header or cookie)

    Args:
        db: Database session
        authorization: Authorization header (Bearer token)
        access_token: Access token from cookie

    Returns:
        User model or None if token is invalid
    """
    token = None

    # Extract token from Authorization header
    if authorization and authorization.startswith('Bearer '):
        token = authorization[7:]
    # Fallback to cookie
    elif access_token:
        token = access_token

    if not token:
        return None

    # Verify JWT token
    payload = verify_token(token, token_type="access")
    if not payload:
        return None

    # Extract user ID from token
    user_id = payload.get("sub")
    if not user_id:
        return None

    # Get user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return None

    # Convert to Pydantic model (excluding password)
    return UserModel(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        port_type=user.port_type,
        vehicle_type=user.vehicle_type,
        distance_unit=user.distance_unit,
        is_guest=user.is_guest,
        shara_coins=user.shara_coins,
        verifications_count=user.verifications_count,
        chargers_added=user.chargers_added,
        photos_uploaded=user.photos_uploaded,
        reports_submitted=user.reports_submitted,
        coins_redeemed=user.coins_redeemed,
        trust_score=user.trust_score,
        theme=user.theme,
        notifications_enabled=user.notifications_enabled,
        created_at=user.created_at
    )


async def get_user_from_session(
    db: AsyncSession = Depends(get_session),
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None)
) -> Optional[UserModel]:
    """
    Get user from session token or JWT token (backward compatible)
    Supports both legacy session tokens and new JWT tokens

    Args:
        db: Database session
        session_token: Legacy session token from cookie
        authorization: Authorization header (Bearer token)
        access_token: JWT access token from cookie

    Returns:
        User model or None if authentication fails
    """
    # Try JWT token first (new method)
    if authorization or access_token:
        user = await get_user_from_token(db, authorization, access_token)
        if user:
            return user

    # Fallback to legacy session token
    token = session_token
    if not token and authorization and authorization.startswith('Bearer '):
        token = authorization[7:]

    if not token:
        return None

    # Check if it's a JWT token (for backward compatibility)
    jwt_payload = verify_token(token, token_type="access")
    if jwt_payload:
        user_id = jwt_payload.get("sub")
        if user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                return UserModel(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    picture=user.picture,
                    port_type=user.port_type,
                    vehicle_type=user.vehicle_type,
                    distance_unit=user.distance_unit,
                    is_guest=user.is_guest,
                    shara_coins=user.shara_coins,
                    verifications_count=user.verifications_count,
                    chargers_added=user.chargers_added,
                    photos_uploaded=user.photos_uploaded,
                    reports_submitted=user.reports_submitted,
                    coins_redeemed=user.coins_redeemed,
                    trust_score=user.trust_score,
                    theme=user.theme,
                    notifications_enabled=user.notifications_enabled,
                    created_at=user.created_at
                )

    # Try legacy session token from database
    result = await db.execute(
        select(DBUserSession).where(DBUserSession.session_token == token)
    )
    session = result.scalar_one_or_none()
    if not session:
        return None

    # Check expiration
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        await db.delete(session)
        await db.flush()
        return None

    # Get user
    result = await db.execute(select(User).where(User.id == session.user_id))
    user = result.scalar_one_or_none()
    if not user:
        return None

    # Convert to Pydantic model (excluding password)
    return UserModel(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        port_type=user.port_type,
        vehicle_type=user.vehicle_type,
        distance_unit=user.distance_unit,
        is_guest=user.is_guest,
        shara_coins=user.shara_coins,
        verifications_count=user.verifications_count,
        chargers_added=user.chargers_added,
        photos_uploaded=user.photos_uploaded,
        reports_submitted=user.reports_submitted,
        coins_redeemed=user.coins_redeemed,
        trust_score=user.trust_score,
        theme=user.theme,
        notifications_enabled=user.notifications_enabled,
        created_at=user.created_at
    )
