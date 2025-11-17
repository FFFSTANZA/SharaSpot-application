"""
SharaSpot Backend - Modular Monolith Architecture
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import logging

from app.core.config import settings
from app.core.database import connect_to_database, close_database_connection
from app.core.middleware import (
    limiter,
    RequestLoggingMiddleware,
    ErrorSanitizationMiddleware,
    SecurityHeadersMiddleware,
    rate_limit_exceeded_handler,
)
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION_STRING
)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Configure CORS (must be first middleware)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Add custom middleware (order matters - these run in reverse order)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(ErrorSanitizationMiddleware)
app.add_middleware(RequestLoggingMiddleware)


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting SharaSpot Backend...")
    await connect_to_database()
    logger.info("PostgreSQL database connected successfully")
    logger.info("Note: Run 'alembic upgrade head' to apply database migrations")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("Shutting down SharaSpot Backend...")
    await close_database_connection()
    logger.info("Database connection closed")


# Include API router
app.include_router(api_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SharaSpot API",
        "version": "2.0.0",
        "architecture": "Modular Monolith"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
