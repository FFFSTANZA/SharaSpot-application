"""Coin transaction database model"""
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid


class CoinTransaction(BaseModel):
    """Coin transaction model for gamification"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str  # "add_charger", "verify_charger", "upload_photo", "report_invalid", "redeem_coupon"
    amount: int  # positive for earning, negative for spending
    description: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
