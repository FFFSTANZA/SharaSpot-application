# SharaSpot Backend Documentation

> **Note**: This documentation describes the API endpoints and functionality. For the latest modular monolith architecture and code organization, see:
> - **[Modular Monolith Architecture](./MODULAR_MONOLITH_ARCHITECTURE.md)** - Complete architecture guide
> - **[Migration Guide](./MIGRATION_GUIDE.md)** - New module structure and patterns
> - **[Getting Started](./GETTING_STARTED.md)** - Setup and development guide
>
> The backend now uses a **modular monolith architecture** with modules organized into 4 layers:
> - `domain/` - Business entities and logic
> - `application/` - Use cases and services
> - `infrastructure/` - Data access and external services
> - `presentation/` - API routes and DTOs
>
> **Example**: The auth module is located at `backend/modules/auth/` instead of `backend/app/api/auth.py`

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [API Routes](#api-routes)
- [Services](#services)
- [Database Models](#database-models)
- [Security](#security)
- [Configuration](#configuration)

---

## Architecture Overview

### Technology Stack
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: SQLAlchemy (async)
- **Migration**: Alembic
- **Authentication**: JWT + Bcrypt
- **Rate Limiting**: SlowAPI with Redis backend
- **Testing**: Pytest
- **Documentation**: OpenAPI (Swagger UI at `/docs`)

### Design Pattern
- **Architecture**: Modular Monolith
- **API Version**: 2.0.0
- **Base Path**: `/api`

---

## API Routes

### 1. Authentication API (`/api/auth`)
**File**: `backend/app/api/auth.py`

#### Endpoints

| Endpoint | Method | Description | Auth Required | Rate Limit |
|----------|--------|-------------|---------------|------------|
| `/signup` | POST | Email/password registration | No | 5/min |
| `/login` | POST | Email/password login | No | 5/min |
| `/me` | GET | Get current user profile | Yes | - |
| `/guest` | POST | Create guest session | No | 5/min |
| `/logout` | POST | Logout and destroy session | Yes | - |
| `/preferences` | PUT | Update user preferences | Yes | - |
| `/refresh` | POST | Refresh access token | Yes | - |
| `/google/login` | GET | Initiate Google OAuth flow | No | 5/min |
| `/google/callback` | GET | Handle Google OAuth callback | No | 5/min |

#### Request/Response Examples

**Signup**
```json
// POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

// Response
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbG...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbG...",
  "token_type": "bearer",
  "needs_preferences": true
}
```

**Login**
```json
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbG...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbG...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "shara_coins": 0,
    "trust_score": 0
  }
}
```

**Update Preferences**
```json
// PUT /api/auth/preferences
{
  "port_type": "ccs2",
  "vehicle_type": "electric",
  "distance_unit": "km"
}

// Response
{
  "message": "Preferences updated successfully",
  "user": { /* updated user object */ }
}
```

#### Security Features
- **Password Hashing**: Bcrypt with cost factor 12
- **Account Lockout**: 5 failed attempts = 15 minutes lockout
- **Session Management**: 7-day expiry with secure cookies
- **CSRF Protection**: State tokens for OAuth flows

---

### 2. Chargers API (`/api/chargers`)
**File**: `backend/app/api/chargers.py`

#### Endpoints

| Endpoint | Method | Description | Coins Earned |
|----------|--------|-------------|--------------|
| `/` | GET | Get nearby chargers with filters | - |
| `/` | POST | Add new charger | +5 + 3/photo |
| `/{charger_id}` | GET | Get detailed charger info | - |
| `/{charger_id}/verify` | POST | Submit verification report | +2 to +9 |

#### GET `/` - Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `verification_level` | int | Minimum level filter (1-5) | `3` |
| `port_type` | string | Filter by port type | `ccs2` |
| `amenity` | string | Filter by amenity | `restroom` |
| `max_distance` | float | Maximum distance in km | `10.0` |
| `user_lat` | float | User latitude | `28.6139` |
| `user_lng` | float | User longitude | `77.2090` |

**Example Request**:
```
GET /api/chargers?verification_level=3&port_type=ccs2&max_distance=5&user_lat=28.6139&user_lng=77.2090
```

**Response**:
```json
{
  "chargers": [
    {
      "id": "uuid-here",
      "name": "DLF CyberHub Charging Station",
      "address": "DLF Cyber City, Gurugram",
      "latitude": 28.4950,
      "longitude": 77.0890,
      "port_types": ["ccs2", "type2"],
      "available_ports": 3,
      "total_ports": 4,
      "verification_level": 4,
      "amenities": ["restroom", "restaurant", "wifi"],
      "photos": ["https://s3.amazonaws.com/..."],
      "last_verified": "2025-11-15T10:30:00Z",
      "distance_km": 2.5
    }
  ],
  "total": 15
}
```

#### POST `/` - Add Charger

**Request**:
```json
{
  "name": "My Local Charger",
  "address": "123 Main St, Delhi",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "port_types": ["type2", "chademo"],
  "total_ports": 2,
  "amenities": ["parking", "restroom"],
  "photos": ["base64_encoded_image_data"],
  "notes": "Available 24/7"
}
```

**Response**:
```json
{
  "message": "Charger added successfully! You earned 8 Shara Coins!",
  "charger_id": "uuid-here",
  "coins_earned": 8
}
```

**Coin Calculation**: 5 base + 3 per photo

---

#### POST `/{charger_id}/verify` - Verify Charger

**Request**:
```json
{
  "action": "active",
  "notes": "Working perfectly, fast charging",

  // Port context (optional, +1 coin for 2/3 fields)
  "wait_time": 5,
  "port_type_used": "ccs2",
  "ports_available": 2,
  "charging_success": true,

  // Operational details (optional, +1 coin for both)
  "payment_method": "app",
  "station_lighting": "excellent",

  // Quality ratings (optional, +3 coins for complete)
  "cleanliness_rating": 5,
  "charging_speed_rating": 4,
  "amenities_rating": 4,
  "would_recommend": true,

  // Photo (optional, +2 coins for not_working)
  "photo": "base64_encoded_image_data"
}
```

**Response**:
```json
{
  "message": "Verification submitted! You earned 9 Shara Coins!",
  "coins_earned": 9,
  "new_verification_level": 4
}
```

**Coin Rewards**:
- Base: 2 coins
- Port context (2/3 fields): +1
- Operational details (both): +1
- Quality ratings (complete): +3
- Wait time info: +1
- Photo evidence (not_working): +2
- **Maximum**: 9 coins

---

### 3. Routing API (`/api/routing`)
**File**: `backend/app/api/routing.py`

#### POST `/here/calculate` - Calculate EV Route

**Request**:
```json
{
  "origin_lat": 28.6139,
  "origin_lng": 77.2090,
  "destination_lat": 28.5355,
  "destination_lng": 77.3910,
  "battery_capacity_kwh": 50.0,
  "current_battery_percent": 80,
  "vehicle_type": "sedan",
  "port_type": "ccs2"
}
```

**Response**:
```json
{
  "routes": [
    {
      "profile": "eco",
      "distance_km": 15.2,
      "duration_minutes": 32,
      "energy_consumption_kwh": 3.8,
      "battery_at_destination": 72,
      "eco_score": 92,
      "reliability_score": 85,
      "geometry": "encoded_polyline_string",
      "steps": [
        {
          "instruction": "Head north on Main Street",
          "distance_meters": 500,
          "duration_seconds": 60,
          "voice_text": "In 500 meters, turn right onto Park Avenue",
          "maneuver": "turn-right"
        }
      ],
      "chargers_along_route": [
        {
          "id": "uuid",
          "name": "Midway Charging Hub",
          "latitude": 28.5747,
          "longitude": 77.3009,
          "distance_from_route_km": 0.8,
          "port_types": ["ccs2"],
          "verification_level": 4
        }
      ],
      "elevation_profile": [
        {"distance": 0, "elevation": 215},
        {"distance": 1000, "elevation": 225}
      ]
    }
  ]
}
```

**Route Profiles**:
- **Eco**: Optimized for energy efficiency
- **Balanced**: Balance between time and energy
- **Fastest**: Minimum travel time

---

### 4. Profile API (`/api/profile`)
**File**: `backend/app/api/profile.py`

#### GET `/profile/activity` - User Activity History

**Response**:
```json
{
  "activities": [
    {
      "type": "charger_added",
      "timestamp": "2025-11-15T10:30:00Z",
      "description": "Added DLF CyberHub Charging Station",
      "coins_earned": 8
    },
    {
      "type": "verification",
      "timestamp": "2025-11-14T15:20:00Z",
      "description": "Verified Charging Station #123",
      "coins_earned": 6
    }
  ]
}
```

#### GET `/profile/stats` - User Statistics

**Response**:
```json
{
  "total_coins": 145,
  "trust_score": 68,
  "chargers_added": 5,
  "verifications_count": 23,
  "photos_uploaded": 12,
  "rank": "Silver Contributor"
}
```

---

### 5. Analytics API (`/api/analytics`)
**File**: `backend/app/api/analytics.py`

See [METRICS_API_DOCUMENTATION.md](./METRICS_API_DOCUMENTATION.md) for detailed analytics endpoints.

---

## Services

### 1. Authentication Service
**File**: `backend/app/services/auth_service.py`

#### Functions

```python
async def signup(
    email: str,
    password: str,
    name: str,
    db: AsyncSession
) -> User
```
Creates new user with hashed password.

```python
async def login(
    email: str,
    password: str,
    db: AsyncSession
) -> Tuple[User, str, str]
```
Returns user, access_token, refresh_token. Implements account lockout.

```python
async def create_guest_user(db: AsyncSession) -> User
```
Creates anonymous guest user with temporary account.

---

### 2. Charger Service
**File**: `backend/app/services/charger_service.py`

#### Key Functions

```python
async def get_chargers(
    db: AsyncSession,
    verification_level: Optional[int] = None,
    port_type: Optional[str] = None,
    amenity: Optional[str] = None,
    max_distance: Optional[float] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None
) -> List[Charger]
```
**Geospatial Filtering**: Uses bounding box calculation for efficient querying.

```python
async def add_charger(
    charger_data: dict,
    photos: List[str],
    user_id: str,
    db: AsyncSession
) -> Tuple[Charger, int]
```
**Returns**: (charger, coins_earned)
**S3 Upload**: Validates and optimizes images before upload.

```python
async def verify_charger(
    charger_id: str,
    user_id: str,
    verification_data: dict,
    db: AsyncSession
) -> Tuple[int, int]
```
**Returns**: (coins_earned, new_verification_level)
**Algorithm**: See [REPORT_VERIFICATION.md](./REPORT_VERIFICATION.md)

```python
async def calculate_weighted_verification_score(
    charger_id: str,
    db: AsyncSession
) -> Tuple[int, float, float]
```
**Returns**: (verification_level, weighted_positive, weighted_negative)

**Weighting Factors**:
- Time decay: `0.5^(age_days / 30)`
- Trust multiplier: `0.5 + (trust_score / 100) × 1.5`

---

### 3. Routing Service
**File**: `backend/app/services/routing_service.py`

See [ECO_ROUTE_DOCUMENTATION.md](./ECO_ROUTE_DOCUMENTATION.md) for detailed routing algorithms.

#### Key Functions

```python
async def call_mapbox_directions_api(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    profile: str = "driving"
) -> dict
```
Calls Mapbox Directions API with retry logic.

```python
async def calculate_ev_energy_consumption(
    route_geometry: List[Tuple[float, float]],
    elevations: List[float],
    vehicle_type: str,
    battery_capacity_kwh: float
) -> float
```
Physics-based energy model considering:
- Rolling resistance
- Air resistance (quadratic with speed)
- Elevation changes
- Regenerative braking (70% recovery)
- HVAC overhead (15%)

---

### 4. Gamification Service
**File**: `backend/app/services/gamification_service.py`

```python
async def award_charger_coins(
    user_id: str,
    charger_id: str,
    photos_count: int,
    db: AsyncSession
) -> int
```
**Returns**: Total coins (5 base + 3 per photo)

```python
async def award_verification_coins(
    user_id: str,
    charger_id: str,
    verification_data: dict,
    db: AsyncSession
) -> int
```
**Returns**: 2-9 coins based on detail level

```python
def calculate_trust_score(user: User) -> int
```
**Formula**: `min(100, chargers_added × 10 + verifications × 2 + photos × 3)`

---

### 5. S3 Service
**File**: `backend/app/services/s3_service.py`

```python
async def upload_photo(
    photo_data: str,
    folder: str = "chargers"
) -> str
```
**Process**:
1. Decode base64 image
2. Validate format (JPEG, PNG)
3. Resize to max 1920px
4. Compress to 85% quality
5. Convert RGBA → RGB
6. Upload to S3
7. Return presigned URL (1-hour expiry)

---

## Database Models

### User Model
**File**: `backend/app/core/db_models.py`

```python
class User(Base):
    __tablename__ = "users"

    # Identity
    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)  # Bcrypt hashed
    name = Column(String)
    picture = Column(String)

    # Preferences
    port_type = Column(String)
    vehicle_type = Column(String)
    distance_unit = Column(String, default="km")

    # Gamification
    is_guest = Column(Boolean, default=False)
    shara_coins = Column(Integer, default=0)
    trust_score = Column(Integer, default=0)
    verifications_count = Column(Integer, default=0)
    chargers_added = Column(Integer, default=0)
    photos_uploaded = Column(Integer, default=0)

    # Security
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime)

    # Settings
    theme = Column(String, default="light")
    notifications_enabled = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("UserSession", back_populates="user")
    chargers = relationship("Charger", back_populates="contributor")
    coin_transactions = relationship("CoinTransaction")
    verification_actions = relationship("VerificationAction")
```

---

### Charger Model

```python
class Charger(Base):
    __tablename__ = "chargers"

    # Location
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String)
    address = Column(String)
    latitude = Column(Float, index=True)
    longitude = Column(Float, index=True)

    # Technical Details
    port_types = Column(ARRAY(String))  # ["ccs2", "type2"]
    available_ports = Column(Integer)
    total_ports = Column(Integer)

    # Data Quality
    source_type = Column(String)  # official/community_manual
    verification_level = Column(Integer, default=1)  # 1-5
    verified_by_count = Column(Integer, default=0)
    last_verified = Column(DateTime)
    uptime_percentage = Column(Float, default=100.0)

    # Amenities
    amenities = Column(ARRAY(String))
    nearby_amenities = Column(ARRAY(String))

    # Media
    photos = Column(ARRAY(String))  # S3 URLs

    # Metadata
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    contributor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    contributor = relationship("User", back_populates="chargers")
    verifications = relationship("VerificationAction")

    # Indexes
    __table_args__ = (
        Index('ix_charger_location', 'latitude', 'longitude'),
        Index('ix_charger_ports', 'port_types', postgresql_using='gin'),
        Index('ix_charger_amenities', 'amenities', postgresql_using='gin'),
    )
```

---

### VerificationAction Model

```python
class VerificationAction(Base):
    __tablename__ = "verification_actions"

    # Core
    id = Column(UUID(as_uuid=True), primary_key=True)
    charger_id = Column(UUID, ForeignKey("chargers.id"))
    user_id = Column(UUID, ForeignKey("users.id"))
    action = Column(String)  # active/partial/not_working
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)

    # Port Context
    wait_time = Column(Integer)  # minutes
    port_type_used = Column(String)
    ports_available = Column(Integer)
    charging_success = Column(Boolean)

    # Operational Details
    payment_method = Column(String)
    station_lighting = Column(String)

    # Quality Ratings (1-5)
    cleanliness_rating = Column(Integer)
    charging_speed_rating = Column(Integer)
    amenities_rating = Column(Integer)
    would_recommend = Column(Boolean)

    # Evidence
    photo_url = Column(String)  # S3 URL

    # Indexes
    __table_args__ = (
        Index('ix_verification_user_charger', 'user_id', 'charger_id', 'timestamp'),
        Index('ix_verification_charger_time', 'charger_id', 'timestamp'),
    )
```

---

## Security

### Password Security
- **Hashing**: Bcrypt with cost factor 12
- **Validation**: Minimum 8 characters, complexity requirements
- **Reset**: Time-limited tokens (15 minutes)

### Authentication
- **Access Tokens**: JWT, 30-minute expiry
- **Refresh Tokens**: JWT, 7-day expiry
- **Session Cookies**: HttpOnly, Secure, SameSite=Lax

### Account Protection
- **Lockout**: 5 failed attempts = 15 minutes
- **Rate Limiting**: Per-endpoint limits
- **CSRF**: State tokens for OAuth flows

### API Security
- **Input Validation**: Pydantic models
- **SQL Injection**: SQLAlchemy parameterized queries
- **XSS Prevention**: Content Security Policy headers
- **CORS**: Restricted origins

---

## Configuration

### Environment Variables
**File**: `backend/.env`

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/sharaspot

# Security
JWT_SECRET_KEY=your-secret-key-here
SESSION_SECRET_KEY=your-session-secret

# External APIs
MAPBOX_API_KEY=pk.eyJ1...
OPENWEATHER_API_KEY=your-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=sharaspot-photos
AWS_REGION=us-east-1

# Redis (Rate Limiting)
REDIS_URL=redis://localhost:6379/0

# App Settings
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://sharaspot.com
```

### Rate Limits
**File**: `backend/app/core/config.py`

```python
RATE_LIMITS = {
    "auth": "5/minute",
    "write": "20/minute",
    "read": "60/minute",
    "verification": "12/hour"
}
```

---

## Testing

### Run Tests
```bash
cd backend
pytest tests/ -v --cov=app
```

### Test Coverage
- Unit tests for services
- Integration tests for API endpoints
- Database migration tests

---

## Deployment

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Start Server
```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json
