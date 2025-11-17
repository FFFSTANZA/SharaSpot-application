# SharaSpot Backend - Quick Reference Summary

## Key Statistics
- **Language**: Python 3
- **Framework**: FastAPI
- **Database**: MongoDB (Motor async driver)
- **Total Backend Code**: ~3,800 lines
- **Main File**: server.py (1,418 lines) or server_v2.py (1,189 lines)
- **Architecture**: Monolithic (currently), targeting Modular Monolith refactoring

## Core Components

### 1. Authentication (7 endpoints)
- Signup, Login, OAuth integration, Guest sessions
- 7-day session expiry with TTL auto-cleanup
- Password hashing with bcrypt

### 2. Charger Management (4 endpoints)
- Search/list chargers with geospatial filtering
- Add new chargers
- Get charger details
- Verify charger condition and status

### 3. Gamification & Wallet (4 endpoints)
- SharaCoin rewards (5, 3, 2, 1 coins per action)
- Trust score calculation (max 100)
- Coin transaction history
- User statistics dashboard

### 4. EV Routing (1 endpoint)
- Integration with HERE Maps API
- Multiple route alternatives (eco, balanced, fastest)
- Chargers along route recommendation
- Traffic and weather integration

### 5. User Settings (2 endpoints)
- Theme preference (light/dark)
- Notification settings
- User preferences (port type, vehicle type)

## Database Collections

| Collection | Indexes | Purpose |
|------------|---------|---------|
| users | email, id (unique) | User profiles & gamification data |
| user_sessions | session_token, user_id, expires_at (TTL) | Active sessions |
| chargers | id, added_by, verification_level, geospatial | EV charging locations |
| coin_transactions | id, [user_id, timestamp] | Coin earn/spend ledger |

## Security Features Implemented
- Rate limiting (auth: 5/min, write: 20/min, read: 60/min)
- Input validation on all endpoints
- Password strength requirements
- CORS configuration with allowed origins
- Security headers (X-Content-Type-Options, CSP, HSTS, etc.)
- Error sanitization (generic messages, internal logging)
- Session-based authentication with HttpOnly cookies
- Async database operations prevent blocking

## Current Architecture Issues

**Monolithic Structure:**
```
server.py (1,418 lines)
├── 20+ Pydantic models
├── 25+ API routes
├── 10+ business logic functions
├── Inline database operations
└── Mixed concerns throughout
```

**Pain Points:**
- Difficult to find code (models at top, routes in middle, logic scattered)
- Hard to test (no clear interfaces)
- Difficult to reuse (duplicated logic)
- Coupling between features
- Inconsistent patterns

## Refactoring Target: Modular Monolith

**Proposed Structure:**
```
backend/
├── core/                    # Shared utilities
│   ├── security.py
│   ├── exceptions.py
│   └── dependencies.py
├── modules/                 # Feature modules
│   ├── auth/
│   ├── chargers/
│   ├── gamification/
│   ├── routing/
│   └── settings/
├── shared/                  # Shared code
│   ├── middleware.py        # (existing)
│   ├── validators.py        # (existing)
│   └── utils.py
├── db/                      # Database layer
│   └── init.py              # (existing)
├── config.py                # (existing)
└── app.py                   # Main FastAPI app
```

**Benefits:**
- Clear separation of concerns
- Easy to test (dependency injection)
- Easy to scale (add new modules)
- Easy to maintain (clear file structure)
- Easy to reuse (interfaces between modules)
- Monolithic deployment (single unit)

## Critical Path for Refactoring

### Phase 1: Foundation (Core)
1. Create core module structure
2. Move config-related code
3. Set up dependency injection
4. Create exception handling

### Phase 2: Authentication Module
1. Extract auth models
2. Extract auth routes
3. Create auth services
4. Create auth db operations
5. Update tests

### Phase 3: Chargers Module
1. Extract charger models
2. Create verification sub-module
3. Extract charger routes
4. Create charger services
5. Create charger db operations
6. Update tests

### Phase 4: Gamification Module
1. Extract gamification models
2. Extract gamification routes
3. Create gamification services
4. Create gamification db operations
5. Update tests

### Phase 5: Routing Module
1. Extract routing models
2. Extract routing routes
3. Create routing services
4. Extract HERE API integration
5. Create routing db operations
6. Update tests

### Phase 6: Settings Module
1. Extract settings routes
2. Create settings services
3. Create settings db operations
4. Update tests

### Phase 7: Integration
1. Test all inter-module dependencies
2. Verify all endpoints work
3. Performance testing
4. Final cleanup

## File Locations Reference

| Component | File | Lines |
|-----------|------|-------|
| Config | `/backend/config.py` | 267 |
| Main API | `/backend/server.py` | 1,418 |
| Alt Server | `/backend/server_v2.py` | 1,189 |
| Middleware | `/backend/middleware.py` | 153 |
| Validators | `/backend/validators.py` | 325 |
| DB Init | `/backend/db_init.py` | 186 |
| HERE API | `/backend/here_routing.py` | 268 |

## Key Dependencies

**Python Packages:**
- FastAPI 0.110.1
- Motor 3.3.1 (MongoDB async driver)
- Pydantic 2.12.4
- bcrypt 4.1.3
- httpx 0.27.0
- slowapi 0.1.9 (rate limiting)
- python-dotenv 1.2.1

**External Services:**
- MongoDB database
- HERE Maps Routing API (optional with fallback)
- Emergent Auth OAuth provider

## Gamification System Details

### Coin Rewards
```
Action              Amount  Frequency
─────────────────────────────────────
Add Charger         5       Per charger
Verify Charger      2       Multiple allowed
Upload Photo        3       Per photo
Report Invalid      1       Per report
Daily Login         1       Once per day
```

### Trust Score Formula
```
Score = (chargers_added × 10) + (verifications × 2) + (photos × 3)
Maximum Score: 100
```

### Verification Levels
```
Level  Threshold              Status
─────────────────────────────────────────────
5      8+ active in last 10   Excellent (Gold)
4      6+ active in last 10   Good (Silver)
3      4+ active in last 10   Acceptable (Bronze)
1-2    < 4 active verifs      Limited
```

## Quick Start Commands

```bash
# Run backend (production)
python -m uvicorn backend.server:app --reload

# Initialize database
python backend/db_init.py

# Run tests
pytest backend/

# API documentation
http://localhost:8000/api/v1/docs (Swagger UI)
http://localhost:8000/api/v1/redoc (ReDoc)
```

## Environment Variables Required

```
MONGO_URL=mongodb+srv://...
DB_NAME=sharaspot
HERE_API_KEY=... (optional, uses fallback if missing)
LOG_LEVEL=INFO
```

## Performance Characteristics

### Database Optimization
- **Geospatial Indexes**: 2dsphere index on chargers for location queries
- **TTL Indexes**: Automatic session cleanup
- **Compound Indexes**: [user_id, timestamp] for transaction lookups
- **Unique Indexes**: email, session_token, charger_id

### Async/Await
- All database calls are async (Motor)
- External API calls are async (httpx)
- No blocking I/O operations

### Rate Limiting
- Per-IP tracking
- Per-endpoint configuration
- Custom error responses

## Known Limitations & Improvements

### Current Limitations
1. All code in single file (server.py)
2. No caching layer (Redis)
3. Mock data for weather
4. Limited pagination options
5. No transaction rollback capability

### Recommended Improvements
1. Implement modular structure (in progress)
2. Add Redis caching for frequent queries
3. Integrate actual weather API
4. Add database migrations
5. Implement soft deletes
6. Add audit logging
7. Create comprehensive API tests

## Testing Strategy Post-Refactoring

### Unit Tests
- Test each service function independently
- Mock database calls
- Test validation logic
- Test business logic (coins, verification levels)

### Integration Tests
- Test module interactions
- Test database operations
- Test external API calls

### End-to-End Tests
- Test complete user flows
- Test error scenarios
- Test rate limiting

## Documentation Generated

- `BACKEND_ARCHITECTURE_OVERVIEW.md` - Complete architecture guide
- `BACKEND_ENDPOINTS_REFERENCE.md` - All endpoints with examples
- `BACKEND_MODULE_DEPENDENCIES.md` - Dependency graphs and data flows
- `BACKEND_ANALYSIS_SUMMARY.md` - This file

## Next Steps

1. Review this documentation
2. Start Phase 1: Create core module structure
3. Create skeleton for each module
4. Move code incrementally
5. Update tests as you go
6. Deploy and verify

## Contact & Support

For questions about the architecture:
- Review the generated documentation files
- Check config.py for all constants
- Review error messages in middleware.py
- Check validators.py for validation rules

