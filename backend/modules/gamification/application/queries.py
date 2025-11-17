"""Gamification queries (read operations)."""

from dataclasses import dataclass
from decimal import Decimal
from typing import List
from uuid import UUID

from shared.application import Query, QueryHandler, DTO
from ..domain.repositories import ICoinWalletRepository, ICoinTransactionRepository


@dataclass
class GetCoinBalanceQuery(Query):
    """Query to get a user's coin balance."""

    user_id: UUID


@dataclass
class CoinBalanceDTO(DTO):
    """DTO for coin balance."""

    user_id: UUID
    balance: Decimal


class GetCoinBalanceHandler(QueryHandler[GetCoinBalanceQuery, CoinBalanceDTO]):
    """Handler for getting coin balance."""

    def __init__(self, wallet_repo: ICoinWalletRepository):
        self.wallet_repo = wallet_repo

    async def handle(self, query: GetCoinBalanceQuery) -> CoinBalanceDTO:
        """Execute the get balance query."""
        wallet = await self.wallet_repo.get_by_user_id(query.user_id)

        if not wallet:
            # Return zero balance if no wallet exists
            return CoinBalanceDTO(user_id=query.user_id, balance=Decimal("0"))

        return CoinBalanceDTO(user_id=query.user_id, balance=wallet.get_balance())


@dataclass
class GetTransactionsQuery(Query):
    """Query to get a user's transaction history."""

    user_id: UUID
    skip: int = 0
    limit: int = 100


@dataclass
class TransactionDTO(DTO):
    """DTO for coin transaction."""

    id: UUID
    user_id: UUID
    amount: Decimal
    transaction_type: str
    reason: str
    metadata: dict
    created_at: str


@dataclass
class TransactionsDTO(DTO):
    """DTO for transaction list."""

    transactions: List[TransactionDTO]
    total: int


class GetTransactionsHandler(QueryHandler[GetTransactionsQuery, TransactionsDTO]):
    """Handler for getting transactions."""

    def __init__(self, transaction_repo: ICoinTransactionRepository):
        self.transaction_repo = transaction_repo

    async def handle(self, query: GetTransactionsQuery) -> TransactionsDTO:
        """Execute the get transactions query."""
        transactions = await self.transaction_repo.find_by_user_id(
            query.user_id, skip=query.skip, limit=query.limit
        )

        total = await self.transaction_repo.count_by_user(query.user_id)

        transaction_dtos = [
            TransactionDTO(
                id=tx.id,
                user_id=tx.user_id,
                amount=tx.amount.value,
                transaction_type=tx.transaction_type,
                reason=tx.reason.value,
                metadata=tx.metadata,
                created_at=tx.created_at.isoformat(),
            )
            for tx in transactions
        ]

        return TransactionsDTO(transactions=transaction_dtos, total=total)
