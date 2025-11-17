"""Unit of Work pattern implementation."""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from .session import AsyncSessionLocal


class UnitOfWork:
    """
    Unit of Work pattern implementation.

    Maintains a list of objects affected by a business transaction and
    coordinates the writing out of changes and the resolution of concurrency problems.

    Usage:
        async with UnitOfWork() as uow:
            user = await user_repo.get_by_id(user_id)
            user.update_email(new_email)
            await user_repo.save(user)
            await uow.commit()
    """

    def __init__(self):
        self._session: Optional[AsyncSession] = None

    @property
    def session(self) -> AsyncSession:
        """Get the current session."""
        if self._session is None:
            raise RuntimeError("UnitOfWork session not initialized")
        return self._session

    async def __aenter__(self) -> "UnitOfWork":
        """Enter the context manager and create a new session."""
        self._session = AsyncSessionLocal()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """
        Exit the context manager.

        If an exception occurred, rollback the transaction.
        Otherwise, the transaction should be committed explicitly.
        """
        if exc_type is not None:
            await self.rollback()

        if self._session is not None:
            await self._session.close()
            self._session = None

    async def commit(self) -> None:
        """Commit the current transaction."""
        if self._session is None:
            raise RuntimeError("UnitOfWork session not initialized")
        await self._session.commit()

    async def rollback(self) -> None:
        """Rollback the current transaction."""
        if self._session is None:
            raise RuntimeError("UnitOfWork session not initialized")
        await self._session.rollback()

    async def flush(self) -> None:
        """Flush pending changes without committing."""
        if self._session is None:
            raise RuntimeError("UnitOfWork session not initialized")
        await self._session.flush()

    async def refresh(self, instance) -> None:
        """Refresh an instance from the database."""
        if self._session is None:
            raise RuntimeError("UnitOfWork session not initialized")
        await self._session.refresh(instance)
