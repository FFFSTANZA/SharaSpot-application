# SharaSpot Backend - Module Dependencies & Data Flow

## Current Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                        FastAPI App                              │
│              (server.py or server_v2.py - 1,400+ lines)         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ├── Authentication Logic                                       │
│  ├── All Route Definitions                                      │
│  ├── All Request/Response Models                               │
│  ├── Business Logic (Gamification, Verification)                │
│  ├── Database Operations (inline)                               │
│  └── Utility Functions                                          │
│                                                                 │
└──────────────┬──────────────────────────────────────────────────┘
               │
      ┌────────┼────────┬─────────────┬───────────┬────────────┐
      │        │        │             │           │            │
      v        v        v             v           v            v
   config.py middleware validators db_init.py    here_routing.py
   (Consts)   (Middleware) (Input Val) (Indexes) (HERE API)
                                       (Async)
               │
               └─────────────────────┬──────────────────────┘
                                     │
                          ┌──────────v──────────┐
                          │    MongoDB (Motor)   │
                          │   (AsyncIOMotor)     │
                          │   Async Driver       │
                          ├──────────────────────┤
                          │ Collections:         │
                          │ - users              │
                          │ - user_sessions      │
                          │ - chargers           │
                          │ - coin_transactions  │
                          └──────────────────────┘
```

---

## Proposed Modular Monolith Dependency Graph

```
┌────────────────────────────────────────────────────────────────┐
│                     FastAPI App (app.py)                       │
│              Central Router & Middleware Setup                 │
└─────────────────┬────────────────────────────────────────────┘
                  │
        ┌─────────┼────────────┬──────────────┬───────────┐
        │         │            │              │           │
        v         v            v              v           v
    ┌──────┐  ┌──────┐    ┌──────────┐  ┌──────────┐  ┌─────────┐
    │ Auth │  │Chargers  │ Gamification Routing   Settings
    │Module│  │Module    │  Module     Module    Module
    └──┬───┘  └────┬─────┘  └────┬──────┘ └───┬────┘  └────┬────┘
       │            │            │            │            │
    ┌──v─────────┐  │     ┌──────v────────┐ ┌─v──┐      ┌─v──┐
    │  core/     │  │     │ chargers/     │ │    │      │    │
    │security.py│  │     │verification/  │ │    │      │    │
    │           │  │     │services.py    │ │    │      │    │
    └───────────┘  │     └───────────────┘ │    │      │    │
                   │                       │    │      │    │
       Each Module Contains:         ┌─────v────v──┐  │    │
       ├── models.py                 │   shared/   │  │    │
       ├── schemas.py                │ validators  │  │    │
       ├── routes.py                 │   utils     │  │    │
       ├── services.py               │ middleware  │  │    │
       └── db.py                     └─────────────┘  │    │
           (Data access)                              │    │
                   │                                  │    │
                   └──────────────┬───────────────────┘    │
                                  │                        │
                    ┌─────────────┴──────────────┐         │
                    │                            │         │
                    v                            v         v
              ┌──────────────┐         ┌──────────────┐   │
              │  config.py   │         │  middleware/ │   │
              │ (Constants)  │         │ middleware.py│   │
              └──────────────┘         └──────────────┘   │
                    │                         │            │
                    └────────────┬────────────┘            │
                                 │                        │
                    ┌────────────┴────────────┐            │
                    │                         │            │
                    v                         v            v
              ┌──────────────┐         ┌──────────────┐   │
              │   here_api   │         │   db_init    │   │
              │ integration  │         │  (Indexes)   │   │
              └──────────────┘         └──────────────┘   │
                    │                         │            │
                    └────────────┬────────────┘            │
                                 │                        │
                                 v                        │
                          ┌──────────────┐                │
                          │ MongoDB (Motor)◄──────────────┘
                          │   Async DB   │
                          └──────────────┘
```

---

## Data Flow - Authentication Module

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ POST /auth/signup
       │ { email, password, name }
       │
       v
┌──────────────────────────────┐
│  routes.py: signup()         │
│  ├─ Validate email/password  │
│  ├─ Hash password            │
│  └─ Call services.create_... │
└──────┬───────────────────────┘
       │
       ├─────────────────────────────┐
       │                             │
       v                             v
┌──────────────────────┐   ┌──────────────────────┐
│ services.py          │   │ db.py                │
│ ├─ hash_password()   │   │ ├─ create_user()     │
│ ├─ validate_input()  │   │ ├─ create_session()  │
│ └─ create_session()  │   │ └─ find_user()       │
└──────────────────────┘   └──────┬───────────────┘
                                   │
                                   v
                          ┌──────────────────────┐
                          │  MongoDB: users      │
                          │   user_sessions      │
                          └──────────────────────┘
       │
       └─────────────────────────────┐
                                     │
                                     v
                          ┌──────────────────────┐
                          │  Return Response     │
                          │  ├─ user object      │
                          │  ├─ session_token    │
                          │  └─ cookie set       │
                          └──────────────────────┘
       │
       v
┌─────────────┐
│   Client    │
│   (Token)   │
└─────────────┘
```

---

## Data Flow - Charger Discovery (GET /chargers)

```
┌────────────────┐
│     Client     │
└────────┬───────┘
         │
         │ GET /chargers?
         │   latitude=40.71
         │   longitude=-74.0
         │   radius_km=5
         │   port_types=Type2
         │   limit=20
         │
         v
┌────────────────────────────────┐
│  routes.py: get_chargers()     │
│  ├─ Validate params            │
│  ├─ Check auth                 │
│  └─ Call services.search()     │
└────────┬───────────────────────┘
         │
         v
┌────────────────────────────────┐
│ services.py: search_chargers() │
│ ├─ Build query                 │
│ ├─ Geospatial filters          │
│ ├─ Port type filter            │
│ ├─ Verification level sort     │
│ ├─ Paginate results            │
│ └─ Calculate distances         │
└────────┬───────────────────────┘
         │
         v
┌────────────────────────────────┐
│ db.py: find_chargers()         │
│ ├─ MongoDB geospatial query    │
│ │  (lat/lng within radius)     │
│ ├─ Filter by port_types        │
│ ├─ Sort by verification_level  │
│ ├─ Apply limit & offset        │
│ └─ Return cursor               │
└────────┬───────────────────────┘
         │
         v
┌─────────────────────────────────┐
│ MongoDB: chargers collection    │
│ Using indexes:                  │
│ ├─ 2dsphere index (location)    │
│ ├─ verification_level index     │
│ └─ compound port_types index    │
└────────┬────────────────────────┘
         │
         v
┌─────────────────────────────────┐
│ Response: List[Charger]         │
│ ├─ 20 charger objects           │
│ ├─ Distance calculated          │
│ ├─ Verification level (1-5)     │
│ ├─ Amenities & ratings          │
│ └─ Photos (base64)              │
└────────┬────────────────────────┘
         │
         v
┌────────────────┐
│     Client     │
│  (JSON Array)  │
└────────────────┘
```

---

## Data Flow - Gamification (Coin Earning)

```
┌───────────────────────────────┐
│  POST /chargers/{id}/verify   │
│  ├─ action: "active"          │
│  ├─ notes: "All ports work"   │
│  ├─ rating: 5                 │
│  └─ photo_url: "base64..."    │
└───────────┬───────────────────┘
            │
            v
┌───────────────────────────────┐
│ routes.py: verify_charger()   │
│ ├─ Validate user auth         │
│ ├─ Validate charger exists    │
│ ├─ Validate verification data │
│ └─ Call services.add_        │
│     verification()            │
└───────────┬───────────────────┘
            │
    ┌───────┴────────────────────┬──────────────┐
    │                            │              │
    v                            v              v
Verification    Trust Score    Coin Reward
Processing      Calculation    Logging
                
┌───────────────────────────┐
│ services.py:              │
│ add_verification()        │
└───────────┬───────────────┘
            │
            ├─ Append to charger.
            │  verification_history
            │
            ├─ Calculate new
            │  verification_level
            │  based on recent 10
            │  actions
            │
            └─────────────────────┐
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
                    v                            v
            ┌─────────────────┐      ┌──────────────────┐
            │ Update charger: │      │ Log transaction: │
            │ ├─ Add verify   │      │ ├─ user_id       │
            │ ├─ Increment    │      │ ├─ action: verify│
            │ │  verified_by_ │      │ ├─ amount: +2    │
            │ │  count        │      │ ├─ description   │
            │ └─ Set level    │      │ └─ timestamp     │
            └────────┬────────┘      └────────┬─────────┘
                     │                        │
                     v                        v
        ┌────────────────────┐    ┌──────────────────────┐
        │ db.py:             │    │ db.py:               │
        │ update_charger()   │    │ log_coin_transaction │
        │                    │    │ ()                   │
        └────────┬───────────┘    └────────┬─────────────┘
                 │                         │
                 v                         v
        ┌────────────────────┐    ┌──────────────────────┐
        │ MongoDB:           │    │ MongoDB:             │
        │ chargers.{id}      │    │ coin_transactions    │
        │ UPDATE             │    │ INSERT               │
        └────────┬───────────┘    └────────┬─────────────┘
                 │                         │
                 └──────────────┬──────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    v                       v
            ┌──────────────────┐   ┌──────────────────┐
            │ Recalc trust     │   │ Return to client │
            │ score:           │   │ ├─ verification  │
            │ = (chargers × 10)│   │ │  confirmed     │
            │ + (verif × 2)    │   │ ├─ coins earned  │
            │ + (photos × 3)   │   │ ├─ new level     │
            │ (Max: 100)       │   │ └─ trust score   │
            └────────┬─────────┘   └──────────────────┘
                     │                      │
                     v                      v
            ┌──────────────────┐   ┌──────────────────┐
            │ Update user:     │   │     Client       │
            │ ├─ shara_coins   │   │    Response      │
            │ ├─ trust_score   │   │     (JSON)       │
            │ └─ verif_count   │   └──────────────────┘
            └────────┬─────────┘
                     │
                     v
            ┌──────────────────┐
            │ MongoDB: users   │
            │ UPDATE           │
            └──────────────────┘
```

---

## Data Flow - EV Routing with HERE Integration

```
┌──────────────────────────────────┐
│ POST /routing/here/calculate     │
│ ├─ origin_lat/lng                │
│ ├─ destination_lat/lng           │
│ ├─ battery_kwh: 60               │
│ ├─ current_battery%: 80          │
│ └─ port_type: "Type 2"           │
└────────┬─────────────────────────┘
         │
         v
┌──────────────────────────────────┐
│ routes.py: calculate_routes()    │
│ ├─ Validate auth                 │
│ ├─ Validate coordinates          │
│ ├─ Validate battery params       │
│ └─ Call services.calculate()     │
└────────┬─────────────────────────┘
         │
         v
┌──────────────────────────────────┐
│ services.py: calculate_routes()  │
│ ├─ Build HERE API request        │
│ ├─ EV-specific parameters:       │
│ │  - consumption rates           │
│ │  - elevation factors           │
│ │  - traffic integration         │
│ └─ Call HERE integration layer   │
└────────┬─────────────────────────┘
         │
         v
┌──────────────────────────────────┐
│ integrations/here_api.py:        │
│ call_here_routing_api()          │
└────────┬─────────────────────────┘
         │
    ┌────┴──────────────┐
    │                   │
    v                   v
┌──────────────────┐  ┌────────────────┐
│ Async HTTP Call  │  │ Mock Response   │
│ (httpx)          │  │ (if no API key) │
└────────┬─────────┘  └────────┬───────┘
         │                     │
         └──────────┬──────────┘
                    │
         ┌──────────v──────────┐
         │ Parse HERE Response │
         │ ├─ Multiple routes  │
         │ ├─ Polyline data    │
         │ ├─ Duration/distance│
         │ ├─ Consumption      │
         │ └─ Elevation        │
         └──────────┬──────────┘
                    │
                    v
         ┌──────────────────────┐
         │ For each route:      │
         │ 1. Decode polyline   │
         │ 2. Get coordinates   │
         │ 3. Find chargers     │
         │    along route       │
         └──────────┬───────────┘
                    │
                    v
         ┌──────────────────────┐
         │ db.py: find_chargers │
         │ _along_route()       │
         │                      │
         │ Query chargers within
         │ 5km of each point    │
         └──────────┬───────────┘
                    │
                    v
         ┌──────────────────────┐
         │ MongoDB: chargers    │
         │ (geospatial query)   │
         │                      │
         │ Returns top chargers │
         │ sorted by:           │
         │ - verification level │
         │ - availability       │
         │ - distance to route  │
         └──────────┬───────────┘
                    │
                    v
         ┌──────────────────────┐
         │ Calculate scores:    │
         │ - Eco score          │
         │ - Reliability score  │
         │ - Weather impact     │
         │ - Traffic delays     │
         └──────────┬───────────┘
                    │
                    v
         ┌──────────────────────┐
         │ HERERouteResponse    │
         │ ├─ 3 route options   │
         │ ├─ Chargers per route│
         │ ├─ Weather data      │
         │ ├─ Traffic incidents │
         │ └─ Scores            │
         └──────────┬───────────┘
                    │
                    v
         ┌──────────────────────┐
         │      Client          │
         │   (Route options)    │
         └──────────────────────┘
```

---

## Module Interaction Matrix

### Authentication Module ↔ Other Modules
```
auth/services.py
├─ Called by: All modules (authentication check)
├─ Calls: db operations, validators
└─ Uses: config constants, middleware

auth/db.py
├─ Manages: users, user_sessions collections
├─ Called by: auth/services, auth/routes
└─ Uses: config, Motor async driver
```

### Chargers Module ↔ Other Modules
```
chargers/services.py
├─ Called by: chargers/routes
├─ Calls: chargers/db, gamification/services
├─ Uses: validators, config constants
└─ Dependencies: verification logic

chargers/db.py
├─ Manages: chargers, verification_history
├─ Called by: chargers/services
└─ Uses: geospatial indexes
```

### Gamification Module ↔ Other Modules
```
gamification/services.py
├─ Called by: chargers/services (on verify)
├─ Called by: routes (on charger add)
├─ Calls: gamification/db
└─ Uses: config (coin rewards, trust weights)

gamification/db.py
├─ Manages: coin_transactions, user stats
├─ Called by: gamification/services
└─ Updates: users collection (coins, trust_score)
```

### Routing Module ↔ Other Modules
```
routing/services.py
├─ Called by: routing/routes
├─ Calls: integrations/here_api
├─ Calls: routing/db (find chargers)
└─ Uses: validators (battery params)

routing/integrations/here_api.py
├─ Calls: External HERE Maps API
├─ Fallback: Mock data generator
├─ Uses: config (API key, endpoints)
└─ Returns: HERE API response

routing/db.py
├─ Queries: chargers collection
├─ Uses: geospatial indexes
└─ Returns: chargers along route
```

---

## Shared Dependencies

### config.py (Used by all modules)
```
├─ Database: MONGO_URL, DB_NAME
├─ Security: SESSION_EXPIRY, PASSWORD_RULES
├─ Gamification: CoinReward, TrustScoreWeight
├─ Verification: VerificationLevel, VerificationWeight
├─ HERE Maps: API_KEY, ENDPOINT, TIMEOUT
├─ API: API_VERSION, CORS_ORIGINS
└─ Constants: Valid port types, amenities, limits
```

### validators.py (Used by route/service layers)
```
├─ Coordinates validation
├─ Password strength
├─ Email format
├─ Port types
├─ Charger data
├─ Amenities
└─ Battery parameters
```

### middleware.py (Applied to all routes)
```
├─ RequestLoggingMiddleware
├─ ErrorSanitizationMiddleware
├─ SecurityHeadersMiddleware
└─ Rate Limiting (slowapi)
```

### db_init.py (Initialization)
```
├─ Create indexes
├─ Verify indexes
├─ Session cleanup (TTL)
└─ Database utilities
```

---

## Database Access Pattern

### Async Operation Flow
```
Route Handler
    │
    ├─ Dependency: get_current_user() [async]
    │   └─> Query: db.user_sessions.find_one()
    │
    ├─ Validation
    │
    ├─ Service Layer Call [async]
    │   └─> db.chargers.find()
    │   └─> db.users.update_one()
    │   └─> db.coin_transactions.insert_one()
    │
    ├─ External API Call [async]
    │   └─> httpx.AsyncClient.get(HERE_API)
    │
    └─> Return Response
```

---

## Performance Optimization Opportunities

### Current Structure
1. **Indexes**: Already created in db_init.py
2. **Async/Await**: Using Motor for async MongoDB
3. **Geospatial**: 2dsphere index for charger queries
4. **Session**: TTL index for auto-cleanup

### Future Improvements (Modular)
1. **Caching**: Add Redis for frequently accessed chargers
2. **Query Batching**: Group charger lookups
3. **Connection Pooling**: Configure Motor pool size
4. **Database Sharding**: By region if scaling
5. **API Rate Limiting**: Already implemented (slowapi)

---

## Summary of Key Dependencies

```
Tight Coupling (Current):
├─ All code in server.py
├─ Models mixed with routes
├─ Database calls in route handlers
└─ Business logic scattered

Loose Coupling (Proposed):
├─ Separate layers: routes → services → db
├─ Models in own files
├─ Services abstract database operations
├─ Routes only handle HTTP concerns
└─ Easy to test and maintain
```

