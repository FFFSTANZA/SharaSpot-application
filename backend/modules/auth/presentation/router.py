"""
Authentication Module Router

Aggregates all auth endpoints.
"""

from fastapi import APIRouter

# Import from existing routes (to be refactored)
try:
    from .routes import router as auth_router
except ImportError:
    auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Export router
router = auth_router
