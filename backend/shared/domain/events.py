"""Domain events and event bus for module communication."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Type
from uuid import UUID, uuid4
import asyncio


@dataclass
class DomainEvent(ABC):
    """
    Base class for all domain events.

    Domain events represent something that happened in the domain that
    domain experts care about. They are immutable facts about the past.
    """

    event_id: UUID = field(default_factory=uuid4)
    occurred_at: datetime = field(default_factory=datetime.utcnow)
    aggregate_id: UUID | None = None

    def __post_init__(self):
        """Ensure event_id and occurred_at are set."""
        if not self.event_id:
            self.event_id = uuid4()
        if not self.occurred_at:
            self.occurred_at = datetime.utcnow()


class IEventBus(ABC):
    """Interface for event bus implementations."""

    @abstractmethod
    async def publish(self, event: DomainEvent) -> None:
        """
        Publish a domain event to all subscribers.

        Args:
            event: The domain event to publish
        """
        pass

    @abstractmethod
    def subscribe(
        self, event_type: Type[DomainEvent], handler: Callable[[DomainEvent], Any]
    ) -> None:
        """
        Subscribe to a domain event type.

        Args:
            event_type: The event type to subscribe to
            handler: The handler function to call when event occurs
        """
        pass

    @abstractmethod
    def unsubscribe(
        self, event_type: Type[DomainEvent], handler: Callable[[DomainEvent], Any]
    ) -> None:
        """
        Unsubscribe from a domain event type.

        Args:
            event_type: The event type to unsubscribe from
            handler: The handler function to remove
        """
        pass


class EventBus(IEventBus):
    """
    In-memory event bus implementation.

    This implementation processes events synchronously in the same process.
    For production, consider using a message broker (RabbitMQ, Redis, etc.).
    """

    def __init__(self):
        self._subscribers: Dict[Type[DomainEvent], List[Callable]] = {}
        self._event_history: List[DomainEvent] = []

    async def publish(self, event: DomainEvent) -> None:
        """
        Publish event to all subscribers.

        Subscribers are called asynchronously and errors are logged but don't
        prevent other handlers from executing.
        """
        self._event_history.append(event)

        event_type = type(event)
        handlers = self._subscribers.get(event_type, [])

        if not handlers:
            return

        # Execute all handlers concurrently
        tasks = [self._safe_handle(handler, event) for handler in handlers]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def _safe_handle(self, handler: Callable, event: DomainEvent) -> None:
        """Execute handler with error handling."""
        try:
            if asyncio.iscoroutinefunction(handler):
                await handler(event)
            else:
                handler(event)
        except Exception as e:
            # Log error but don't fail
            print(f"Error in event handler {handler.__name__}: {e}")

    def subscribe(
        self, event_type: Type[DomainEvent], handler: Callable[[DomainEvent], Any]
    ) -> None:
        """Add a subscriber for an event type."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []

        if handler not in self._subscribers[event_type]:
            self._subscribers[event_type].append(handler)

    def unsubscribe(
        self, event_type: Type[DomainEvent], handler: Callable[[DomainEvent], Any]
    ) -> None:
        """Remove a subscriber for an event type."""
        if event_type in self._subscribers:
            try:
                self._subscribers[event_type].remove(handler)
            except ValueError:
                pass

    def clear_subscribers(self) -> None:
        """Clear all subscribers (useful for testing)."""
        self._subscribers.clear()

    def get_event_history(self) -> List[DomainEvent]:
        """Get all published events (useful for testing and debugging)."""
        return self._event_history.copy()

    def clear_history(self) -> None:
        """Clear event history."""
        self._event_history.clear()


# Global event bus instance
_event_bus = EventBus()


def get_event_bus() -> EventBus:
    """Get the global event bus instance."""
    return _event_bus


def event_handler(event_type: Type[DomainEvent]):
    """
    Decorator to register a function as an event handler.

    Usage:
        @event_handler(UserRegistered)
        async def on_user_registered(event: UserRegistered):
            # Handle event
            pass
    """

    def decorator(func: Callable):
        _event_bus.subscribe(event_type, func)
        return func

    return decorator
