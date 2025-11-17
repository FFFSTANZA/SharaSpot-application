"""
Profile Module Router

Aggregates all profile endpoints.
"""

from fastapi import APIRouter

# Import from existing routes (to be refactored)
try:
    from .routes import router as profile_router
except ImportError:
    profile_router = APIRouter(prefix="/api/profile", tags=["Profile"])

# Export router
router = profile_router
