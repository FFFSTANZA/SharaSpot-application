"""Charger request/response schemas"""
from pydantic import BaseModel, Field, field_validator, constr
from typing import List, Optional, Generic, TypeVar
import html


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
    """Schema for creating a new charger with input validation and sanitization"""
    name: constr(min_length=1, max_length=200, strip_whitespace=True)
    address: constr(min_length=1, max_length=500, strip_whitespace=True)
    latitude: float = Field(ge=-90, le=90, description="Latitude must be between -90 and 90")
    longitude: float = Field(ge=-180, le=180, description="Longitude must be between -180 and 180")
    port_types: List[str] = Field(min_length=1, max_length=10)
    total_ports: int = Field(ge=1, le=100, description="Total ports must be between 1 and 100")
    amenities: List[str] = Field(default=[], max_length=20)
    nearby_amenities: List[str] = Field(default=[], max_length=20)
    photos: List[str] = Field(default=[], max_length=10)
    notes: Optional[constr(max_length=2000, strip_whitespace=True)] = None

    @field_validator('name', 'address', 'notes')
    @classmethod
    def sanitize_html(cls, v):
        """Sanitize string inputs to prevent XSS attacks"""
        if v is not None:
            return html.escape(v)
        return v

    @field_validator('port_types', 'amenities', 'nearby_amenities')
    @classmethod
    def sanitize_lists(cls, v):
        """Sanitize list items to prevent XSS attacks"""
        if v is not None:
            return [html.escape(item) for item in v]
        return v


class VerificationActionRequest(BaseModel):
    """Schema for submitting charger verification with input validation"""
    action: str = Field(pattern="^(active|not_working|partial)$", description="Must be 'active', 'not_working', or 'partial'")
    notes: Optional[constr(max_length=2000, strip_whitespace=True)] = None
    # Wait time and port context
    wait_time: Optional[int] = Field(None, ge=0, le=1440, description="Wait time in minutes (max 24 hours)")
    port_type_used: Optional[str] = Field(None, pattern="^(Type 1|Type 2|CCS|CHAdeMO|Tesla)$")
    ports_available: Optional[int] = Field(None, ge=0, le=100)
    charging_success: Optional[bool] = None
    # Operational details
    payment_method: Optional[str] = Field(None, pattern="^(App|Card|Cash|Free|Subscription)$")
    station_lighting: Optional[str] = Field(None, pattern="^(Well-lit|Adequate|Poor)$")
    # Quality ratings
    cleanliness_rating: Optional[int] = Field(None, ge=1, le=5, description="Rating must be 1-5 stars")
    charging_speed_rating: Optional[int] = Field(None, ge=1, le=5, description="Rating must be 1-5 stars")
    amenities_rating: Optional[int] = Field(None, ge=1, le=5, description="Rating must be 1-5 stars")
    would_recommend: Optional[bool] = None
    # Photo evidence (for not_working reports)
    photo_url: Optional[constr(max_length=1000)] = None

    @field_validator('notes')
    @classmethod
    def sanitize_notes(cls, v):
        """Sanitize notes to prevent XSS attacks"""
        if v is not None:
            return html.escape(v)
        return v
