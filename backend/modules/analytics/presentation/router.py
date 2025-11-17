"""
Analytics Module Router

Aggregates all analytics endpoints.
"""

from fastapi import APIRouter

# Import from existing routes (to be refactored)
try:
    from .routes import router as analytics_router
except ImportError:
    analytics_router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

# Export router
router = analytics_router
