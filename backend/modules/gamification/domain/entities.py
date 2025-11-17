"""Gamification domain entities."""

from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID

from shared.domain import Entity
from .value_objects import CoinAmount, TransactionReason
from .events import CoinsAwarded, CoinsSpent


class CoinWallet(Entity):
    """
    Coin wallet entity representing a user's coin balance and transaction history.

    This entity ensures business rules around coin transactions are enforced.
    """

    def __init__(
        self,
        user_id: UUID,
        balance: Decimal = Decimal("0"),
        id: UUID | None = None,
    ):
        super().__init__(id)
        self._user_id = user_id
        self._balance = CoinAmount(balance)
        self._transactions: List[CoinTransaction] = []

    @property
    def user_id(self) -> UUID:
        """User ID this wallet belongs to."""
        return self._user_id

    @property
    def balance(self) -> CoinAmount:
        """Current coin balance."""
        return self._balance

    @property
    def transactions(self) -> List["CoinTransaction"]:
        """Transaction history."""
        return self._transactions.copy()

    def award_coins(
        self, amount: Decimal, reason: TransactionReason, metadata: dict | None = None
    ) -> "CoinTransaction":
        """
        Award coins to this wallet.

        Args:
            amount: Amount of coins to award (must be positive)
            reason: Reason for awarding coins
            metadata: Additional transaction metadata

        Returns:
            The created transaction

        Raises:
            ValidationError: If amount is not positive
        """
        coin_amount = CoinAmount(amount)
        if coin_amount.value <= 0:
            from shared.domain import ValidationError

            raise ValidationError("amount", "Must be positive")

        # Create transaction
        transaction = CoinTransaction(
            wallet_id=self.id,
            user_id=self.user_id,
            amount=coin_amount,
            transaction_type="award",
            reason=reason,
            metadata=metadata,
        )

        # Update balance
        self._balance = CoinAmount(self._balance.value + coin_amount.value)
        self._transactions.append(transaction)

        # Raise domain event
        self.raise_event(
            CoinsAwarded(
                aggregate_id=self.id,
                user_id=self.user_id,
                amount=coin_amount.value,
                reason=reason.value,
                new_balance=self._balance.value,
            )
        )

        self.touch()
        return transaction

    def spend_coins(
        self, amount: Decimal, reason: TransactionReason, metadata: dict | None = None
    ) -> "CoinTransaction":
        """
        Spend coins from this wallet.

        Args:
            amount: Amount of coins to spend (must be positive)
            reason: Reason for spending coins
            metadata: Additional transaction metadata

        Returns:
            The created transaction

        Raises:
            ValidationError: If amount is not positive
            BusinessRuleViolationError: If insufficient balance
        """
        coin_amount = CoinAmount(amount)
        if coin_amount.value <= 0:
            from shared.domain import ValidationError

            raise ValidationError("amount", "Must be positive")

        if self._balance.value < coin_amount.value:
            from shared.domain import BusinessRuleViolationError

            raise BusinessRuleViolationError(
                "sufficient_balance",
                f"Insufficient balance. Have {self._balance.value}, need {coin_amount.value}",
            )

        # Create transaction
        transaction = CoinTransaction(
            wallet_id=self.id,
            user_id=self.user_id,
            amount=coin_amount,
            transaction_type="spend",
            reason=reason,
            metadata=metadata,
        )

        # Update balance
        self._balance = CoinAmount(self._balance.value - coin_amount.value)
        self._transactions.append(transaction)

        # Raise domain event
        self.raise_event(
            CoinsSpent(
                aggregate_id=self.id,
                user_id=self.user_id,
                amount=coin_amount.value,
                reason=reason.value,
                new_balance=self._balance.value,
            )
        )

        self.touch()
        return transaction

    def get_balance(self) -> Decimal:
        """Get current balance as Decimal."""
        return self._balance.value


class CoinTransaction(Entity):
    """
    Coin transaction entity representing a single coin award or spend.

    Transactions are immutable once created.
    """

    def __init__(
        self,
        wallet_id: UUID,
        user_id: UUID,
        amount: CoinAmount,
        transaction_type: str,
        reason: TransactionReason,
        metadata: dict | None = None,
        id: UUID | None = None,
    ):
        super().__init__(id)
        self._wallet_id = wallet_id
        self._user_id = user_id
        self._amount = amount
        self._transaction_type = transaction_type
        self._reason = reason
        self._metadata = metadata or {}
        self._transaction_date = datetime.utcnow()

    @property
    def wallet_id(self) -> UUID:
        """Wallet this transaction belongs to."""
        return self._wallet_id

    @property
    def user_id(self) -> UUID:
        """User this transaction belongs to."""
        return self._user_id

    @property
    def amount(self) -> CoinAmount:
        """Transaction amount."""
        return self._amount

    @property
    def transaction_type(self) -> str:
        """Transaction type (award or spend)."""
        return self._transaction_type

    @property
    def reason(self) -> TransactionReason:
        """Transaction reason."""
        return self._reason

    @property
    def metadata(self) -> dict:
        """Additional metadata."""
        return self._metadata.copy()

    @property
    def transaction_date(self) -> datetime:
        """When the transaction occurred."""
        return self._transaction_date
