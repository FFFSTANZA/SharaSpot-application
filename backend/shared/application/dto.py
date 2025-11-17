"""Data Transfer Objects base class."""

from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class DTO:
    """
    Base class for Data Transfer Objects.

    DTOs are used to transfer data between layers and across boundaries.
    They are simple data structures with no business logic.
    """

    def to_dict(self) -> Dict[str, Any]:
        """Convert DTO to dictionary."""
        return self.__dict__

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DTO":
        """Create DTO from dictionary."""
        return cls(**data)
