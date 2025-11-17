# SharaSpot Backend - API Endpoints Reference

## Authentication Module
| Method | Endpoint | Purpose | Auth Required | Coins |
|--------|----------|---------|---------------|-------|
| POST | `/api/auth/signup` | Register with email/password | No | No |
| POST | `/api/auth/login` | Login with email/password | No | No |
| GET | `/api/auth/session-data` | OAuth session from Emergent | No | No |
| GET | `/api/auth/me` | Get current user profile | Yes | No |
| POST | `/api/auth/guest` | Create guest session | No | No |
| POST | `/api/auth/logout` | Logout and destroy session | Yes | No |
| PUT | `/api/auth/preferences` | Set port type & vehicle type | Yes | No |

---

## Charger Management Module
| Method | Endpoint | Purpose | Auth Required | Coins |
|--------|----------|---------|---------------|-------|
| GET | `/api/chargers` | List chargers (with filters) | Yes | No |
| POST | `/api/chargers` | Add new charger | Yes | +5 |
| GET | `/api/chargers/{id}` | Get charger details | Yes | No |
| POST | `/api/chargers/{id}/verify` | Submit verification | Yes | +2 |

### GET /api/chargers Query Parameters
```
latitude (float)           - Center latitude for search
longitude (float)          - Center longitude for search
radius_km (float)          - Search radius in kilometers
port_types (List[str])     - Filter: "Type 2", "CCS", "CHAdeMO", etc.
vehicle_type (str)         - Filter by vehicle type
verification_level (int)   - Filter by level (1-5)
sort_by (str)              - "distance", "verification_level", "recently_verified"
limit (int)                - Results per page (default: 50, max: 1000)
offset (int)               - Pagination offset (default: 0)
```

### POST /api/chargers Request Body
```json
{
  "name": "string",
  "address": "string",
  "latitude": float,
  "longitude": float,
  "port_types": ["Type 2", "CCS"],
  "total_ports": 2,
  "amenities": ["wifi", "cafe"],
  "photos": ["base64_encoded_images"],
  "notes": "optional details"
}
```

### POST /api/chargers/{id}/verify Request Body
```json
{
  "action": "active|partial|not_working",
  "notes": "optional observations",
  
  "wait_time": 15,                    // minutes
  "port_type_used": "Type 2",
  "ports_available": 1,
  "charging_success": true,
  
  "payment_method": "App|Card|Cash|Free",
  "station_lighting": "Well-lit|Adequate|Poor",
  
  "cleanliness_rating": 5,            // 1-5 stars
  "charging_speed_rating": 4,
  "amenities_rating": 3,
  "would_recommend": true,
  
  "photo_url": "base64_image"
}
```

---

## Gamification Module (Profile & Wallet)
| Method | Endpoint | Purpose | Auth Required | Notes |
|--------|----------|---------|---------------|-------|
| GET | `/api/profile/stats` | User statistics & achievements | Yes | SharaCoin balance, trust score, counts |
| GET | `/api/profile/activity` | User activity history | Yes | Recent actions, last 100 entries |
| GET | `/api/wallet/transactions` | Coin transaction history | Yes | Earn/spend ledger |
| PUT | `/api/settings` | Update user settings | Yes | Theme, notifications |

### GET /api/profile/stats Response
```json
{
  "user_id": "uuid",
  "shara_coins": 125,
  "trust_score": 45.5,
  "verifications_count": 23,
  "chargers_added": 5,
  "photos_uploaded": 12,
  "reports_submitted": 3,
  "coins_redeemed": 50,
  "achievements": [
    "first_verification",
    "10_verifications",
    "power_user"
  ]
}
```

### GET /api/wallet/transactions Query Parameters
```
user_id (str)              - User to fetch transactions for
limit (int)                - Results per page (default: 50, max: 100)
offset (int)               - Pagination offset (default: 0)
action_type (str)          - Filter by action type
sort_by (str)              - "timestamp" (default, newest first)
```

### PUT /api/settings Request Body
```json
{
  "theme": "light|dark",
  "notifications_enabled": true
}
```

---

## Routing Module (EV Route Calculation)
| Method | Endpoint | Purpose | Auth Required | Notes |
|--------|----------|---------|---------------|-------|
| POST | `/api/routing/here/calculate` | Calculate EV routes | Yes | Includes chargers along route |

### POST /api/routing/here/calculate Request Body
```json
{
  "origin_lat": 40.7128,
  "origin_lng": -74.0060,
  "destination_lat": 40.7580,
  "destination_lng": -73.9855,
  "battery_capacity_kwh": 60.0,
  "current_battery_percent": 80.0,
  "vehicle_type": "sedan",
  "port_type": "Type 2"
}
```

### POST /api/routing/here/calculate Response
```json
{
  "routes": [
    {
      "id": "route_0",
      "type": "eco|balanced|fastest|shortest",
      "distance_m": 8000,
      "duration_s": 600,
      "base_time_s": 540,
      "energy_consumption_kwh": 2.4,
      "elevation_gain_m": 120,
      "elevation_loss_m": 100,
      "eco_score": 8.5,
      "reliability_score": 9.2,
      "summary": {
        "distance_km": 8.0,
        "duration_min": 10.0,
        "avg_speed_kmh": 48.0,
        "chargers_available": 3,
        "traffic_delay_min": 1.0
      }
    }
  ],
  "chargers_along_route": [
    {
      "id": "charger_123",
      "name": "Fast Charging Station",
      "distance": 2.5,
      "verification_level": 5
    }
  ],
  "weather_data": {
    "temperature_c": 22,
    "condition": "Clear",
    "wind_speed_kmh": 12,
    "humidity_percent": 65
  },
  "traffic_incidents": []
}
```

---

## Coin Reward System

### Earning Coins
| Action | Coins | Notes |
|--------|-------|-------|
| Add Charger | 5 | Once per charger |
| Verify Charger | 2 | Multiple verifications allowed |
| Upload Photo | 3 | Per photo submission |
| Report Invalid | 1 | Report broken/unavailable charger |
| Daily Login | 1 | Once per day |

### Spending Coins
| Action | Coins | Notes |
|--------|-------|-------|
| Redeem Coupon | Variable | Configured per coupon |

### Trust Score Calculation
```
Trust Score = (chargers_added × 10) + (verifications × 2) + (photos × 3)
Maximum: 100
```

---

## Charger Verification Levels

### Level 5 - Highly Verified
- Threshold: 8+ active verifications in last 10 actions
- Status: "Excellent condition, frequently verified"
- Display: Gold badge

### Level 4 - Well Verified
- Threshold: 6+ active verifications in last 10 actions
- Status: "Good condition, regularly verified"
- Display: Silver badge

### Level 3 - Moderately Verified
- Threshold: 4+ active verifications in last 10 actions
- Status: "Acceptable condition, some verifications"
- Display: Bronze badge

### Level 1-2 - Minimally Verified
- Threshold: < 4 active verifications
- Status: "Limited verification data"
- Display: No badge

### Penalty System
- 3+ "not_working" reports in recent actions: Automatic level decrease
- Level never drops below 1

---

## Error Responses

### Common HTTP Status Codes
| Code | Scenario | Response |
|------|----------|----------|
| 200 | Success | `{ "data": ... }` |
| 201 | Created | `{ "id": "...", ...}` |
| 400 | Bad Request | `{ "detail": "Invalid input data" }` |
| 401 | Unauthorized | `{ "detail": "Authentication failed" }` |
| 403 | Forbidden | `{ "detail": "Permission denied" }` |
| 404 | Not Found | `{ "detail": "Resource not found" }` |
| 429 | Rate Limited | `{ "detail": "Rate limit exceeded" }` |
| 500 | Server Error | `{ "detail": "An internal error occurred", "error_id": "..." }` |

### Error Message Convention
- All error messages are **generic** (no stack traces or implementation details)
- Each error includes an `error_id` for support team reference
- Full error details logged server-side for debugging

---

## Authentication & Security

### Session Token
- Format: UUID v4
- Storage: MongoDB TTL index (auto-deletes after expiry)
- Expiry: 7 days
- Transport: Cookie (HttpOnly, Secure, SameSite=lax) or Bearer header

### Password Requirements
- Minimum: 8 characters
- Maximum: 128 characters
- Must contain: Uppercase, lowercase, digit, special character
- Blocked: Common passwords (password123, admin123, etc.)

### Rate Limits
| Endpoint Type | Limit | Notes |
|---------------|-------|-------|
| Auth endpoints | 5/minute | Login, signup, etc. |
| Write operations | 20/minute | POST, PUT, DELETE |
| Read operations | 60/minute | GET requests |

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: default-src 'self'
- Referrer-Policy: strict-origin-when-cross-origin

---

## Request/Response Headers

### Standard Request Headers
```
Accept: application/json
Content-Type: application/json
Authorization: Bearer <session_token>  // Optional, can use cookie instead
X-API-Version: v1
```

### Standard Response Headers
```
X-Process-Time: <duration_ms>
X-API-Version: v1
Content-Type: application/json
```

### Cookie Format (Set by Server)
```
Set-Cookie: session_token=<uuid>; 
            HttpOnly; 
            Secure; 
            SameSite=Lax; 
            Max-Age=604800; 
            Path=/
```

---

## Pagination

### Query Parameters
```
limit (int)    - Items per page (default: 50, max: 100)
offset (int)   - Items to skip (default: 0)
```

### Response Format
```json
{
  "items": [ ... ],
  "total": 250,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

---

## Sorting

### Supported Sort Fields
- `distance` - Distance from query center (ascending)
- `verification_level` - Verification level (descending)
- `recently_verified` - Last verification date (descending)
- `created_at` - Creation date (descending)
- `uptime_percentage` - Reliability (descending)

### Sort Parameter Format
```
sort_by=verification_level:desc
sort_by=distance:asc
```

---

## CORS Configuration

### Allowed Origins
```
http://localhost:8081     # Expo development
http://localhost:19006    # Expo web
exp://localhost:8081      # Expo app
https://sharaspot.app     # Production (add when deployed)
```

### Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS

### Allowed Headers
- Content-Type, Authorization, X-API-Version

---

## Database Collections

### users
```json
{
  "_id": ObjectId,
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "url_or_base64",
  "port_type": "Type 2",
  "vehicle_type": "sedan",
  "distance_unit": "km",
  "is_guest": false,
  "shara_coins": 125,
  "verifications_count": 23,
  "chargers_added": 5,
  "photos_uploaded": 12,
  "reports_submitted": 3,
  "coins_redeemed": 50,
  "trust_score": 45.5,
  "theme": "light",
  "notifications_enabled": true,
  "password": "bcrypt_hash",
  "created_at": ISODate
}
```

### user_sessions
```json
{
  "_id": ObjectId,
  "user_id": "uuid",
  "session_token": "uuid",
  "expires_at": ISODate,
  "created_at": ISODate
}
```

### chargers
```json
{
  "_id": ObjectId,
  "id": "uuid",
  "name": "Fast Charging Station",
  "address": "123 Main St, City, State",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "port_types": ["Type 2", "CCS"],
  "available_ports": 1,
  "total_ports": 2,
  "source_type": "official",
  "verification_level": 5,
  "added_by": "user_uuid",
  "amenities": ["wifi", "cafe"],
  "nearby_amenities": ["restroom", "parking"],
  "photos": ["base64_image"],
  "last_verified": ISODate,
  "uptime_percentage": 95.5,
  "verified_by_count": 23,
  "verification_history": [...],
  "created_at": ISODate
}
```

### coin_transactions
```json
{
  "_id": ObjectId,
  "id": "uuid",
  "user_id": "uuid",
  "action": "add_charger|verify_charger|upload_photo|report_invalid",
  "amount": 5,
  "description": "Added new charger: Fast Station",
  "timestamp": ISODate
}
```

---

## Quick Test Commands

### Test Signup
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Test Get Chargers
```bash
curl -X GET "http://localhost:8000/api/chargers?latitude=40.7128&longitude=-74.0060&radius_km=5&limit=20" \
  -H "Authorization: Bearer <session_token>"
```

### Test Add Charger
```bash
curl -X POST http://localhost:8000/api/chargers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session_token>" \
  -d '{
    "name": "New Station",
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "port_types": ["Type 2"],
    "total_ports": 2,
    "amenities": ["wifi"]
  }'
```

---

## API Documentation URLs

- **Swagger UI**: `http://localhost:8000/api/v1/docs`
- **ReDoc**: `http://localhost:8000/api/v1/redoc`
- **OpenAPI JSON**: `http://localhost:8000/api/v1/openapi.json`

