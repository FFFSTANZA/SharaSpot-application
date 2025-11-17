"""API routes package"""
from fastapi import APIRouter
from .auth import router as auth_router
from .chargers import router as chargers_router
from .routing import router as routing_router
from .profile import router as profile_router
from .analytics import router as analytics_router
from .scraping import router as scraping_router

# Create main API router
api_router = APIRouter(prefix="/api")

# Include all sub-routers
api_router.include_router(auth_router)
api_router.include_router(chargers_router)
api_router.include_router(routing_router)
api_router.include_router(profile_router)
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(scraping_router)

__all__ = ["api_router"]
