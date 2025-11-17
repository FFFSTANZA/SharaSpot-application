"""Schemas for data scraping operations"""
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime


class ScrapingJobRequest(BaseModel):
    """Request to start a scraping job"""
    scrape_sources: Optional[List[str]] = Field(
        default=None,
        description="List of sources to scrape. If None, scrapes all sources"
    )
    skip_processing: bool = Field(
        default=False,
        description="Skip data processing and deduplication"
    )


class ScrapingJobResponse(BaseModel):
    """Response after initiating a scraping job"""
    job_id: str
    status: str
    message: str
    started_at: datetime


class ScrapingMetricsSummary(BaseModel):
    """Summary metrics from scraping"""
    total_stations: int
    total_ports: int
    total_available_ports: int
    average_ports_per_station: float
    stations_with_photos: int
    stations_with_amenities: int
    high_uptime_stations: int
    verified_stations: int
    coverage_percentage: Dict[str, float]


class ScrapingMetricsResponse(BaseModel):
    """Complete metrics response"""
    job_id: str
    summary: ScrapingMetricsSummary
    by_state: Dict[str, int]
    by_source: Dict[str, int]
    port_types: Dict[str, int]
    port_combinations: Dict[str, int]
    amenities: Dict[str, int]
    operators: Dict[str, int]
    verification_distribution: Dict[str, int]
    data_quality: Dict[str, int]
    top_states: List[tuple]
    top_operators: List[tuple]
    analysis_timestamp: str


class ImportConfirmationRequest(BaseModel):
    """Request to confirm and import scraped data"""
    job_id: str
    confirm: bool = Field(
        description="Set to True to confirm import, False to cancel"
    )
    notes: Optional[str] = Field(
        default=None,
        description="Optional notes about the import"
    )


class ImportConfirmationResponse(BaseModel):
    """Response after import confirmation"""
    job_id: str
    status: str
    imported_count: int
    skipped_count: int
    error_count: int
    message: str
    completed_at: datetime


class ScrapingJobStatus(BaseModel):
    """Status of a scraping job"""
    job_id: str
    user_id: str
    user_email: str
    status: str  # "pending", "scraping", "processing", "ready_for_review", "importing", "completed", "failed", "cancelled"
    progress: float  # 0-100
    current_step: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    metrics_available: bool
    data_imported: bool
