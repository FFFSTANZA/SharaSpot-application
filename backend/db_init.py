"""
Database initialization script for SharaSpot
Addresses P1 issue #6: Database indexing
Addresses P1 issue #8: Session cleanup with TTL
"""

import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URL, DB_NAME, DATABASE_INDEXES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_indexes(db):
    """
    Create all necessary database indexes
    """
    logger.info("Creating database indexes...")

    # Users collection indexes
    logger.info("Creating indexes for 'users' collection...")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    logger.info("✓ Users indexes created")

    # User sessions collection indexes with TTL
    logger.info("Creating indexes for 'user_sessions' collection...")
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    # TTL index - automatically delete expired sessions
    await db.user_sessions.create_index(
        "expires_at",
        expireAfterSeconds=0  # Delete immediately when expires_at is reached
    )
    logger.info("✓ User sessions indexes created (with TTL for auto-cleanup)")

    # Chargers collection indexes
    logger.info("Creating indexes for 'chargers' collection...")
    await db.chargers.create_index("id", unique=True)
    await db.chargers.create_index("added_by")
    await db.chargers.create_index("verification_level")
    await db.chargers.create_index([
        ("latitude", 1),
        ("longitude", 1)
    ])  # Compound index for geospatial queries
    # Create a 2dsphere index for geospatial queries
    await db.chargers.create_index([("latitude", "2dsphere"), ("longitude", "2dsphere")])
    logger.info("✓ Chargers indexes created")

    # Coin transactions collection indexes
    logger.info("Creating indexes for 'coin_transactions' collection...")
    await db.coin_transactions.create_index("id", unique=True)
    await db.coin_transactions.create_index([
        ("user_id", 1),
        ("timestamp", -1)
    ])  # Compound index for user transactions sorted by time
    logger.info("✓ Coin transactions indexes created")

    logger.info("All database indexes created successfully!")


async def verify_indexes(db):
    """
    Verify that all indexes were created successfully
    """
    logger.info("\nVerifying indexes...")

    collections = ['users', 'user_sessions', 'chargers', 'coin_transactions']

    for collection_name in collections:
        collection = db[collection_name]
        indexes = await collection.index_information()

        logger.info(f"\n{collection_name} collection indexes:")
        for index_name, index_info in indexes.items():
            keys = index_info.get('key', [])
            unique = index_info.get('unique', False)
            ttl = index_info.get('expireAfterSeconds', None)

            index_details = f"  - {index_name}: {keys}"
            if unique:
                index_details += " (unique)"
            if ttl is not None:
                index_details += f" (TTL: {ttl}s)"

            logger.info(index_details)


async def cleanup_expired_sessions(db):
    """
    Manual cleanup of expired sessions (TTL index should handle this automatically)
    This is a backup cleanup function
    """
    from datetime import datetime, timezone

    logger.info("\nRunning manual session cleanup...")

    result = await db.user_sessions.delete_many({
        "expires_at": {"$lt": datetime.now(timezone.utc)}
    })

    logger.info(f"✓ Deleted {result.deleted_count} expired sessions")


async def init_database():
    """
    Initialize database with indexes and settings
    """
    logger.info(f"Connecting to MongoDB: {MONGO_URL[:20]}...")

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    try:
        # Test connection
        await db.command('ping')
        logger.info(f"✓ Connected to database: {DB_NAME}")

        # Create indexes
        await create_indexes(db)

        # Verify indexes
        await verify_indexes(db)

        # Run initial cleanup
        await cleanup_expired_sessions(db)

        logger.info("\n" + "=" * 50)
        logger.info("Database initialization completed successfully!")
        logger.info("=" * 50)

    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

    finally:
        client.close()


async def drop_all_indexes(db):
    """
    Drop all indexes (useful for testing/reset)
    WARNING: Use with caution!
    """
    logger.warning("Dropping all indexes...")

    collections = ['users', 'user_sessions', 'chargers', 'coin_transactions']

    for collection_name in collections:
        try:
            # Drop all indexes except _id
            await db[collection_name].drop_indexes()
            logger.info(f"✓ Dropped indexes for {collection_name}")
        except Exception as e:
            logger.error(f"Error dropping indexes for {collection_name}: {str(e)}")


async def reset_database():
    """
    Reset database by dropping and recreating indexes
    WARNING: Use with caution!
    """
    logger.warning("Resetting database indexes...")

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    try:
        await drop_all_indexes(db)
        await create_indexes(db)
        await verify_indexes(db)
        logger.info("Database reset completed!")

    finally:
        client.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        asyncio.run(reset_database())
    else:
        asyncio.run(init_database())
