"""Database session management."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings


# Create async engine
engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=settings.DEBUG,
    poolclass=NullPool if settings.TESTING else None,
    pool_pre_ping=True,
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class DatabaseSession:
    """
    Database session wrapper.

    Provides a clean interface for database operations and ensures
    proper resource management.
    """

    def __init__(self, session: AsyncSession):
        self._session = session

    @property
    def session(self) -> AsyncSession:
        """Get the underlying SQLAlchemy session."""
        return self._session

    async def commit(self) -> None:
        """Commit the current transaction."""
        await self._session.commit()

    async def rollback(self) -> None:
        """Rollback the current transaction."""
        await self._session.rollback()

    async def flush(self) -> None:
        """Flush pending changes."""
        await self._session.flush()

    async def refresh(self, instance) -> None:
        """Refresh an instance from the database."""
        await self._session.refresh(instance)

    async def close(self) -> None:
        """Close the session."""
        await self._session.close()


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[DatabaseSession, None]:
    """
    Get a database session.

    Usage:
        async with get_db_session() as db:
            # Use db
            await db.commit()
    """
    session = AsyncSessionLocal()
    try:
        yield DatabaseSession(session)
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI endpoints.

    Usage:
        @router.get("/users")
        async def get_users(db: AsyncSession = Depends(get_session)):
            # Use db
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
