"""
SharaSpot Backend - Modular Monolith Architecture
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import connect_to_database, close_database_connection
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="SharaSpot API",
    description="EV Charging Station Discovery and Verification Platform",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting SharaSpot Backend...")
    await connect_to_database()
    logger.info("Database connected successfully")


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
