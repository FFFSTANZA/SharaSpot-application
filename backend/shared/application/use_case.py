"""Use case pattern for application services."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Generic, TypeVar

TRequest = TypeVar("TRequest")
TResponse = TypeVar("TResponse")


@dataclass
class UseCase(ABC):
    """
    Base class for use cases.

    Use cases represent application-specific business rules.
    They orchestrate the flow of data to and from entities.
    """

    pass


class UseCaseHandler(ABC, Generic[TRequest, TResponse]):
    """
    Base class for use case handlers.

    Use case handlers execute use cases and coordinate domain objects.
    """

    @abstractmethod
    async def execute(self, request: TRequest) -> TResponse:
        """
        Execute the use case.

        Args:
            request: The use case request

        Returns:
            The use case response
        """
        pass
