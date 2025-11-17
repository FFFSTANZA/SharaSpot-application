# SharaSpot Backend - Modular Monolith Architecture

## Overview

The SharaSpot backend has been refactored from a monolithic single-file architecture to a **Modular Monolith** architecture. This improves code organization, maintainability, testability, and scalability while maintaining the simplicity of a single deployable unit.

## Architecture

```
backend/
├── app/
│   ├── api/              # Route handlers (organized by domain)
│   │   ├── __init__.py
│   │   ├── auth.py       # Authentication routes
│   │   ├── chargers.py   # Charger routes
│   │   ├── routing.py    # EV routing routes
│   │   └── profile.py    # Profile & wallet routes
│   │
│   ├── services/         # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── charger_service.py
│   │   ├── gamification_service.py
│   │   ├── routing_service.py
│   │   └── profile_service.py
│   │
│   ├── models/           # Database models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── charger.py
│   │   ├── coin.py
│   │   └── routing.py
│   │
│   ├── schemas/          # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── charger.py
│   │   ├── profile.py
│   │   └── routing.py
│   │
│   └── core/             # Configuration, security, utilities
│       ├── __init__.py
│       ├── config.py
│       ├── database.py
│       ├── security.py
│       └── utils.py
│
├── main.py              # Single entry point
├── requirements.txt     # Dependencies
└── README.md           # This file
```

## Layer Responsibilities

### 1. API Layer (`app/api/`)
- **Purpose**: HTTP route handlers
- **Responsibilities**:
  - Request validation
  - Response formatting
  - Session/authentication checks
  - HTTP-specific logic
- **Dependencies**: Services, Schemas, Core

### 2. Services Layer (`app/services/`)
- **Purpose**: Business logic
- **Responsibilities**:
  - Core business operations
  - Data manipulation
  - External API integration
  - Gamification logic
- **Dependencies**: Models, Core, Database

### 3. Models Layer (`app/models/`)
- **Purpose**: Database models
- **Responsibilities**:
  - Define data structures
  - Database schema representation
- **Dependencies**: None (Pydantic only)

### 4. Schemas Layer (`app/schemas/`)
- **Purpose**: Request/Response validation
- **Responsibilities**:
  - API input validation
  - API output formatting
- **Dependencies**: None (Pydantic only)

### 5. Core Layer (`app/core/`)
- **Purpose**: Shared utilities and configuration
- **Responsibilities**:
  - Configuration management
  - Database connection
  - Security (auth, hashing)
  - Common utilities
- **Dependencies**: None (or minimal)

## Key Features

### Separation of Concerns
- **Routes** handle HTTP
- **Services** handle business logic
- **Models** handle data structure
- **Core** handles infrastructure

### Benefits
1. **Maintainability**: Clear organization makes code easy to find and modify
2. **Testability**: Services can be tested independently of HTTP layer
3. **Reusability**: Business logic can be reused across different routes
4. **Scalability**: Easy to add new features without touching existing code
5. **Team Collaboration**: Multiple developers can work on different modules

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your actual values:
   - Database credentials
   - API keys (HERE, OpenWeather)
   - Google OAuth credentials
   - **CORS_ORIGINS** (comma-separated list of allowed origins)

3. Run database migrations:
```bash
alembic upgrade head
```

## Running the Application

```bash
# Start the server
cd backend
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/session-data` - OAuth session processing
- `GET /api/auth/me` - Get current user
- `POST /api/auth/guest` - Create guest session
- `POST /api/auth/logout` - Logout
- `PUT /api/auth/preferences` - Update preferences

### Chargers (`/api/chargers`)
- `GET /api/chargers` - List chargers with filters
- `POST /api/chargers` - Add new charger
- `GET /api/chargers/{id}` - Get charger details
- `POST /api/chargers/{id}/verify` - Verify charger status

### Routing (`/api/routing`)
- `POST /api/routing/here/calculate` - Calculate EV routes

### Profile & Wallet
- `GET /api/profile/activity` - User activity
- `GET /api/wallet/transactions` - Coin transactions
- `PUT /api/settings` - Update settings
- `GET /api/profile/stats` - Profile statistics

## Migration Notes

### Changes from Old Architecture
- ✅ All routes preserved with same endpoints
- ✅ All functionality maintained
- ✅ Database operations unchanged
- ✅ API contracts unchanged (backward compatible)

### What's New
- 📁 Organized file structure
- 🔧 Testable service layer
- 📚 Clear separation of concerns
- 🎯 Single responsibility principle
- 🧪 Easier to write unit tests

## Security Features

### CORS Configuration
- **Whitelisted Origins**: Configure allowed origins via `CORS_ORIGINS` environment variable
- **Restricted Methods**: Only `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS` allowed
- **Restricted Headers**: Only necessary headers permitted
- **Production**: Always set specific domains, never use `*`

### Rate Limiting
- **Authentication Endpoints**: 5 requests/minute for login/signup/guest
- **Write Operations**: 20 requests/minute (configurable)
- **Read Operations**: 60 requests/minute (configurable)

### Account Security
- **Failed Login Protection**: Tracks failed login attempts per user
- **Account Lockout**: After 5 failed attempts, account locks for 15 minutes
- **Automatic Unlock**: Lockout expires automatically after duration
- **Progressive Feedback**: Users informed of remaining attempts

### Additional Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Testing

```bash
# Run tests (when implemented)
pytest

# Type checking
mypy app/

# Code formatting
black app/

# Linting
flake8 app/
```

## Future Enhancements

1. **Dependency Injection**: Use FastAPI's dependency injection more extensively
2. **Testing**: Add comprehensive unit and integration tests
3. **Database Layer**: Add repository pattern for data access
4. **Caching**: Add Redis caching layer
5. **Async Optimization**: Optimize async operations
6. **Monitoring**: Add structured logging and metrics
7. **Documentation**: Auto-generate API docs with OpenAPI

## Version

**Current Version**: 2.0.0 (Modular Monolith)
**Previous Version**: 1.0.0 (Monolithic)

---

For questions or issues, please refer to the project documentation or contact the development team.
