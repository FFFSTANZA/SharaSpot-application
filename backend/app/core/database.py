"""Database connection and utilities for PostgreSQL"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator
from .config import settings
from .db_models import Base

# SQLAlchemy async engine and session maker
engine = None
read_engine = None
async_session_maker = None
async_read_session_maker = None


def get_database_url() -> str:
    """Get the database URL from settings"""
    return settings.DATABASE_URL


def get_read_database_url() -> str:
    """Get the read replica database URL from settings"""
    return settings.DATABASE_READ_REPLICA_URL or settings.DATABASE_URL


async def connect_to_database():
    """Connect to PostgreSQL and create async engine with optimized connection pooling"""
    global engine, read_engine, async_session_maker, async_read_session_maker

    database_url = get_database_url()

    # Create primary async engine with optimized pool settings
    engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,  # Log SQL queries in debug mode
        pool_pre_ping=True,  # Verify connections before using them
        pool_size=settings.DB_POOL_SIZE,  # Configurable pool size (default: 20)
        max_overflow=settings.DB_MAX_OVERFLOW,  # Configurable overflow (default: 40)
        pool_timeout=settings.DB_POOL_TIMEOUT,  # Connection timeout (default: 30s)
        pool_recycle=settings.DB_POOL_RECYCLE,  # Recycle connections after 1 hour
    )

    # Create async session maker for write operations
    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    # Create read replica engine if configured
    if settings.USE_READ_REPLICA and settings.DATABASE_READ_REPLICA_URL:
        read_database_url = get_read_database_url()
        read_engine = create_async_engine(
            read_database_url,
            echo=settings.DEBUG,
            pool_pre_ping=True,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT,
            pool_recycle=settings.DB_POOL_RECYCLE,
        )

        # Create async session maker for read operations
        async_read_session_maker = async_sessionmaker(
            read_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    else:
        # Use primary engine for reads if no replica configured
        async_read_session_maker = async_session_maker

    # Create tables if they don't exist (for development)
    # In production, use Alembic migrations instead
    if settings.DEBUG:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)


async def close_database_connection():
    """Close PostgreSQL connections for both primary and read replica"""
    global engine, read_engine
    if engine:
        await engine.dispose()
    if read_engine:
        await read_engine.dispose()


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


async def get_read_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get read-only database session.
    Uses read replica if configured, otherwise uses primary database.
    Use this for read-heavy operations to reduce load on primary database.

    Example:
        @app.get("/chargers")
        async def get_chargers(db: AsyncSession = Depends(get_read_session)):
            result = await db.execute(select(Charger).limit(100))
            return result.scalars().all()
    """
    if async_read_session_maker is None:
        raise RuntimeError("Database not initialized. Call connect_to_database() first.")

    async with async_read_session_maker() as session:
        try:
            yield session
            # Read sessions don't need commit
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
