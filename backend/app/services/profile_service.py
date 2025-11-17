"""Profile and settings service"""
from typing import Optional
from fastapi import HTTPException

from ..models.user import User
from ..core import get_database
from .gamification_service import calculate_trust_score


async def update_settings(
    user: User,
    theme: Optional[str] = None,
    notifications_enabled: Optional[bool] = None
) -> dict:
    """Update user settings"""
    db = get_database()

    update_data = {}
    if theme is not None:
        update_data["theme"] = theme
    if notifications_enabled is not None:
        update_data["notifications_enabled"] = notifications_enabled

    if update_data:
        await db.users.update_one({"id": user.id}, {"$set": update_data})

    return {"message": "Settings updated successfully"}


async def get_profile_stats(user: User) -> dict:
    """Get user profile statistics"""
    db = get_database()

    trust_score = await calculate_trust_score(user.id)
    await db.users.update_one({"id": user.id}, {"$set": {"trust_score": trust_score}})

    return {
        "shara_coins": user.shara_coins,
        "chargers_added": user.chargers_added,
        "verifications_count": user.verifications_count,
        "photos_uploaded": user.photos_uploaded,
        "reports_submitted": user.reports_submitted,
        "trust_score": trust_score
    }
