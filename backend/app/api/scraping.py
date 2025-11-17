"""Data Scraping API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..models.user import User
from ..schemas.scraping import (
    ScrapingJobRequest,
    ScrapingJobResponse,
    ScrapingMetricsResponse,
    ScrapingJobStatus,
    ImportConfirmationRequest,
    ImportConfirmationResponse,
)
from ..services import scraping_service
from ..core.security import get_user_from_session
from ..core.database import get_session

router = APIRouter(prefix="/scraping", tags=["scraping"])


@router.post("/start", response_model=ScrapingJobResponse)
async def start_scraping(
    request: ScrapingJobRequest,
    user: User = Depends(get_user_from_session),
    db: AsyncSession = Depends(get_session)
):
    """
    Start a new data scraping job

    This will scrape data from various sources but NOT import it immediately.
    Instead, it will generate metrics for review and wait for confirmation.

    Requires authentication. Only admin users can start scraping jobs.
    """
    if not user:
        raise HTTPException(401, "Not authenticated")

    # Check if user is admin (you may want to add a role check)
    # For now, we'll allow any authenticated user
    # In production, add: if user.role != 'admin': raise HTTPException(403, "Admin access required")

    return await scraping_service.start_scraping_job(
        user,
        scrape_sources=request.scrape_sources
    )


@router.get("/jobs", response_model=List[ScrapingJobStatus])
async def list_scraping_jobs(
    limit: int = 10,
    user: User = Depends(get_user_from_session)
):
    """
    List recent scraping jobs for the current user
    """
    if not user:
        raise HTTPException(401, "Not authenticated")

    return await scraping_service.list_jobs(user, limit=limit)


@router.get("/jobs/{job_id}", response_model=ScrapingJobStatus)
async def get_scraping_job_status(
    job_id: str,
    user: User = Depends(get_user_from_session)
):
    """
    Get status of a specific scraping job
    """
    if not user:
        raise HTTPException(401, "Not authenticated")

    job = await scraping_service.get_scraping_status(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    # Check if user owns this job
    if job.user_id != user.id:
        raise HTTPException(403, "Access denied")

    return job


@router.get("/jobs/{job_id}/metrics", response_model=ScrapingMetricsResponse)
async def get_scraping_metrics(
    job_id: str,
    user: User = Depends(get_user_from_session)
):
    """
    Get detailed metrics and statistics for a scraping job

    This endpoint provides comprehensive analysis of the scraped data including:
    - Total stations by state
    - Data source breakdown
    - Port types distribution
    - Amenities analysis
    - Data quality metrics

    Only available when job status is 'ready_for_review'
    """
    if not user:
        raise HTTPException(401, "Not authenticated")

    # Verify job ownership
    job = await scraping_service.get_scraping_status(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    if job.user_id != user.id:
        raise HTTPException(403, "Access denied")

    if not job.metrics_available:
        raise HTTPException(400, "Metrics not yet available. Job status: " + job.status)

    metrics = await scraping_service.get_scraping_metrics(job_id)
    if not metrics:
        raise HTTPException(404, "Metrics not found")

    return metrics


@router.post("/jobs/{job_id}/import", response_model=ImportConfirmationResponse)
async def confirm_and_import(
    job_id: str,
    request: ImportConfirmationRequest,
    user: User = Depends(get_user_from_session),
    db: AsyncSession = Depends(get_session)
):
    """
    Confirm and import scraped data into the database

    After reviewing the metrics, use this endpoint to:
    - Confirm import (confirm=True) to push data to the database
    - Cancel import (confirm=False) to discard the scraped data

    This is the final step that actually modifies the database.
    """
    if not user:
        raise HTTPException(401, "Not authenticated")

    # Verify job ownership
    job = await scraping_service.get_scraping_status(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    if job.user_id != user.id:
        raise HTTPException(403, "Access denied")

    if job.status != 'ready_for_review':
        raise HTTPException(400, f"Job is not ready for import. Current status: {job.status}")

    return await scraping_service.confirm_import(
        job_id=job_id,
        confirm=request.confirm,
        notes=request.notes,
        db=db
    )


@router.delete("/jobs/{job_id}")
async def cancel_scraping_job(
    job_id: str,
    user: User = Depends(get_user_from_session)
):
    """
    Cancel a running scraping job or delete job data
    """
    if not user:
        raise HTTPException(401, "Not authenticated")

    job = await scraping_service.get_scraping_status(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    if job.user_id != user.id:
        raise HTTPException(403, "Access denied")

    # For now, we'll just return a message
    # In production, implement proper job cancellation
    return {"message": "Job cancellation requested", "job_id": job_id}
