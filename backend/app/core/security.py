"""Security utilities"""
import bcrypt
import uuid
from typing import Optional
from datetime import datetime, timezone, timedelta
from fastapi import Header, Cookie

from ..models.user import User, UserSession
from .config import settings
from .database import get_database


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


async def create_session(user_id: str) -> str:
    """Create a new session for user"""
    db = get_database()
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)

    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    await db.user_sessions.insert_one(session.dict())
    return session_token


async def get_user_from_session(
    session_token: Optional[str] = None,
    authorization: Optional[str] = None
) -> Optional[User]:
    """Get user from session token (cookie or header)"""
    db = get_database()

    token = session_token
    if not token and authorization:
        if authorization.startswith('Bearer '):
            token = authorization[7:]

    if not token:
        return None

    session = await db.user_sessions.find_one({"session_token": token})
    if not session:
        return None

    # Make sure expires_at is timezone-aware
    expires_at = session['expires_at']
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        return None

    user_doc = await db.users.find_one({"id": session['user_id']})
    if not user_doc:
        return None

    return User(**user_doc)
