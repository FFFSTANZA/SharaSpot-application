"""Charger API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..models.charger import Charger
from ..models.user import User
from ..schemas.charger import ChargerCreateRequest, VerificationActionRequest
from ..services import charger_service
from ..core.security import get_user_from_session
from ..core.database import get_session

router = APIRouter(prefix="/chargers", tags=["chargers"])


@router.get("", response_model=List[Charger])
async def get_chargers(
    user: User = Depends(get_user_from_session),
    verification_level: Optional[int] = None,
    port_type: Optional[str] = None,
    amenity: Optional[str] = None,
    max_distance: Optional[float] = None
):
    """Get nearby chargers with optional filters"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await charger_service.get_chargers(
        user,
        verification_level=verification_level,
        port_type=port_type,
        amenity=amenity,
        max_distance=max_distance
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
