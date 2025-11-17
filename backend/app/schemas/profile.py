"""Profile request/response schemas"""
from pydantic import BaseModel, Field


class UserSettings(BaseModel):
    """User settings schema"""
    theme: str = "light"  # "light" or "dark"
    notifications_enabled: bool = True


class UserProfile(BaseModel):
    """User profile statistics schema"""
    shara_coins: int = 0
    verifications_count: int = 0
    chargers_added: int = 0
    photos_uploaded: int = 0
    reports_submitted: int = 0
    coins_redeemed: int = 0
    trust_score: float = 0.0
    settings: UserSettings = Field(default_factory=UserSettings)
