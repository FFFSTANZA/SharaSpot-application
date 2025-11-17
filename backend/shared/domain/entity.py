"""Base entity class for domain entities."""

from abc import ABC
from datetime import datetime
from typing import Any, List
from uuid import UUID, uuid4

from .events import DomainEvent


class Entity(ABC):
    """
    Base class for all domain entities.

    An entity has identity and lifecycle. Two entities are considered equal
    if they have the same ID, even if their attributes differ.
    """

    def __init__(self, id: UUID | None = None):
        self._id = id or uuid4()
        self._created_at = datetime.utcnow()
        self._updated_at = datetime.utcnow()
        self._domain_events: List[DomainEvent] = []

    @property
    def id(self) -> UUID:
        """Entity unique identifier."""
        return self._id

    @property
    def created_at(self) -> datetime:
        """Entity creation timestamp."""
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        """Entity last update timestamp."""
        return self._updated_at

    @property
    def domain_events(self) -> List[DomainEvent]:
        """Domain events raised by this entity."""
        return self._domain_events.copy()

    def raise_event(self, event: DomainEvent) -> None:
        """Raise a domain event."""
        self._domain_events.append(event)

    def clear_events(self) -> None:
        """Clear all domain events."""
        self._domain_events.clear()

    def touch(self) -> None:
        """Update the updated_at timestamp."""
        self._updated_at = datetime.utcnow()

    def __eq__(self, other: Any) -> bool:
        """Entities are equal if they have the same ID."""
        if not isinstance(other, Entity):
            return False
        return self._id == other._id

    def __hash__(self) -> int:
        """Hash based on entity ID."""
        return hash(self._id)

    def __repr__(self) -> str:
        """String representation of entity."""
        return f"{self.__class__.__name__}(id={self._id})"
