# Backend Enhancement Recommendations

## Overview

This document outlines **strategic enhancements** to transform the SharaSpot backend from a functional MVP into a **scalable, production-ready, enterprise-grade platform**. Enhancements are prioritized by impact and organized into architectural, feature, and operational improvements.

**Current Backend:** FastAPI (1,174 lines in single file) + MongoDB

---

## 🏗️ Architectural Enhancements

### 1. **Modular Architecture Refactoring**

**Current State:** Monolithic single file (`server.py` - 1,174 lines)

**Proposed Structure:**
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Configuration management
│   ├── dependencies.py         # Dependency injection
│   │
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Authentication routes
│   │   │   ├── chargers.py     # Charger management routes
│   │   │   ├── profile.py      # User profile routes
│   │   │   ├── routing.py      # Smart routing routes
│   │   │   └── wallet.py       # Gamification/wallet routes
│   │   └── deps.py             # Route dependencies
│   │
│   ├── core/                   # Core functionality
│   │   ├── __init__.py
│   │   ├── security.py         # Auth, hashing, JWT
│   │   ├── config.py           # Settings management
│   │   └── constants.py        # App-wide constants
│   │
│   ├── db/                     # Database layer
│   │   ├── __init__.py
│   │   ├── mongodb.py          # MongoDB connection
│   │   ├── redis.py            # Redis cache (NEW)
│   │   └── migrations/         # Database migrations (NEW)
│   │
│   ├── models/                 # Data models
│   │   ├── __init__.py
│   │   ├── user.py             # User models
│   │   ├── charger.py          # Charger models
│   │   ├── session.py          # Session models
│   │   └── transaction.py      # Transaction models
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py             # User request/response schemas
│   │   ├── charger.py          # Charger schemas
│   │   ├── auth.py             # Auth schemas
│   │   └── common.py           # Shared schemas
│   │
│   ├── services/               # Business logic (NEW)
│   │   ├── __init__.py
│   │   ├── auth_service.py     # Authentication logic
│   │   ├── charger_service.py  # Charger operations
│   │   ├── gamification_service.py  # Coin rewards
│   │   ├── verification_service.py  # Verification logic
│   │   ├── routing_service.py  # HERE API integration
│   │   ├── s3_service.py       # Image upload (NEW)
│   │   └── notification_service.py  # Push notifications (NEW)
│   │
│   ├── utils/                  # Utility functions
│   │   ├── __init__.py
│   │   ├── validators.py       # Custom validators
│   │   ├── helpers.py          # Helper functions
│   │   └── formatters.py       # Data formatting
│   │
│   └── middleware/             # Custom middleware (NEW)
│       ├── __init__.py
│       ├── logging.py          # Request logging
│       ├── rate_limit.py       # Rate limiting
│       └── error_handler.py    # Error handling
│
├── tests/                      # Test suite (NEW)
│   ├── __init__.py
│   ├── conftest.py             # Pytest fixtures
│   ├── unit/                   # Unit tests
│   │   ├── test_auth.py
│   │   ├── test_chargers.py
│   │   └── test_gamification.py
│   ├── integration/            # Integration tests
│   │   ├── test_api.py
│   │   └── test_database.py
│   └── e2e/                    # End-to-end tests
│       └── test_user_flow.py
│
├── scripts/                    # Utility scripts (NEW)
│   ├── seed_database.py        # Seed test data
│   ├── migrate.py              # Run migrations
│   └── cleanup.py              # Cleanup tasks
│
├── alembic/                    # Database migrations (NEW)
│   ├── versions/
│   └── env.py
│
├── Dockerfile                  # Container definition (NEW)
├── docker-compose.yml          # Local development (NEW)
├── .env.example                # Environment template (NEW)
├── requirements.txt            # Production dependencies
├── requirements-dev.txt        # Development dependencies (NEW)
├── pytest.ini                  # Pytest configuration (NEW)
└── README.md                   # Backend documentation
```

**Benefits:**
- ✅ Separation of concerns
- ✅ Easier testing
- ✅ Better collaboration (multiple developers)
- ✅ Clearer code ownership
- ✅ Reduced merge conflicts

**Implementation Priority:** 🔴 High - Foundational change

---

### 2. **Dependency Injection Pattern**

**Implement FastAPI dependency injection for cleaner code**

```python
# app/dependencies.py
from typing import AsyncGenerator
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database

async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Dependency for database access"""
    db = await get_database()
    try:
        yield db
    finally:
        pass  # Cleanup if needed

async def get_current_user(
    authorization: str = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> dict:
    """Dependency for authentication"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")
    session = await db.user_sessions.find_one({"session_token": token})

    if not session or session["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid session")

    user = await db.users.find_one({"id": session["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

async def require_verified_user(
    user: dict = Depends(get_current_user)
) -> dict:
    """Dependency to ensure user is not a guest"""
    if user.get("is_guest"):
        raise HTTPException(
            status_code=403,
            detail="This action requires a full account"
        )
    return user

# Usage in routes
@router.post("/chargers")
async def add_charger(
    charger: ChargerCreate,
    user: dict = Depends(require_verified_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # User is guaranteed to be authenticated and verified
    # Database connection is injected
    pass
```

**Benefits:**
- ✅ Cleaner route handlers
- ✅ Reusable auth logic
- ✅ Easy to test (mock dependencies)
- ✅ Clear requirements per endpoint

---

### 3. **Repository Pattern for Database Access**

**Abstract database operations into repositories**

```python
# app/repositories/base_repository.py
from typing import Generic, TypeVar, Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from abc import ABC, abstractmethod

T = TypeVar('T')

class BaseRepository(Generic[T], ABC):
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str):
        self.db = db
        self.collection = db[collection_name]

    async def create(self, data: dict) -> str:
        """Create a new document"""
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def find_by_id(self, id: str) -> Optional[dict]:
        """Find document by ID"""
        return await self.collection.find_one({"id": id})

    async def find_many(self, query: dict, limit: int = 100) -> List[dict]:
        """Find multiple documents"""
        cursor = self.collection.find(query).limit(limit)
        return await cursor.to_list(length=limit)

    async def update(self, id: str, data: dict) -> bool:
        """Update a document"""
        result = await self.collection.update_one(
            {"id": id},
            {"$set": data}
        )
        return result.modified_count > 0

    async def delete(self, id: str) -> bool:
        """Delete a document"""
        result = await self.collection.delete_one({"id": id})
        return result.deleted_count > 0

# app/repositories/charger_repository.py
from app.repositories.base_repository import BaseRepository

class ChargerRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "chargers")

    async def find_nearby(
        self,
        latitude: float,
        longitude: float,
        max_distance_meters: int = 5000
    ) -> List[dict]:
        """Find chargers within radius"""
        return await self.collection.find({
            "location": {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [longitude, latitude]
                    },
                    "$maxDistance": max_distance_meters
                }
            }
        }).to_list(length=50)

    async def find_by_verification_level(self, level: int) -> List[dict]:
        """Find chargers by verification level"""
        return await self.find_many({"verification_level": level})

    async def increment_verifications(self, charger_id: str) -> bool:
        """Increment verification count"""
        result = await self.collection.update_one(
            {"id": charger_id},
            {"$inc": {"verified_by_count": 1}}
        )
        return result.modified_count > 0

# Usage in service
class ChargerService:
    def __init__(self, charger_repo: ChargerRepository):
        self.charger_repo = charger_repo

    async def get_nearby_chargers(self, lat: float, lng: float):
        return await self.charger_repo.find_nearby(lat, lng, 5000)
```

**Benefits:**
- ✅ Testable (mock repositories)
- ✅ Reusable database queries
- ✅ Single source of truth for data access
- ✅ Easy to swap database implementations

---

### 4. **Service Layer for Business Logic**

**Extract business logic from routes into services**

```python
# app/services/gamification_service.py
from app.core.constants import RewardConstants
from app.repositories.user_repository import UserRepository
from app.repositories.transaction_repository import TransactionRepository

class GamificationService:
    def __init__(
        self,
        user_repo: UserRepository,
        transaction_repo: TransactionRepository
    ):
        self.user_repo = user_repo
        self.transaction_repo = transaction_repo

    async def award_coins(
        self,
        user_id: str,
        action: str,
        amount: int,
        description: str
    ) -> dict:
        """Award coins to user and record transaction"""
        # Update user balance
        user = await self.user_repo.find_by_id(user_id)
        new_balance = user["shara_coins"] + amount
        await self.user_repo.update(user_id, {"shara_coins": new_balance})

        # Record transaction
        transaction = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "action": action,
            "amount": amount,
            "description": description,
            "timestamp": datetime.now(timezone.utc)
        }
        await self.transaction_repo.create(transaction)

        return {
            "previous_balance": user["shara_coins"],
            "amount_awarded": amount,
            "new_balance": new_balance,
            "transaction_id": transaction["id"]
        }

    async def calculate_trust_score(self, user_id: str) -> int:
        """Calculate user trust score based on activity"""
        user = await self.user_repo.find_by_id(user_id)

        score = 0
        score += user.get("chargers_added", 0) * 10
        score += user.get("verifications_count", 0) * 2
        score += user.get("photos_uploaded", 0) * 3

        # Cap at 100
        return min(100, score)

    async def redeem_coins(
        self,
        user_id: str,
        amount: int,
        coupon_id: str
    ) -> dict:
        """Redeem coins for coupon"""
        user = await self.user_repo.find_by_id(user_id)

        if user["shara_coins"] < amount:
            raise ValueError("Insufficient coins")

        # Deduct coins
        new_balance = user["shara_coins"] - amount
        await self.user_repo.update(user_id, {"shara_coins": new_balance})

        # Record redemption
        transaction = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "action": "redeem_coupon",
            "amount": -amount,
            "description": f"Redeemed {amount} coins for coupon {coupon_id}",
            "timestamp": datetime.now(timezone.utc),
            "metadata": {"coupon_id": coupon_id}
        }
        await self.transaction_repo.create(transaction)

        return {
            "previous_balance": user["shara_coins"],
            "amount_redeemed": amount,
            "new_balance": new_balance,
            "coupon_id": coupon_id
        }
```

**Benefits:**
- ✅ Business logic separated from HTTP layer
- ✅ Reusable across multiple routes
- ✅ Easy to test
- ✅ Clear domain boundaries

---

## 🚀 Feature Enhancements

### 5. **Real Image Upload to AWS S3**

**Replace base64 image storage with S3**

```python
# app/services/s3_service.py
import boto3
from botocore.exceptions import ClientError
from PIL import Image
import io

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket_name = settings.AWS_S3_BUCKET

    async def upload_charger_photo(
        self,
        file_bytes: bytes,
        charger_id: str,
        user_id: str
    ) -> str:
        """
        Upload charger photo to S3
        Returns: Public URL of uploaded image
        """
        # Optimize image
        optimized = await self._optimize_image(file_bytes)

        # Generate unique filename
        filename = f"chargers/{charger_id}/{uuid.uuid4()}.jpg"

        # Upload to S3
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=optimized,
                ContentType='image/jpeg',
                Metadata={
                    'uploaded_by': user_id,
                    'charger_id': charger_id,
                },
                ACL='public-read'  # Or use CloudFront for better control
            )

            # Return public URL
            url = f"https://{self.bucket_name}.s3.amazonaws.com/{filename}"
            return url

        except ClientError as e:
            raise Exception(f"Failed to upload image: {str(e)}")

    async def _optimize_image(self, file_bytes: bytes) -> bytes:
        """Optimize image (resize, compress)"""
        # Open image
        image = Image.open(io.BytesIO(file_bytes))

        # Resize if too large
        max_size = (1920, 1080)
        if image.width > max_size[0] or image.height > max_size[1]:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)

        # Convert to RGB if needed
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')

        # Compress
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)

        return output.read()

    async def delete_charger_photo(self, photo_url: str) -> bool:
        """Delete photo from S3"""
        # Extract key from URL
        key = photo_url.replace(
            f"https://{self.bucket_name}.s3.amazonaws.com/",
            ""
        )

        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            return True
        except ClientError:
            return False

# Usage in route
@router.post("/chargers/{charger_id}/photos")
async def upload_photo(
    charger_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    s3_service: S3Service = Depends()
):
    # Read file bytes
    file_bytes = await file.read()

    # Upload to S3
    photo_url = await s3_service.upload_charger_photo(
        file_bytes,
        charger_id,
        user["id"]
    )

    # Update charger in database
    await db.chargers.update_one(
        {"id": charger_id},
        {"$push": {"photos": photo_url}}
    )

    # Award coins
    await gamification_service.award_coins(
        user["id"],
        "upload_photo",
        RewardConstants.COINS_UPLOAD_PHOTO,
        f"Uploaded photo for {charger_id}"
    )

    return {"photo_url": photo_url}
```

**Configuration:**
```env
# .env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=sharaspot-charger-images
```

**Benefits:**
- ✅ Reduced database size (no base64)
- ✅ Faster API responses
- ✅ CDN distribution via CloudFront
- ✅ Image optimization built-in

---

### 6. **Caching Layer with Redis**

**Add Redis for performance optimization**

```python
# app/db/redis.py
import redis.asyncio as redis
import json
from typing import Optional

class RedisCache:
    def __init__(self):
        self.redis = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )

    async def get(self, key: str) -> Optional[dict]:
        """Get cached value"""
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None

    async def set(self, key: str, value: dict, ttl: int = 300):
        """Set cached value with TTL (seconds)"""
        await self.redis.setex(
            key,
            ttl,
            json.dumps(value)
        )

    async def delete(self, key: str):
        """Delete cached value"""
        await self.redis.delete(key)

    async def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern"""
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

# Usage in service
class ChargerService:
    def __init__(self, charger_repo, cache: RedisCache):
        self.charger_repo = charger_repo
        self.cache = cache

    async def get_charger(self, charger_id: str) -> dict:
        """Get charger (with caching)"""
        # Check cache first
        cache_key = f"charger:{charger_id}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        # Query database
        charger = await self.charger_repo.find_by_id(charger_id)

        # Cache result (5 minutes)
        if charger:
            await self.cache.set(cache_key, charger, ttl=300)

        return charger

    async def update_charger(self, charger_id: str, data: dict):
        """Update charger and invalidate cache"""
        await self.charger_repo.update(charger_id, data)

        # Invalidate cache
        await self.cache.delete(f"charger:{charger_id}")
        await self.cache.invalidate_pattern("chargers:list:*")
```

**Cache Strategy:**
```python
# Cache keys and TTLs
CACHE_CONFIG = {
    "charger_detail": {
        "key": "charger:{charger_id}",
        "ttl": 300  # 5 minutes
    },
    "charger_list": {
        "key": "chargers:list:{filter_hash}",
        "ttl": 60  # 1 minute
    },
    "user_profile": {
        "key": "user:{user_id}:profile",
        "ttl": 600  # 10 minutes
    },
    "user_stats": {
        "key": "user:{user_id}:stats",
        "ttl": 300  # 5 minutes
    },
    "verification_level": {
        "key": "charger:{charger_id}:level",
        "ttl": 180  # 3 minutes
    }
}
```

**Benefits:**
- ✅ Faster API responses (cache hits)
- ✅ Reduced database load
- ✅ Better scalability
- ✅ Lower costs

---

### 7. **Real-Time Updates with WebSockets**

**Add WebSocket support for live charger status**

```python
# app/api/v1/websocket.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set

class ConnectionManager:
    def __init__(self):
        # Map charger_id to set of connected clients
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, charger_id: str):
        """Accept WebSocket connection"""
        await websocket.accept()

        if charger_id not in self.active_connections:
            self.active_connections[charger_id] = set()

        self.active_connections[charger_id].add(websocket)

    def disconnect(self, websocket: WebSocket, charger_id: str):
        """Remove WebSocket connection"""
        if charger_id in self.active_connections:
            self.active_connections[charger_id].discard(websocket)

    async def broadcast(self, charger_id: str, message: dict):
        """Broadcast message to all connected clients"""
        if charger_id not in self.active_connections:
            return

        disconnected = set()

        for connection in self.active_connections[charger_id]:
            try:
                await connection.send_json(message)
            except:
                disconnected.add(connection)

        # Remove disconnected clients
        for conn in disconnected:
            self.active_connections[charger_id].discard(conn)

manager = ConnectionManager()

@router.websocket("/ws/chargers/{charger_id}")
async def charger_updates(websocket: WebSocket, charger_id: str):
    """WebSocket endpoint for real-time charger updates"""
    await manager.connect(websocket, charger_id)

    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, charger_id)

# Trigger updates when charger status changes
@router.post("/chargers/{charger_id}/verify")
async def verify_charger(charger_id: str, verification: VerificationCreate):
    # ... existing verification logic

    # Broadcast update to connected clients
    await manager.broadcast(charger_id, {
        "type": "verification_update",
        "charger_id": charger_id,
        "verification_level": new_level,
        "verified_by_count": verified_by_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return result
```

**Frontend Usage:**
```typescript
// Connect to WebSocket
const ws = new WebSocket(`ws://localhost:8000/ws/chargers/${chargerId}`);

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);

  if (update.type === 'verification_update') {
    // Update UI with new verification level
    setVerificationLevel(update.verification_level);
    setVerifiedByCount(update.verified_by_count);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
  // Attempt reconnection
};
```

**Benefits:**
- ✅ Real-time charger status updates
- ✅ No polling required
- ✅ Reduced server load
- ✅ Better user experience

---

### 8. **Advanced Search with Elasticsearch** (Future)

**Add full-text search capabilities**

```python
# app/services/search_service.py
from elasticsearch import AsyncElasticsearch

class SearchService:
    def __init__(self):
        self.es = AsyncElasticsearch([settings.ELASTICSEARCH_URL])

    async def index_charger(self, charger: dict):
        """Index charger for search"""
        await self.es.index(
            index="chargers",
            id=charger["id"],
            document={
                "name": charger["name"],
                "address": charger["address"],
                "amenities": charger["amenities"],
                "port_types": charger["port_types"],
                "verification_level": charger["verification_level"],
                "location": {
                    "lat": charger["latitude"],
                    "lon": charger["longitude"]
                }
            }
        )

    async def search_chargers(
        self,
        query: str,
        latitude: float = None,
        longitude: float = None,
        radius_km: int = 10
    ) -> List[dict]:
        """Search chargers with text and location"""
        search_query = {
            "bool": {
                "must": [
                    {
                        "multi_match": {
                            "query": query,
                            "fields": ["name^2", "address", "amenities"],
                            "fuzziness": "AUTO"
                        }
                    }
                ]
            }
        }

        # Add geo filter if location provided
        if latitude and longitude:
            search_query["bool"]["filter"] = {
                "geo_distance": {
                    "distance": f"{radius_km}km",
                    "location": {
                        "lat": latitude,
                        "lon": longitude
                    }
                }
            }

        result = await self.es.search(
            index="chargers",
            query=search_query,
            size=50
        )

        return [hit["_source"] for hit in result["hits"]["hits"]]
```

**Benefits:**
- ✅ Fast full-text search
- ✅ Fuzzy matching (typo tolerance)
- ✅ Geo-spatial search
- ✅ Faceted search (filters)

---

## 🔒 Security Enhancements

### 9. **OAuth 2.0 Integration**

**Implement proper OAuth flow for Google/Apple Sign-In**

```python
# app/core/oauth.py
from authlib.integrations.starlette_client import OAuth

oauth = OAuth()

# Google OAuth
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# Apple OAuth
oauth.register(
    name='apple',
    client_id=settings.APPLE_CLIENT_ID,
    client_secret=settings.APPLE_CLIENT_SECRET,
    authorize_url='https://appleid.apple.com/auth/authorize',
    access_token_url='https://appleid.apple.com/auth/token',
    client_kwargs={'scope': 'name email'}
)

@router.get("/auth/google")
async def google_login(request: Request):
    """Redirect to Google OAuth"""
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback")
async def google_callback(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Handle Google OAuth callback"""
    token = await oauth.google.authorize_access_token(request)
    user_info = token['userinfo']

    # Find or create user
    user = await db.users.find_one({"email": user_info['email']})

    if not user:
        # Create new user from OAuth
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": user_info['email'],
            "name": user_info['name'],
            "picture": user_info.get('picture'),
            "oauth_provider": "google",
            "oauth_id": user_info['sub'],
            "created_at": datetime.now(timezone.utc),
            # ... other fields
        }
        await db.users.insert_one(user)

    # Create session
    session_token = str(uuid.uuid4())
    # ... create session logic

    return {"user": user, "session_token": session_token}
```

---

### 10. **API Key Management for External Services**

**Secure API key management**

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "SharaSpot API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    MONGODB_URI: str
    MONGODB_DB_NAME: str
    REDIS_URL: str

    # Security
    JWT_SECRET: str
    SESSION_EXPIRY_DAYS: int = 7
    CORS_ORIGINS: List[str] = ["http://localhost:8081"]

    # External APIs
    HERE_API_KEY: str
    GOOGLE_MAPS_API_KEY: str

    # AWS
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_S3_BUCKET: str
    AWS_REGION: str = "us-east-1"

    # OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    APPLE_CLIENT_ID: str
    APPLE_CLIENT_SECRET: str

    # Monitoring
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

---

## 📊 Monitoring & Observability

### 11. **Structured Logging**

```python
# app/core/logging.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if hasattr(record, "extra"):
            log_data.update(record.extra)

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/app.log")
    ]
)

# Add JSON formatter for production
if settings.ENVIRONMENT == "production":
    for handler in logging.root.handlers:
        handler.setFormatter(JSONFormatter())
```

---

### 12. **Health Check Endpoints**

```python
# app/api/v1/health.py
from datetime import datetime

@router.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT
    }

@router.get("/health/detailed")
async def detailed_health_check(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Detailed health check with dependencies"""
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }

    # Check MongoDB
    try:
        await db.command("ping")
        health["checks"]["mongodb"] = {"status": "healthy"}
    except Exception as e:
        health["status"] = "unhealthy"
        health["checks"]["mongodb"] = {"status": "unhealthy", "error": str(e)}

    # Check Redis
    try:
        await redis_cache.redis.ping()
        health["checks"]["redis"] = {"status": "healthy"}
    except Exception as e:
        health["checks"]["redis"] = {"status": "unhealthy", "error": str(e)}

    # Check S3
    try:
        s3_service.s3_client.head_bucket(Bucket=settings.AWS_S3_BUCKET)
        health["checks"]["s3"] = {"status": "healthy"}
    except Exception as e:
        health["checks"]["s3"] = {"status": "unhealthy", "error": str(e)}

    return health
```

---

## 🧪 Testing Strategy

### 13. **Comprehensive Test Suite**

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient
from app.main import app
from motor.motor_asyncio import AsyncIOMotorClient

@pytest.fixture
async def client():
    """Test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def db():
    """Test database"""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["sharaspot_test"]
    yield db
    # Cleanup
    await client.drop_database("sharaspot_test")

@pytest.fixture
async def authenticated_user(client, db):
    """Create and authenticate test user"""
    user_data = {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "name": "Test User"
    }

    # Signup
    response = await client.post("/api/v1/auth/signup", json=user_data)
    assert response.status_code == 200

    data = response.json()
    return data["session_token"], data["user"]

# tests/unit/test_gamification.py
@pytest.mark.asyncio
async def test_award_coins(db):
    """Test coin awarding logic"""
    # ... test implementation

# tests/integration/test_charger_api.py
@pytest.mark.asyncio
async def test_add_and_verify_charger(client, authenticated_user):
    """Test full charger lifecycle"""
    session_token, user = authenticated_user

    # Add charger
    charger_data = {
        "name": "Test Charger",
        "address": "123 Test St",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "port_types": ["Type 2"],
        "total_ports": 4
    }

    response = await client.post(
        "/api/v1/chargers",
        json=charger_data,
        headers={"Authorization": f"Bearer {session_token}"}
    )

    assert response.status_code == 200
    charger = response.json()

    # Verify charger
    verification_data = {"status": "active"}
    response = await client.post(
        f"/api/v1/chargers/{charger['id']}/verify",
        json=verification_data,
        headers={"Authorization": f"Bearer {session_token}"}
    )

    assert response.status_code == 200
    assert response.json()["verification_level"] >= 1
```

---

## 📦 Deployment Enhancements

### 14. **Docker Configuration**

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

---

## 📈 Performance Optimization

### 15. **Database Query Optimization**

```python
# Use projection to limit fields
chargers = await db.chargers.find(
    {"verification_level": {"$gte": 3}},
    {"name": 1, "latitude": 1, "longitude": 1, "verification_level": 1}
).to_list(length=50)

# Use aggregation for complex queries
pipeline = [
    {"$match": {"verification_level": {"$gte": 3}}},
    {"$lookup": {
        "from": "users",
        "localField": "added_by",
        "foreignField": "id",
        "as": "creator"
    }},
    {"$unwind": "$creator"},
    {"$project": {
        "name": 1,
        "latitude": 1,
        "longitude": 1,
        "creator_name": "$creator.name"
    }},
    {"$limit": 50}
]

chargers = await db.chargers.aggregate(pipeline).to_list(length=50)
```

---

## 🎯 Implementation Roadmap

### Phase 1 (Month 1): Foundation
- [ ] Refactor to modular architecture
- [ ] Implement dependency injection
- [ ] Add repository pattern
- [ ] Create service layer
- [ ] Add comprehensive logging

### Phase 2 (Month 2): Core Features
- [ ] Implement S3 image upload
- [ ] Add Redis caching
- [ ] Real-time WebSockets
- [ ] OAuth integration
- [ ] Rate limiting

### Phase 3 (Month 3): Quality & Scale
- [ ] Comprehensive test suite (80%+ coverage)
- [ ] Performance optimization
- [ ] API documentation
- [ ] Health checks
- [ ] Docker deployment

### Phase 4 (Month 4): Advanced Features
- [ ] Elasticsearch integration
- [ ] Advanced analytics
- [ ] Admin dashboard API
- [ ] Notification system
- [ ] Payment integration

---

## 📚 Additional Libraries to Install

```txt
# requirements.txt (additions)
# Async HTTP
httpx==0.27.0

# Caching
redis==5.0.1

# OAuth
authlib==1.3.0

# Image Processing
pillow==10.1.0
boto3==1.34.0

# Monitoring
sentry-sdk==1.40.0

# Testing
pytest==8.0.0
pytest-asyncio==0.23.3
pytest-cov==4.1.0

# Search (optional)
elasticsearch==8.12.0

# Background Tasks
celery==5.3.4

# API Docs
fastapi[all]==0.110.1
```

---

**This backend enhancement plan transforms SharaSpot into a production-ready, scalable, and maintainable platform. Prioritize based on business needs and resources available.**
