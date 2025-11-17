"""
Dependency Injection Container.

This module provides a simple dependency injection container for managing
application dependencies and their lifecycles.
"""

from typing import Any, Callable, Dict, Type, TypeVar

T = TypeVar("T")


class Container:
    """
    Simple dependency injection container.

    Supports:
    - Singleton: Same instance returned every time
    - Transient: New instance created every time
    - Factory: Custom factory function
    """

    def __init__(self):
        self._singletons: Dict[Type, Any] = {}
        self._transients: Dict[Type, Callable] = {}
        self._factories: Dict[Type, Callable] = {}

    def register_singleton(self, interface: Type[T], implementation: T) -> None:
        """
        Register a singleton instance.

        Args:
            interface: The interface type
            implementation: The instance to return
        """
        self._singletons[interface] = implementation

    def register_transient(
        self, interface: Type[T], factory: Callable[..., T]
    ) -> None:
        """
        Register a transient dependency.

        Args:
            interface: The interface type
            factory: Factory function to create instances
        """
        self._transients[interface] = factory

    def register_factory(self, interface: Type[T], factory: Callable[..., T]) -> None:
        """
        Register a factory function.

        Args:
            interface: The interface type
            factory: Factory function to create instances
        """
        self._factories[interface] = factory

    def resolve(self, interface: Type[T]) -> T:
        """
        Resolve a dependency.

        Args:
            interface: The interface type to resolve

        Returns:
            The resolved instance

        Raises:
            KeyError: If dependency is not registered
        """
        # Check singletons first
        if interface in self._singletons:
            return self._singletons[interface]

        # Check factories
        if interface in self._factories:
            instance = self._factories[interface](self)
            return instance

        # Check transients
        if interface in self._transients:
            return self._transients[interface](self)

        raise KeyError(f"Dependency {interface} not registered")

    def clear(self) -> None:
        """Clear all registrations (useful for testing)."""
        self._singletons.clear()
        self._transients.clear()
        self._factories.clear()


# Global container instance
_container = Container()


def get_container() -> Container:
    """Get the global container instance."""
    return _container


def configure_container() -> Container:
    """
    Configure the dependency injection container.

    This function sets up all application dependencies.
    It should be called during application startup.
    """
    from shared.domain.events import EventBus, get_event_bus

    container = get_container()

    # Register infrastructure services
    container.register_singleton(EventBus, get_event_bus())

    # Repositories will be registered by each module

    return container
