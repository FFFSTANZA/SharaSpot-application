"""Profile and settings service"""
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User as UserModel
from ..core.db_models import User
from .gamification_service import calculate_trust_score


async def update_settings(
    user: UserModel,
    db: AsyncSession,
    theme: Optional[str] = None,
    notifications_enabled: Optional[bool] = None
) -> dict:
    """Update user settings"""
    # Get user from database
    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalar_one_or_none()

    if not db_user:
        raise HTTPException(404, "User not found")

    if theme is not None:
        db_user.theme = theme
    if notifications_enabled is not None:
        db_user.notifications_enabled = notifications_enabled

    await db.flush()

    return {"message": "Settings updated successfully"}


async def get_profile_stats(user: UserModel, db: AsyncSession) -> dict:
    """Get user profile statistics"""
    trust_score = await calculate_trust_score(user.id, db)

    # Update trust score in database
    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalar_one_or_none()
    if db_user:
        db_user.trust_score = trust_score
        await db.flush()

    return {
        "shara_coins": user.shara_coins,
        "chargers_added": user.chargers_added,
        "verifications_count": user.verifications_count,
        "photos_uploaded": user.photos_uploaded,
        "reports_submitted": user.reports_submitted,
        "trust_score": trust_score
    }
