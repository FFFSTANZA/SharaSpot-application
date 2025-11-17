"""User-related database models"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timezone
import uuid


class User(BaseModel):
    """User model for database"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    picture: Optional[str] = None
    port_type: Optional[str] = None
    vehicle_type: Optional[str] = None
    distance_unit: Optional[str] = "km"
    is_guest: bool = False
    shara_coins: int = 0
    verifications_count: int = 0
    chargers_added: int = 0
    photos_uploaded: int = 0
    reports_submitted: int = 0
    coins_redeemed: int = 0
    trust_score: float = 0.0
    theme: str = "light"
    notifications_enabled: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserSession(BaseModel):
    """User session model for authentication"""
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
