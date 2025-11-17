"""Gamification domain events."""

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from shared.domain import DomainEvent


@dataclass
class CoinsAwarded(DomainEvent):
    """
    Event raised when coins are awarded to a user.

    Other modules can listen to this event to trigger side effects.
    """

    user_id: UUID
    amount: Decimal
    reason: str
    new_balance: Decimal


@dataclass
class CoinsSpent(DomainEvent):
    """Event raised when coins are spent by a user."""

    user_id: UUID
    amount: Decimal
    reason: str
    new_balance: Decimal


@dataclass
class TrustScoreUpdated(DomainEvent):
    """Event raised when a user's trust score is updated."""

    user_id: UUID
    old_score: Decimal
    new_score: Decimal
    reason: str
