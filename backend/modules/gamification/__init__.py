"""
Gamification Module.

This module handles the coin rewards system and trust scoring for users.

Bounded Context: Gamification
- Coin transactions and balances
- Reward calculations
- Trust score computation
"""

from .domain.events import CoinsAwarded, CoinsSpent
from .application.commands import AwardCoinsCommand, SpendCoinsCommand
from .application.queries import GetCoinBalanceQuery, GetTransactionsQuery

__all__ = [
    "CoinsAwarded",
    "CoinsSpent",
    "AwardCoinsCommand",
    "SpendCoinsCommand",
    "GetCoinBalanceQuery",
    "GetTransactionsQuery",
]
