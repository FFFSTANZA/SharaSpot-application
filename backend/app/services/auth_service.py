"""Authentication service business logic"""
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User as UserModel
from ..core.db_models import User, UserSession
from ..schemas.auth import SignupRequest, LoginRequest, PreferencesUpdate
from ..core import (
    get_database,
    hash_password,
    verify_password,
    create_session,
)


async def signup_user(data: SignupRequest, db: AsyncSession) -> tuple[UserModel, str]:
    """Create a new user account"""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Email already registered")

    # Create new user
    user = User(
        email=data.email,
        name=data.name,
        picture=None,
        password=hash_password(data.password)
    )

    db.add(user)
    await db.flush()  # Flush to get the ID

    # Create session
    session_token = await create_session(user.id, db)

    # Convert to Pydantic model (excluding password)
    user_model = UserModel(
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

    return user_model, session_token


async def login_user(data: LoginRequest, db: AsyncSession) -> tuple[UserModel, str]:
    """Login existing user"""
    # Find user by email
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.password:
        raise HTTPException(401, "Invalid credentials")

    # Verify password
    if not verify_password(data.password, user.password):
        raise HTTPException(401, "Invalid credentials")

    # Create session
    session_token = await create_session(user.id, db)

    # Convert to Pydantic model (excluding password)
    user_model = UserModel(
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

    return user_model, session_token


async def create_guest_user(db: AsyncSession) -> tuple[UserModel, str]:
    """Create a guest user session"""
    import uuid

    guest = User(
        email=f"guest_{uuid.uuid4().hex[:8]}@example.com",
        name="Guest User",
        is_guest=True
    )
    db.add(guest)
    await db.flush()

    session_token = await create_session(guest.id, db)

    # Convert to Pydantic model
    guest_model = UserModel(
        id=guest.id,
        email=guest.email,
        name=guest.name,
        picture=guest.picture,
        port_type=guest.port_type,
        vehicle_type=guest.vehicle_type,
        distance_unit=guest.distance_unit,
        is_guest=guest.is_guest,
        shara_coins=guest.shara_coins,
        verifications_count=guest.verifications_count,
        chargers_added=guest.chargers_added,
        photos_uploaded=guest.photos_uploaded,
        reports_submitted=guest.reports_submitted,
        coins_redeemed=guest.coins_redeemed,
        trust_score=guest.trust_score,
        theme=guest.theme,
        notifications_enabled=guest.notifications_enabled,
        created_at=guest.created_at
    )

    return guest_model, session_token


async def logout_user(session_token: Optional[str], db: AsyncSession) -> None:
    """Logout user by deleting session"""
    if not session_token:
        return

    result = await db.execute(
        select(UserSession).where(UserSession.session_token == session_token)
    )
    session = result.scalar_one_or_none()
    if session:
        await db.delete(session)


async def update_user_preferences(user: UserModel, data: PreferencesUpdate, db: AsyncSession) -> UserModel:
    """Update user preferences"""
    if user.is_guest:
        raise HTTPException(403, "Guests cannot save preferences")

    # Get user from database
    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalar_one_or_none()

    if not db_user:
        raise HTTPException(404, "User not found")

    # Update preferences
    db_user.port_type = data.port_type
    db_user.vehicle_type = data.vehicle_type
    db_user.distance_unit = data.distance_unit

    await db.flush()

    # Update Pydantic model
    user.port_type = data.port_type
    user.vehicle_type = data.vehicle_type
    user.distance_unit = data.distance_unit

    return user
