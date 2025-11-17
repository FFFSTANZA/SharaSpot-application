# SharaSpot Backend Architecture Overview

## Executive Summary
The SharaSpot backend is a **Python FastAPI application** with a **flat file structure** currently organized into separate modules. It uses **MongoDB** as the database, implements **authentication with sessions**, **gamification with coin rewards**, and integrates with **HERE Maps API** for EV routing. The architecture follows a monolithic pattern with mixed concerns across files.

---

## 1. Current File Organization

### Backend Directory Structure
```
/backend/
├── server.py              (1,418 lines) - Main API implementation (production)
├── server_v2.py           (1,189 lines) - Enhanced version with better structure
├── config.py              (267 lines)   - Configuration constants and enums
├── middleware.py          (153 lines)   - Request/response middleware
├── validators.py          (325 lines)   - Input validation functions
├── db_init.py             (186 lines)   - Database initialization and indexing
├── here_routing.py        (268 lines)   - HERE API integration
└── requirements.txt       - Python dependencies
```

**Current Issues:**
- Flat structure with all routes in server.py
- Business logic, models, and routes all mixed in single files
- No clear separation of concerns
- Difficult to scale and maintain

---

## 2. Key Technology Stack

### Core Dependencies
- **FastAPI**: Modern web framework for building APIs
- **Motor (AsyncIOMotorClient)**: Async MongoDB driver
- **Pydantic**: Data validation and serialization
- **bcrypt**: Password hashing
- **httpx**: Async HTTP client for external APIs
- **slowapi**: Rate limiting
- **python-dotenv**: Environment variable management

### Database
- **MongoDB**: NoSQL database (async driver via Motor)
- Collections: `users`, `user_sessions`, `chargers`, `coin_transactions`

### External Integrations
- **HERE Maps Routing API**: EV routing with traffic and consumption data
- **Emergent Auth**: OAuth session management

---

## 3. Existing Routes and Endpoints

### Authentication Routes (`/api/auth/*`)
```
POST   /auth/signup                 - Email/password registration
POST   /auth/login                  - Email/password login
GET    /auth/session-data           - Emergent Auth session processing
GET    /auth/me                     - Get current user from session
POST   /auth/guest                  - Create guest user session
POST   /auth/logout                 - Logout and delete session
PUT    /auth/preferences            - Update user preferences (port type, vehicle)
```

**Key Features:**
- Session-based authentication with 7-day expiry
- Cookie and Bearer token support
- Guest user support (temporary sessions)
- Password hashing with bcrypt
- OAuth integration via Emergent Auth

### Charger Management Routes (`/api/chargers/*`)
```
GET    /chargers                    - List chargers (filtered, paginated, sorted)
POST   /chargers                    - Add new charger (earns coins)
GET    /chargers/{charger_id}       - Get charger details
POST   /chargers/{charger_id}/verify - Submit verification (active/partial/not_working)
```

**Query Parameters for GET /chargers:**
- `latitude`, `longitude`, `radius_km` - Location-based filtering
- `port_types` - Filter by supported port types
- `vehicle_type` - Filter by vehicle compatibility
- `verification_level` - Filter by reliability level (1-5)
- `sort_by` - Sort criteria (distance, verification_level, etc.)
- `limit`, `offset` - Pagination

### Profile & Gamification Routes
```
GET    /profile/stats               - User statistics and achievements
GET    /profile/activity            - User activity history
GET    /wallet/transactions         - Coin transaction history
PUT    /settings                    - Update user settings (theme, notifications)
```

### Routing Routes (`/api/routing/*`)
```
POST   /routing/here/calculate      - Calculate EV routes with charger integration
```

**Request Parameters:**
- Origin/destination coordinates
- Battery capacity and current percentage
- Vehicle type and port type
- Returns multiple route alternatives with chargers along route

---

## 4. Models and Schemas

### Core User Model
```python
class User(BaseModel):
    id: str (UUID)
    email: EmailStr
    name: str
    picture: Optional[str]
    port_type: Optional[str]           # "Type 2", "CCS", "CHAdeMO", "Tesla"
    vehicle_type: Optional[str]        # Vehicle category
    distance_unit: Optional[str]       # "km" or "miles"
    is_guest: bool
    
    # Gamification
    shara_coins: int
    verifications_count: int
    chargers_added: int
    photos_uploaded: int
    reports_submitted: int
    coins_redeemed: int
    trust_score: float (0-100)
    
    # User Preferences
    theme: str                         # "light" or "dark"
    notifications_enabled: bool
    created_at: datetime
```

### Session Model
```python
class UserSession(BaseModel):
    user_id: str
    session_token: str (UUID)
    expires_at: datetime              # 7 days from creation
    created_at: datetime
```

### Charger Model
```python
class Charger(BaseModel):
    id: str (UUID)
    name: str
    address: str
    latitude: float
    longitude: float
    port_types: List[str]
    available_ports: int
    total_ports: int
    source_type: str                  # "official" or "community_manual"
    verification_level: int           # 1-5 scale
    added_by: Optional[str]           # User ID
    amenities: List[str]              # ["restroom", "cafe", "wifi", "parking", "shopping"]
    nearby_amenities: List[str]
    photos: List[str]                 # Base64 encoded images
    last_verified: Optional[datetime]
    uptime_percentage: float          # Default: 95.0
    verified_by_count: int
    verification_history: List[VerificationAction]
    distance: Optional[float]         # Calculated for queries
    created_at: datetime
```

### Verification Action Model
```python
class VerificationAction(BaseModel):
    user_id: str
    action: str                       # "active", "not_working", "partial"
    timestamp: datetime
    notes: Optional[str]
    
    # Port/Charging Context
    wait_time: Optional[int]          # Minutes
    port_type_used: Optional[str]
    ports_available: Optional[int]
    charging_success: Optional[bool]
    
    # Operational Details
    payment_method: Optional[str]     # "App", "Card", "Cash", "Free"
    station_lighting: Optional[str]   # "Well-lit", "Adequate", "Poor"
    
    # Quality Ratings (1-5 stars)
    cleanliness_rating: Optional[int]
    charging_speed_rating: Optional[int]
    amenities_rating: Optional[int]
    would_recommend: Optional[bool]
    
    # Photo Evidence
    photo_url: Optional[str]
```

### Coin Transaction Model
```python
class CoinTransaction(BaseModel):
    id: str (UUID)
    user_id: str
    action: str                       # Action type from ActionType enum
    amount: int                       # Positive (earn) or negative (spend)
    description: str
    timestamp: datetime
```

### Routing Models
```python
class HERERouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    battery_capacity_kwh: float       # Default: 60.0
    current_battery_percent: float    # Default: 80.0
    vehicle_type: str                 # Default: "sedan"
    port_type: str                    # Default: "Type 2"

class RouteAlternative(BaseModel):
    id: str
    type: str                         # "eco", "balanced", "fastest", "shortest"
    distance_m: int
    duration_s: int
    base_time_s: int                  # Without traffic
    polyline: str                     # Encoded polyline
    coordinates: List[dict]           # Decoded coordinates
    energy_consumption_kwh: float
    elevation_gain_m: int
    elevation_loss_m: int
    eco_score: float
    reliability_score: float
    summary: dict

class HERERouteResponse(BaseModel):
    routes: List[RouteAlternative]
    chargers_along_route: List[dict]
    weather_data: Optional[dict]
    traffic_incidents: List[dict]
```

---

## 5. Services and Business Logic

### Authentication Service
**Location:** `server.py` (lines 154-190)

Functions:
- `hash_password()` - bcrypt password hashing
- `verify_password()` - Compare password with hash
- `get_user_from_session()` - Retrieve user from session token
- `create_session()` - Generate new session with 7-day expiry

**Database Operations:**
- Insert user with hashed password
- Create/validate sessions
- TTL index for automatic session cleanup

### Gamification Service
**Location:** `server.py` (lines 903-930)

Functions:
- `log_coin_transaction()` - Record coin earnings/spending
- `calculate_trust_score()` - Weighted score based on user activity

**Coin Reward Structure:**
```python
ADD_CHARGER = 5 coins
VERIFY_CHARGER = 2 coins
UPLOAD_PHOTO = 3 coins
REPORT_INVALID = 1 coin
DAILY_LOGIN = 1 coin
```

**Trust Score Calculation:**
```
Score = (chargers_added × 10) + (verifications × 2) + (photos × 3)
Max: 100
```

### Charger Verification System
**Location:** `server.py` (lines 741-897)

Logic:
- Verification level (1-5) based on recent verification history
- Weighted scoring: active (+1), partial (+0.5), not_working (-1)
- Threshold-based level calculation
- Verification history tracked per charger
- Mock data generation for realistic test data

**Verification Levels:**
- Level 5: 8+ active verifications in last 10 actions
- Level 4: 6+ active verifications
- Level 3: 4+ active verifications
- Level 1-2: Lower verification counts

### Routing Service
**Location:** `here_routing.py` + `server.py` (lines 1316-1414)

Functions:
- `call_here_routing_api()` - Async call to HERE Maps Routing API
- `find_chargers_along_route()` - Find chargers within 5km of route
- `calculate_distance()` - Haversine formula for coordinate distance
- `generate_mock_here_response()` - Fallback data when API unavailable
- `decode_polyline_coordinates()` - Convert encoded polyline to coordinates

**Features:**
- Multiple route alternatives (eco, balanced, fastest)
- Traffic data integration
- EV-specific parameters (consumption rates, elevation)
- Charger reliability scoring
- Weather data integration (currently mocked)

---

## 6. Configuration and Constants

### Environment Configuration (`config.py`)

**Database:**
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name

**Security:**
- `SESSION_EXPIRY_DAYS` = 7
- `MIN_PASSWORD_LENGTH` = 8
- `MAX_PASSWORD_LENGTH` = 128
- Password requirements: uppercase, lowercase, digit, special char
- Rate limits: 5/min (auth), 20/min (write), 60/min (read)

**Gamification Constants:**
```python
class CoinReward:
    ADD_CHARGER = 5
    VERIFY_CHARGER = 2
    UPLOAD_PHOTO = 3
    REPORT_INVALID = 1
    DAILY_LOGIN = 1

class TrustScoreWeight:
    CHARGERS_ADDED_MULTIPLIER = 10
    VERIFICATIONS_MULTIPLIER = 2
    PHOTOS_MULTIPLIER = 3
    MAX_TRUST_SCORE = 100
```

**Verification Constants:**
```python
class VerificationLevel:
    LEVEL_5_ACTIVE_THRESHOLD = 8
    LEVEL_4_ACTIVE_THRESHOLD = 6
    LEVEL_3_ACTIVE_THRESHOLD = 4
    NOT_WORKING_PENALTY_THRESHOLD = 3

class VerificationWeight:
    ACTIVE_WEIGHT = 1.0
    PARTIAL_WEIGHT = 0.5
    NOT_WORKING_WEIGHT = -1.0
    RECENT_ACTIONS_WINDOW = 20
```

**HERE Maps API:**
- `HERE_API_KEY` - API key for HERE Maps
- `HERE_ROUTING_API_URL` - "https://router.hereapi.com/v8/routes"
- `HERE_API_TIMEOUT` = 10 seconds
- `HERE_MAX_ROUTE_ALTERNATIVES` = 3
- `HERE_MAX_DETOUR_KM` = 5.0

**Enums:**
- `ActionType` - "add_charger", "verify_charger", "upload_photo", etc.
- `VerificationAction` - "active", "not_working", "partial"
- `SourceType` - "official", "community_manual"
- `RouteType` - "eco", "balanced", "fastest", "shortest"
- `Theme` - "light", "dark"
- `DistanceUnit` - "km", "miles"

### Input Validation (`validators.py`)

Functions:
- `validate_coordinates()` - Latitude (-90 to 90), Longitude (-180 to 180)
- `validate_password()` - Strength requirements
- `validate_email()` - Format validation
- `validate_port_types()` - Valid types: Type 1, Type 2, CCS, CHAdeMO, Tesla, GB/T, Type 3
- `validate_port_count()` - available <= total, max 100
- `validate_amenities()` - Valid: restroom, cafe, wifi, parking, shopping, restaurant, atm, hotel, rest_area
- `validate_charger_name()` - 3-200 characters
- `validate_address()` - 5-500 characters
- `validate_verification_action()` - active/not_working/partial
- `validate_battery_params()` - Capacity 10-200 kWh, percentage 0-100

### Middleware (`middleware.py`)

**RequestLoggingMiddleware:**
- Logs all requests with method, path, client IP
- Tracks request duration
- Adds custom headers (X-Process-Time, X-API-Version)

**ErrorSanitizationMiddleware:**
- Prevents information leakage
- Returns generic error messages
- Logs full errors internally

**SecurityHeadersMiddleware:**
- Adds security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- CSP, HSTS, XSS protection

**Rate Limiting:**
- slowapi integration
- Per-endpoint rate limit decorators
- Generic error messages on rate limit exceeded

---

## 7. Database Schema and Indexing

### Collections and Indexes (`db_init.py`)

**users Collection:**
- Unique index on: `email`, `id`
- Stores user profile, preferences, gamification stats

**user_sessions Collection:**
- Unique index on: `session_token`
- Index on: `user_id`
- **TTL Index** on: `expires_at` (auto-deletes after expiry)

**chargers Collection:**
- Unique index on: `id`
- Index on: `added_by` (added by user)
- Index on: `verification_level` (for filtering)
- Compound geospatial index on: `[latitude, longitude]`
- 2dsphere index for geospatial queries

**coin_transactions Collection:**
- Unique index on: `id`
- Compound index on: `[user_id, timestamp]` (for user transaction history)

**Query Limits:**
- MAX_CHARGERS_RESULT = 1000
- MAX_TRANSACTIONS_RESULT = 100
- MAX_ACTIVITY_RESULT = 100
- DEFAULT_PAGE_SIZE = 50

---

## 8. API Documentation

### CORS Configuration
```python
ALLOWED_ORIGINS = [
    "http://localhost:8081",    # Expo development
    "http://localhost:19006",   # Expo web
    "exp://localhost:8081",     # Expo app
]
```

### Cookie Configuration
- HttpOnly: Prevents JavaScript access
- Secure: HTTPS only (set to False for local development)
- SameSite: "lax" (CSRF protection)
- Max-Age: 7 days

### API Metadata
- Title: "SharaSpot API"
- Description: Community-driven EV charging discovery platform
- Version: 1.0.0
- Docs: `/api/v1/docs`
- ReDoc: `/api/v1/redoc`
- OpenAPI: `/api/v1/openapi.json`

---

## 9. Current Architectural Issues (For Refactoring)

### 1. Monolithic File Structure
- All routes in single server.py file
- No clear separation of concerns
- Difficult to find and maintain code

### 2. Mixed Responsibilities
- Models, routes, business logic, utilities all in one file
- Database operations scattered throughout
- No service layer abstraction

### 3. Lack of Modularity
- No feature-based modules
- No clear domain boundaries
- Difficult to scale individual features

### 4. Testing Challenges
- Tightly coupled code
- Difficult to mock dependencies
- No clear interfaces

### 5. Code Reuse
- Duplicate logic across endpoints
- No clear patterns for common operations
- Mock data generation embedded in routes

---

## 10. Recommended Modular Monolith Structure

```
backend/
├── app.py                          # Main FastAPI app setup
├── config.py                       # Configuration (existing)
├── requirements.txt                # Dependencies (existing)
├── .env                            # Environment variables
│
├── core/
│   ├── security.py                 # Auth utilities
│   ├── exceptions.py               # Custom exceptions
│   └── dependencies.py             # Dependency injection
│
├── modules/
│   │
│   ├── auth/
│   │   ├── models.py              # User, UserSession models
│   │   ├── schemas.py             # Request/Response schemas
│   │   ├── routes.py              # Auth endpoints
│   │   ├── services.py            # Auth business logic
│   │   └── db.py                  # Database operations
│   │
│   ├── chargers/
│   │   ├── models.py              # Charger model
│   │   ├── schemas.py             # Request/Response schemas
│   │   ├── routes.py              # Charger endpoints
│   │   ├── services.py            # Charger business logic
│   │   ├── db.py                  # Database operations
│   │   └── verification/          # Verification sub-module
│   │       ├── services.py
│   │       └── models.py
│   │
│   ├── gamification/
│   │   ├── models.py              # Coin, Transaction models
│   │   ├── schemas.py
│   │   ├── routes.py              # Profile, wallet endpoints
│   │   ├── services.py            # Coin/trust score logic
│   │   └── db.py
│   │
│   ├── routing/
│   │   ├── models.py              # Route models
│   │   ├── schemas.py
│   │   ├── routes.py              # Routing endpoints
│   │   ├── services.py            # HERE API integration
│   │   ├── integrations/
│   │   │   └── here_api.py        # External API calls
│   │   └── db.py
│   │
│   └── settings/
│       ├── models.py
│       ├── schemas.py
│       ├── routes.py
│       ├── services.py
│       └── db.py
│
├── shared/
│   ├── middleware.py               # Middleware (existing)
│   ├── validators.py               # Validators (existing)
│   ├── utils.py                    # Shared utilities
│   └── constants.py                # Shared constants
│
└── db/
    ├── init.py                     # Database initialization (existing)
    └── migrations/                 # Future: DB migrations
```

---

## Summary

The SharaSpot backend is a **feature-rich monolithic API** built with modern Python technologies. It currently has:

**Strengths:**
- FastAPI provides great async support
- MongoDB for flexible data storage
- Comprehensive input validation
- Security middleware implemented
- Rate limiting in place
- Gamification system with coin rewards
- HERE Maps integration for routing

**Areas for Improvement (Modular Monolith Refactoring):**
- Organize code by domain/feature modules
- Separate models, routes, services, and database operations
- Create clear interfaces between modules
- Implement dependency injection
- Improve testability
- Make code more maintainable and scalable

The recommended modular monolith structure maintains a single deployable unit while providing clear separation of concerns and easier maintenance.

