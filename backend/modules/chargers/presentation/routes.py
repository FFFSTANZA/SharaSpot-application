"""Charger API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from modules.charger.domain.charger import Charger
from modules.user.domain.user import User
from modules.charger.presentation.charger import ChargerCreateRequest, VerificationActionRequest
from ..services import charger_service
from app.core.security import get_user_from_session
from app.core.database import get_session

router = APIRouter(prefix="/chargers", tags=["chargers"])


@router.get("", response_model=List[Charger])
async def get_chargers(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session),
    verification_level: Optional[int] = None,
    port_type: Optional[str] = None,
    amenity: Optional[str] = None,
    max_distance: Optional[float] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None
):
    """Get nearby chargers with optional filters"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await charger_service.get_chargers(
        user,
        verification_level=verification_level,
        port_type=port_type,
        amenity=amenity,
        max_distance=max_distance,
        user_lat=user_lat,
        user_lng=user_lng,
        db=db
    )


@router.post("")
async def add_charger(
    request: ChargerCreateRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session)
):
    """Add new charger (restricted for guests)"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await charger_service.add_charger(user, request, db)


@router.get("/{charger_id}")
async def get_charger_detail(
    charger_id: str,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session)
):
    """Get detailed charger information"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await charger_service.get_charger_detail(charger_id, db)


@router.post("/{charger_id}/verify")
async def verify_charger(
    charger_id: str,
    request: VerificationActionRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session)
):
    """Add verification action to charger"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await charger_service.verify_charger(user, charger_id, request, db)
