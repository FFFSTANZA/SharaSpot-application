"""Gamification value objects."""

from dataclasses import dataclass
from decimal import Decimal
from enum import Enum

from shared.domain import ValueObject, ValidationError


@dataclass(frozen=True)
class CoinAmount(ValueObject):
    """
    Value object representing an amount of coins.

    Ensures coin amounts are valid (non-negative decimals).
    """

    value: Decimal

    def __post_init__(self):
        """Validate coin amount."""
        if not isinstance(self.value, Decimal):
            # Convert to Decimal if needed
            object.__setattr__(self, "value", Decimal(str(self.value)))

        if self.value < 0:
            raise ValidationError("coin_amount", "Cannot be negative")

    def __str__(self) -> str:
        return f"{self.value} coins"


class TransactionReason(Enum):
    """Enumeration of coin transaction reasons."""

    # Award reasons
    CHARGER_ADDED = "charger_added"
    CHARGER_VERIFIED = "charger_verified"
    PHOTO_UPLOADED = "photo_uploaded"
    REVIEW_POSTED = "review_posted"
    DAILY_LOGIN = "daily_login"
    REFERRAL_BONUS = "referral_bonus"

    # Spend reasons
    PREMIUM_FEATURE = "premium_feature"
    ROUTE_PLANNING = "route_planning"
    AD_REMOVAL = "ad_removal"
    CUSTOM_THEME = "custom_theme"

    # Admin reasons
    ADMIN_ADJUSTMENT = "admin_adjustment"
    REFUND = "refund"


@dataclass(frozen=True)
class TrustScore(ValueObject):
    """
    Value object representing a user's trust score.

    Trust score is a percentage (0-100) based on verification accuracy.
    """

    value: Decimal

    def __post_init__(self):
        """Validate trust score."""
        if not isinstance(self.value, Decimal):
            object.__setattr__(self, "value", Decimal(str(self.value)))

        if self.value < 0 or self.value > 100:
            raise ValidationError("trust_score", "Must be between 0 and 100")

    def __str__(self) -> str:
        return f"{self.value}%"

    @property
    def is_trusted(self) -> bool:
        """Check if score indicates trusted user (>= 70%)."""
        return self.value >= Decimal("70")

    @property
    def is_highly_trusted(self) -> bool:
        """Check if score indicates highly trusted user (>= 90%)."""
        return self.value >= Decimal("90")
