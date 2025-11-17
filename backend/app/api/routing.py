"""Routing API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from ..models.user import User
from ..schemas.routing import HERERouteRequest, HERERouteResponse
from ..services import routing_service
from ..core.security import get_user_from_session
from ..core.database import get_session

router = APIRouter(prefix="/routing", tags=["routing"])


@router.post("/here/calculate")
async def calculate_here_routes(
    request: HERERouteRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session)
):
    """Calculate EV routes using HERE API with SharaSpot charger integration"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    try:
        return await routing_service.calculate_here_routes(request, db)
    except Exception as e:
        logging.error(f"Route calculation error: {str(e)}")
        raise HTTPException(500, f"Failed to calculate routes: {str(e)}")
