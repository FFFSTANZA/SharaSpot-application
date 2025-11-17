"""
Routing Module Router

Aggregates all routing endpoints.
"""

from fastapi import APIRouter

# Import from existing routes (to be refactored)
try:
    from .routes import router as routing_router
except ImportError:
    routing_router = APIRouter(prefix="/api/routing", tags=["Routing"])

# Export router
router = routing_router
