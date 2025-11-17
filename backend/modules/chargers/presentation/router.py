"""
Chargers Module Router

Aggregates all chargers endpoints.
"""

from fastapi import APIRouter

# Import from existing routes (to be refactored)
try:
    from .routes import router as chargers_router
except ImportError:
    chargers_router = APIRouter(prefix="/api/chargers", tags=["Chargers"])

# Export router
router = chargers_router
