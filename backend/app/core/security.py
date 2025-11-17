"""Security utilities"""
import bcrypt
import uuid
from typing import Optional
from datetime import datetime, timezone, timedelta
from fastapi import Header, Cookie, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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


async def create_session(user_id: str, db: AsyncSession) -> str:
    """Create a new session for user"""
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)

    session = DBUserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    db.add(session)
    await db.flush()
    return session_token


async def get_user_from_session(
    db: AsyncSession = Depends(get_session),
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
) -> Optional[UserModel]:
    """Get user from session token (cookie or header)"""
    token = session_token
    if not token and authorization:
        if authorization.startswith('Bearer '):
            token = authorization[7:]

    if not token:
        return None

    # Find session
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
