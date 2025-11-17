# MongoDB to PostgreSQL Migration Guide

This document provides instructions for completing the database migration from MongoDB to PostgreSQL.

## ✅ Completed Steps

1. **Dependencies Updated** - Added SQLAlchemy, asyncpg, Alembic, psycopg2-binary
2. **SQLAlchemy Models Created** - New database models in `app/core/db_models.py`
3. **Database Configuration** - Updated `app/core/database.py` for PostgreSQL
4. **Alembic Setup** - Migration framework configured with initial migration
5. **Services Updated** - All service files migrated to use SQLAlchemy:
   - `auth_service.py`
   - `charger_service.py`
   - `gamification_service.py`
   - `profile_service.py`
   - `routing_service.py`
6. **Security Module Updated** - `security.py` migrated to SQLAlchemy

## 🔧 Remaining Steps

### 1. Update API Route Files

All API route files need to be updated to inject the `AsyncSession` dependency and pass it to services:

#### Pattern to Follow:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.database import get_session
from ..core.security import get_user_from_session

router = APIRouter()

@router.post("/example")
async def example_endpoint(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session)
):
    # Pass db to service functions
    result = await some_service_function(user, data, db)
    return result
```

####Files to Update:
- `backend/app/api/auth.py` - Add `db: AsyncSession = Depends(get_session)` to all endpoints
- `backend/app/api/chargers.py` - Add db parameter to all endpoints
- `backend/app/api/profile.py` - Add db parameter to all endpoints
- `backend/app/api/routing.py` - Add db parameter to all endpoints

### 2. Update Main Application File

Update `backend/main.py`:
- Keep `connect_to_database()` and `close_database_connection()` calls (they now connect to PostgreSQL)
- Remove/update any MongoDB-specific initialization code
- Remove `initialize_database()` call (Alembic handles migrations now)

### 3. Update Environment Configuration

Create/update `.env.example`:
```env
# PostgreSQL Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/sharaspot
DEBUG=False

# HERE Maps API
HERE_API_KEY=your_key_here

# Optional: MongoDB (for data migration only)
# MONGO_URL=mongodb://localhost:27017
```

### 4. Set Up PostgreSQL Database

```bash
# Install PostgreSQL if needed
# On Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# Create database
createdb sharaspot

# Or using psql:
psql -U postgres
CREATE DATABASE sharaspot;
\q
```

### 5. Run Database Migrations

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations to create tables
alembic upgrade head
```

### 6. Optional: Migrate Existing Data

If you have existing MongoDB data to migrate:

```python
# backend/scripts/migrate_data.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.core.config import settings
from app.core.db_models import User, Charger, CoinTransaction, VerificationAction

async def migrate_data():
    # Connect to MongoDB
    mongo_client = AsyncIOMotorClient(settings.MONGO_URL)
    mongo_db = mongo_client[settings.DB_NAME]

    # Connect to PostgreSQL
    engine = create_async_engine(settings.DATABASE_URL)

    # Migrate users, chargers, transactions, etc.
    # ... implementation here ...

if __name__ == "__main__":
    asyncio.run(migrate_data())
```

## 📊 Schema Changes

### Key Differences from MongoDB:

1. **Primary Keys**: UUIDs are now proper string primary keys
2. **Relationships**: Foreign keys enforce referential integrity
   - Users → Chargers (one-to-many)
   - Users → Sessions (one-to-many)
   - Users → CoinTransactions (one-to-many)
   - Chargers → VerificationActions (one-to-many)

3. **Indexes**: Proper database indexes for performance
   - `idx_charger_location` - Geospatial queries
   - `idx_verification_charger_timestamp` - Verification history
   - `idx_coin_transaction_user_timestamp` - Transaction history

4. **Constraints**: Data integrity enforced at database level
   - NOT NULL constraints
   - UNIQUE constraints on emails, session tokens
   - CASCADE deletes for related records

## 🧪 Testing

After migration:

1. **Test Authentication**:
   - Sign up new user
   - Login
   - Session management

2. **Test Charger Operations**:
   - Create charger
   - Verify charger
   - List chargers with filters

3. **Test Gamification**:
   - Coin transactions
   - Trust score calculations

4. **Test Routing**:
   - Calculate routes
   - Find chargers along route

## 🔄 Rollback Plan

If issues occur:

1. Keep MongoDB connection string in environment
2. Restore MongoDB code from git history if needed
3. Keep existing MongoDB data until migration is verified

## 📝 Notes

- All services now use SQLAlchemy async sessions
- Database sessions are automatically managed via FastAPI dependency injection
- Transactions are automatically committed/rolled back
- Connection pooling is configured (pool_size=10, max_overflow=20)
