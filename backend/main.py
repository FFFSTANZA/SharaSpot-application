"""
SharaSpot Backend - Modular Monolith Architecture

This is the main entry point that aggregates all module routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.middleware import setup_middleware
from app.core.config import settings
from container import configure_container

# Import module routers
from modules.auth.presentation.router import router as auth_router
from modules.chargers.presentation.router import router as chargers_router
from modules.routing.presentation.router import router as routing_router
from modules.profile.presentation.router import router as profile_router
from modules.analytics.presentation.router import router as analytics_router
from modules.gamification.presentation.routes import router as gamification_router

# Initialize FastAPI
app = FastAPI(
    title="SharaSpot API",
    description="Modular Monolith Architecture",
    version="2.0.0",
)

# Configure dependency injection
configure_container()

# Setup middleware
setup_middleware(app)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include module routers
app.include_router(auth_router)
app.include_router(chargers_router)
app.include_router(routing_router)
app.include_router(profile_router)
app.include_router(analytics_router)
app.include_router(gamification_router)

@app.get("/")
async def root():
    return {
        "message": "SharaSpot API - Modular Monolith",
        "version": "2.0.0",
        "architecture": "Modular Monolith with Domain-Driven Design"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
