"""Repository interface for data persistence."""

from abc import ABC, abstractmethod
from typing import Generic, List, Optional, TypeVar
from uuid import UUID

from .entity import Entity

T = TypeVar("T", bound=Entity)


class Repository(ABC, Generic[T]):
    """
    Abstract repository interface for entity persistence.

    Repositories provide collection-like interface for accessing domain objects.
    They encapsulate the logic required to access data sources and provide
    abstraction over the persistence mechanism.
    """

    @abstractmethod
    async def get_by_id(self, id: UUID) -> Optional[T]:
        """
        Retrieve an entity by its ID.

        Args:
            id: The entity ID

        Returns:
            The entity if found, None otherwise
        """
        pass

    @abstractmethod
    async def find_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """
        Retrieve all entities with pagination.

        Args:
            skip: Number of entities to skip
            limit: Maximum number of entities to return

        Returns:
            List of entities
        """
        pass

    @abstractmethod
    async def save(self, entity: T) -> T:
        """
        Persist an entity (create or update).

        Args:
            entity: The entity to persist

        Returns:
            The persisted entity
        """
        pass

    @abstractmethod
    async def delete(self, id: UUID) -> None:
        """
        Delete an entity by its ID.

        Args:
            id: The entity ID
        """
        pass

    @abstractmethod
    async def exists(self, id: UUID) -> bool:
        """
        Check if an entity exists.

        Args:
            id: The entity ID

        Returns:
            True if entity exists, False otherwise
        """
        pass

    @abstractmethod
    async def count(self) -> int:
        """
        Count total number of entities.

        Returns:
            Total count
        """
        pass
