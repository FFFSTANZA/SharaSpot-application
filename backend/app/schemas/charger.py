"""Charger request/response schemas"""
from pydantic import BaseModel, Field
from typing import List, Optional, Generic, TypeVar


T = TypeVar('T')


class PaginationParams(BaseModel):
    """Schema for pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=100, ge=1, le=500, description="Items per page (max 500)")


class PaginatedResponse(BaseModel, Generic[T]):
    """Schema for paginated responses"""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class ChargerCreateRequest(BaseModel):
    """Schema for creating a new charger"""
    name: str
    address: str
    latitude: float
    longitude: float
    port_types: List[str]
    total_ports: int
    amenities: List[str] = []
    nearby_amenities: List[str] = []
    photos: List[str] = []
    notes: Optional[str] = None


class VerificationActionRequest(BaseModel):
    """Schema for submitting charger verification"""
    action: str  # "active", "not_working", "partial"
    notes: Optional[str] = None
    # Wait time and port context
    wait_time: Optional[int] = None  # in minutes - for available port
    port_type_used: Optional[str] = None  # "Type 1", "Type 2", "CCS", "CHAdeMO"
    ports_available: Optional[int] = None  # number of ports available on arrival
    charging_success: Optional[bool] = None  # worked on first try?
    # Operational details
    payment_method: Optional[str] = None  # "App", "Card", "Cash", "Free"
    station_lighting: Optional[str] = None  # "Well-lit", "Adequate", "Poor"
    # Quality ratings
    cleanliness_rating: Optional[int] = None  # 1-5 stars
    charging_speed_rating: Optional[int] = None  # 1-5 stars
    amenities_rating: Optional[int] = None  # 1-5 stars
    would_recommend: Optional[bool] = None
    # Photo evidence (for not_working reports)
    photo_url: Optional[str] = None
