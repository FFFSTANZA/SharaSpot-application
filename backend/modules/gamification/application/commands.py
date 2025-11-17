"""Gamification commands (write operations)."""

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from shared.application import Command, CommandHandler
from shared.domain import EventBus
from ..domain.entities import CoinWallet, CoinTransaction
from ..domain.value_objects import TransactionReason
from ..domain.repositories import ICoinWalletRepository, ICoinTransactionRepository


@dataclass
class AwardCoinsCommand(Command):
    """Command to award coins to a user."""

    user_id: UUID
    amount: Decimal
    reason: str
    metadata: dict | None = None


@dataclass
class AwardCoinsResult:
    """Result of awarding coins."""

    transaction_id: UUID
    new_balance: Decimal
    transaction: CoinTransaction


class AwardCoinsHandler(CommandHandler[AwardCoinsCommand, AwardCoinsResult]):
    """Handler for awarding coins."""

    def __init__(
        self,
        wallet_repo: ICoinWalletRepository,
        transaction_repo: ICoinTransactionRepository,
        event_bus: EventBus,
    ):
        self.wallet_repo = wallet_repo
        self.transaction_repo = transaction_repo
        self.event_bus = event_bus

    async def handle(self, command: AwardCoinsCommand) -> AwardCoinsResult:
        """Execute the award coins command."""
        # Get or create wallet
        wallet = await self.wallet_repo.get_or_create(command.user_id)

        # Award coins (domain logic)
        reason = TransactionReason(command.reason)
        transaction = wallet.award_coins(command.amount, reason, command.metadata)

        # Persist changes
        await self.wallet_repo.save(wallet)
        await self.transaction_repo.save(transaction)

        # Publish domain events
        for event in wallet.domain_events:
            await self.event_bus.publish(event)
        wallet.clear_events()

        return AwardCoinsResult(
            transaction_id=transaction.id,
            new_balance=wallet.get_balance(),
            transaction=transaction,
        )


@dataclass
class SpendCoinsCommand(Command):
    """Command to spend coins."""

    user_id: UUID
    amount: Decimal
    reason: str
    metadata: dict | None = None


@dataclass
class SpendCoinsResult:
    """Result of spending coins."""

    transaction_id: UUID
    new_balance: Decimal
    transaction: CoinTransaction


class SpendCoinsHandler(CommandHandler[SpendCoinsCommand, SpendCoinsResult]):
    """Handler for spending coins."""

    def __init__(
        self,
        wallet_repo: ICoinWalletRepository,
        transaction_repo: ICoinTransactionRepository,
        event_bus: EventBus,
    ):
        self.wallet_repo = wallet_repo
        self.transaction_repo = transaction_repo
        self.event_bus = event_bus

    async def handle(self, command: SpendCoinsCommand) -> SpendCoinsResult:
        """Execute the spend coins command."""
        # Get wallet
        wallet = await self.wallet_repo.get_by_user_id(command.user_id)
        if not wallet:
            from shared.domain import NotFoundError

            raise NotFoundError("CoinWallet", str(command.user_id))

        # Spend coins (domain logic)
        reason = TransactionReason(command.reason)
        transaction = wallet.spend_coins(command.amount, reason, command.metadata)

        # Persist changes
        await self.wallet_repo.save(wallet)
        await self.transaction_repo.save(transaction)

        # Publish domain events
        for event in wallet.domain_events:
            await self.event_bus.publish(event)
        wallet.clear_events()

        return SpendCoinsResult(
            transaction_id=transaction.id,
            new_balance=wallet.get_balance(),
            transaction=transaction,
        )
