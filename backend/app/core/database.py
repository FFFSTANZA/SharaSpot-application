"""Database connection and utilities for PostgreSQL"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator
from .config import settings
from .db_models import Base

# SQLAlchemy async engine and session maker
engine = None
async_session_maker = None


def get_database_url() -> str:
    """Get the database URL from settings"""
    return settings.DATABASE_URL


async def connect_to_database():
    """Connect to PostgreSQL and create async engine"""
    global engine, async_session_maker

    database_url = get_database_url()

    # Create async engine
    engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,  # Log SQL queries in debug mode
        pool_pre_ping=True,  # Verify connections before using them
        pool_size=10,
        max_overflow=20,
    )

    # Create async session maker
    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    # Create tables if they don't exist (for development)
    # In production, use Alembic migrations instead
    if settings.DEBUG:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)


async def close_database_connection():
    """Close PostgreSQL connection"""
    global engine
    if engine:
        await engine.dispose()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get database session.
    Use this in FastAPI route dependencies.

    Example:
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_session)):
            result = await db.execute(select(User))
            return result.scalars().all()
    """
    if async_session_maker is None:
        raise RuntimeError("Database not initialized. Call connect_to_database() first.")

    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_database():
    """
    Legacy function for backward compatibility.
    Returns the async session maker.

    Note: Prefer using get_session() as a dependency in FastAPI routes.
    """
    return async_session_maker
