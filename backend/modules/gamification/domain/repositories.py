"""Gamification repository interfaces."""

from abc import abstractmethod
from typing import List, Optional
from uuid import UUID

from shared.domain import Repository
from .entities import CoinWallet, CoinTransaction


class ICoinWalletRepository(Repository[CoinWallet]):
    """Repository interface for coin wallets."""

    @abstractmethod
    async def get_by_user_id(self, user_id: UUID) -> Optional[CoinWallet]:
        """
        Get wallet by user ID.

        Args:
            user_id: The user ID

        Returns:
            The wallet if found, None otherwise
        """
        pass

    @abstractmethod
    async def get_or_create(self, user_id: UUID) -> CoinWallet:
        """
        Get wallet by user ID or create if doesn't exist.

        Args:
            user_id: The user ID

        Returns:
            The wallet
        """
        pass


class ICoinTransactionRepository(Repository[CoinTransaction]):
    """Repository interface for coin transactions."""

    @abstractmethod
    async def find_by_user_id(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[CoinTransaction]:
        """
        Find transactions by user ID.

        Args:
            user_id: The user ID
            skip: Number of transactions to skip
            limit: Maximum number of transactions to return

        Returns:
            List of transactions
        """
        pass

    @abstractmethod
    async def find_by_wallet_id(
        self, wallet_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[CoinTransaction]:
        """
        Find transactions by wallet ID.

        Args:
            wallet_id: The wallet ID
            skip: Number of transactions to skip
            limit: Maximum number of transactions to return

        Returns:
            List of transactions
        """
        pass

    @abstractmethod
    async def count_by_user(self, user_id: UUID) -> int:
        """
        Count transactions for a user.

        Args:
            user_id: The user ID

        Returns:
            Transaction count
        """
        pass
