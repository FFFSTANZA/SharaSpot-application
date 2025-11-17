"""Database connection and utilities"""
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# MongoDB client and database
client: AsyncIOMotorClient = None
db = None


def get_database():
    """Get database instance"""
    return db


async def connect_to_database():
    """Connect to MongoDB"""
    global client, db
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DB_NAME]


async def close_database_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
