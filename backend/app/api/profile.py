"""Profile and wallet API routes"""
from fastapi import APIRouter, Cookie, Header, HTTPException
from typing import Optional

from ..services import charger_service, gamification_service, profile_service
from ..core.security import get_user_from_session

router = APIRouter(tags=["profile"])


@router.get("/profile/activity")
async def get_user_activity(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get user's activity (submissions, verifications, reports)"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await charger_service.get_user_activity(user)


@router.get("/wallet/transactions")
async def get_coin_transactions(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get user's coin transaction history"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await gamification_service.get_coin_transactions(user.id)


@router.put("/settings")
async def update_settings(
    theme: Optional[str] = None,
    notifications_enabled: Optional[bool] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Update user settings"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await profile_service.update_settings(user, theme, notifications_enabled)


@router.get("/profile/stats")
async def get_profile_stats(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get user profile statistics"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await profile_service.get_profile_stats(user)
