"""Command pattern for CQRS implementation."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Generic, TypeVar

TCommand = TypeVar("TCommand")
TResult = TypeVar("TResult")


@dataclass
class Command(ABC):
    """
    Base class for commands in CQRS pattern.

    Commands represent the intention to change system state.
    They are imperative and should be named with verbs (e.g., CreateUser, UpdateCharger).
    """

    pass


class CommandHandler(ABC, Generic[TCommand, TResult]):
    """
    Base class for command handlers.

    Command handlers execute commands and produce results.
    They contain the business logic for state changes.
    """

    @abstractmethod
    async def handle(self, command: TCommand) -> TResult:
        """
        Execute the command.

        Args:
            command: The command to execute

        Returns:
            The result of the command execution
        """
        pass
