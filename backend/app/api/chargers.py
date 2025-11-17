"""Charger API routes"""
from fastapi import APIRouter, Cookie, Header, HTTPException
from typing import List, Optional

from ..models.charger import Charger
from ..schemas.charger import ChargerCreateRequest, VerificationActionRequest
from ..services import charger_service
from ..core.security import get_user_from_session

router = APIRouter(prefix="/chargers", tags=["chargers"])


@router.get("", response_model=List[Charger])
async def get_chargers(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    verification_level: Optional[int] = None,
    port_type: Optional[str] = None,
    amenity: Optional[str] = None,
    max_distance: Optional[float] = None
):
    """Get nearby chargers with optional filters"""
    user = await get_user_from_session(session_token, authorization)
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
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Add new charger (restricted for guests)"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await charger_service.add_charger(user, request)


@router.get("/{charger_id}")
async def get_charger_detail(
    charger_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get detailed charger information"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await charger_service.get_charger_detail(charger_id)


@router.post("/{charger_id}/verify")
async def verify_charger(
    charger_id: str,
    request: VerificationActionRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Add verification action to charger"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await charger_service.verify_charger(user, charger_id, request)
