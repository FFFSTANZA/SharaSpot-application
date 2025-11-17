"""Routing API routes"""
from fastapi import APIRouter, Cookie, Header, HTTPException
from typing import Optional
import logging

from ..schemas.routing import HERERouteRequest, HERERouteResponse
from ..services import routing_service
from ..core.security import get_user_from_session

router = APIRouter(prefix="/routing", tags=["routing"])


@router.post("/here/calculate")
async def calculate_here_routes(
    request: HERERouteRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Calculate EV routes using HERE API with SharaSpot charger integration"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")

    try:
        return await routing_service.calculate_here_routes(request)
    except Exception as e:
        logging.error(f"Route calculation error: {str(e)}")
        raise HTTPException(500, f"Failed to calculate routes: {str(e)}")
