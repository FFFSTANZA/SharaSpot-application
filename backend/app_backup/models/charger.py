"""Charger-related database models"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid


class VerificationAction(BaseModel):
    """Verification action model"""
    user_id: str
    action: str  # "active", "not_working", "partial"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
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


class Charger(BaseModel):
    """Charger model for database"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    latitude: float
    longitude: float
    port_types: List[str]
    available_ports: int = 1
    total_ports: int = 2
    source_type: str = "official"  # "official" | "community_manual"
    verification_level: int = 5  # 1-5
    added_by: Optional[str] = None  # user_id or "admin"
    amenities: List[str] = []  # ["restroom", "cafe", "wifi", "parking", "shopping"]
    nearby_amenities: List[str] = []  # amenities within 500m
    photos: List[str] = []  # base64 encoded images
    last_verified: Optional[datetime] = None
    uptime_percentage: float = 95.0
    verified_by_count: int = 0
    verification_history: List[VerificationAction] = []
    distance: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
