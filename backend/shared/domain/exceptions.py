"""Domain exceptions."""


class DomainException(Exception):
    """Base exception for all domain-related errors."""

    def __init__(self, message: str, *args, **kwargs):
        self.message = message
        super().__init__(message, *args, **kwargs)


class ValidationError(DomainException):
    """Raised when domain validation fails."""

    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(f"Validation error for {field}: {message}")


class NotFoundError(DomainException):
    """Raised when an entity is not found."""

    def __init__(self, entity_type: str, entity_id: str):
        self.entity_type = entity_type
        self.entity_id = entity_id
        super().__init__(f"{entity_type} with id {entity_id} not found")


class ConflictError(DomainException):
    """Raised when there's a conflict (e.g., duplicate entity)."""

    def __init__(self, message: str):
        super().__init__(message)


class UnauthorizedError(DomainException):
    """Raised when user is not authorized for an action."""

    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message)


class ForbiddenError(DomainException):
    """Raised when action is forbidden."""

    def __init__(self, message: str = "Forbidden"):
        super().__init__(message)


class BusinessRuleViolationError(DomainException):
    """Raised when a business rule is violated."""

    def __init__(self, rule: str, message: str):
        self.rule = rule
        super().__init__(f"Business rule '{rule}' violated: {message}")
