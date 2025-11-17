"""Query pattern for CQRS implementation."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Generic, TypeVar

TQuery = TypeVar("TQuery")
TResult = TypeVar("TResult")


@dataclass
class Query(ABC):
    """
    Base class for queries in CQRS pattern.

    Queries represent the intention to read data without changing state.
    They should be named with nouns (e.g., UserById, ChargersNearLocation).
    """

    pass


class QueryHandler(ABC, Generic[TQuery, TResult]):
    """
    Base class for query handlers.

    Query handlers execute queries and return data.
    They should not modify system state.
    """

    @abstractmethod
    async def handle(self, query: TQuery) -> TResult:
        """
        Execute the query.

        Args:
            query: The query to execute

        Returns:
            The query result
        """
        pass
