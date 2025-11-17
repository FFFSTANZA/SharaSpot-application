"""Profile and wallet API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from modules.auth.domain.user import User
from modules.profile.application import profile_service
from modules.chargers.application import charger_service
from modules.gamification.application import gamification_service
from app.core.security import get_user_from_session
from app.core.database import get_session

router = APIRouter(tags=["profile"])


@router.get("/profile/activity")
async def get_user_activity(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session)
):
    """Get user's activity (submissions, verifications, reports)"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await charger_service.get_user_activity(user, db)


@router.get("/wallet/transactions")
async def get_coin_transactions(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session)
):
    """Get user's coin transaction history"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await gamification_service.get_coin_transactions(user.id, db)


@router.put("/settings")
async def update_settings(
    theme: Optional[str] = None,
    notifications_enabled: Optional[bool] = None,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session)
):
    """Update user settings"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await profile_service.update_settings(user, db, theme, notifications_enabled)


@router.get("/profile/stats")
async def get_profile_stats(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session)
):
    """Get user profile statistics"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await profile_service.get_profile_stats(user, db)
