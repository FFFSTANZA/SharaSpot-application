# Security Policy

## Overview

SharaSpot implements comprehensive security measures to protect user data and prevent common web vulnerabilities. This document outlines our security architecture and best practices.

## Security Features Implemented

### 1. CORS Protection ✅ (P0 - CRITICAL)

**Status:** SECURE

- **Configuration:** Whitelist-based origin control
- **Default:** Development origins (`http://localhost:8081`, `http://localhost:19006`, `exp://localhost:8081`)
- **Production:** Must set `CORS_ORIGINS` environment variable with production domains
- **Location:** `backend/app/core/config.py:67-70`, `backend/main.py:41-47`

```python
# Production example:
CORS_ORIGINS=https://sharaspot.com,https://www.sharaspot.com,https://app.sharaspot.com
```

**Protection Against:**
- Cross-Site Request Forgery (CSRF)
- Unauthorized API access from unknown origins

---

### 2. Rate Limiting ✅ (P0 - CRITICAL)

**Status:** ACTIVE

All authentication endpoints are protected with rate limiting using SlowAPI:

| Endpoint | Rate Limit | Purpose |
|----------|-----------|---------|
| `/auth/signup` | 5/minute | Prevent account enumeration |
| `/auth/login` | 5/minute | Prevent brute force attacks |
| `/auth/guest` | 5/minute | Prevent abuse |
| `/auth/refresh` | 10/minute | Token refresh throttling |

**Configuration:** `backend/app/core/config.py:144-146`
**Implementation:** `backend/app/api/auth.py:20, 41, 70, 123`

**Protection Against:**
- Brute force password attacks
- Account enumeration
- Credential stuffing
- DDoS attempts

---

### 3. Input Validation & Sanitization ✅ (P1 - HIGH)

**Status:** IMPLEMENTED

#### 3.1 Email Validation
- Uses Pydantic's `EmailStr` for RFC-compliant email validation
- Location: `backend/app/schemas/auth.py:8, 41`

#### 3.2 Password Security
- **Minimum Length:** 8 characters
- **Maximum Length:** 128 characters
- **Complexity Requirements:**
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
- **Storage:** Bcrypt hashing with salt
- Location: `backend/app/schemas/auth.py:24-36`

#### 3.3 XSS Prevention
All user-generated content is HTML-escaped to prevent XSS attacks:

**Sanitized Fields:**
- User names
- Charger names and addresses
- Notes and comments
- Port types, amenities lists
- Verification action notes

**Implementation:**
```python
import html

@field_validator('name', 'address', 'notes')
@classmethod
def sanitize_html(cls, v):
    if v is not None:
        return html.escape(v)
    return v
```

**Location:** `backend/app/schemas/charger.py:40-54`, `backend/app/schemas/auth.py:16-22`

#### 3.4 Coordinate Validation
- Latitude: -90 to 90 degrees
- Longitude: -180 to 180 degrees
- Location: `backend/app/schemas/charger.py:31-32`

#### 3.5 String Length Limits
| Field | Max Length | Purpose |
|-------|-----------|---------|
| Charger name | 200 chars | Prevent buffer overflow |
| Address | 500 chars | Reasonable address length |
| Notes | 2000 chars | Detailed notes |
| User name | 100 chars | Standard name length |
| Password | 128 chars | Security best practice |

#### 3.6 Enum Validation
Strict pattern matching for categorical fields:
- **Verification action:** `active`, `not_working`, `partial`
- **Port types:** `Type 1`, `Type 2`, `CCS`, `CHAdeMO`, `Tesla`
- **Payment methods:** `App`, `Card`, `Cash`, `Free`, `Subscription`
- **Station lighting:** `Well-lit`, `Adequate`, `Poor`
- **Distance units:** `km`, `mi`
- **Vehicle types:** `Sedan`, `SUV`, `Truck`, `Van`, `Motorcycle`, `Other`

**Location:** `backend/app/schemas/charger.py:59-68`, `backend/app/schemas/auth.py:47-49`

---

### 4. Database Security ✅

**Status:** PRODUCTION-READY

#### 4.1 Geospatial Query Optimization
- **Index:** Composite B-tree index on `(latitude, longitude)`
- **Query Performance:** Optimized bounding box searches
- **Location:** `backend/alembic/versions/001_initial_migration.py:87`
- **Model Definition:** `backend/app/core/db_models.py:166`

```sql
CREATE INDEX idx_charger_location ON chargers (latitude, longitude);
```

#### 4.2 Additional Indexes
- `verification_level` - Fast filtering by trust level
- `created_at` - Pagination ordering
- `user_id` + `timestamp` - User activity tracking
- `charger_id` + `timestamp` - Charger history

#### 4.3 SQL Injection Protection
- **ORM:** SQLAlchemy with parameterized queries
- **No Raw SQL:** All queries use SQLAlchemy's query builder
- **Async Driver:** asyncpg for PostgreSQL

---

### 5. Authentication & Session Security ✅

#### 5.1 Account Lockout
- **Max Failed Attempts:** 5
- **Lockout Duration:** 15 minutes
- **Fields:** `failed_login_attempts`, `account_locked_until`, `last_failed_login`
- **Location:** `backend/app/core/db_models.py:43-45`

#### 5.2 JWT Tokens
- **Access Token:** 30 minutes expiry
- **Refresh Token:** 7 days expiry
- **Algorithm:** HS256
- **Secret:** Configurable via `JWT_SECRET_KEY` environment variable

#### 5.3 OAuth Security
- **Provider:** Google OAuth 2.0
- **State Parameter:** CSRF protection with 10-minute expiry
- **Token Storage:** Server-side encrypted storage
- **Location:** `backend/app/core/db_models.py:81-126`

#### 5.4 Cookie Security
- **HttpOnly:** ✅ Prevents XSS access to cookies
- **Secure:** ✅ HTTPS-only transmission (production)
- **SameSite:** `none` for cross-origin support (mobile apps)
- **Location:** `backend/app/core/config.py:88-91`

---

### 6. Security Headers ✅

Implemented via custom middleware:

```python
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Location:** `backend/app/core/middleware.py`

---

## Vulnerability Remediation Summary

| Issue | Priority | Status | Fix |
|-------|----------|--------|-----|
| CORS allows all origins | P0 | ✅ FIXED | Whitelist-based configuration |
| No rate limiting | P0 | ✅ FIXED | SlowAPI rate limiting active |
| Missing geospatial indexes | P1 | ✅ VERIFIED | Index exists in migrations |
| No email validation | P1 | ✅ FIXED | Pydantic EmailStr validation |
| XSS vulnerabilities | P1 | ✅ FIXED | HTML escaping all user input |
| Weak password policy | P1 | ✅ FIXED | Complexity requirements enforced |
| No input length limits | P1 | ✅ FIXED | Pydantic constr constraints |

---

## Security Best Practices for Deployment

### Environment Variables
1. **Generate strong JWT secret:**
   ```bash
   openssl rand -hex 32
   ```

2. **Set production CORS origins:**
   ```env
   CORS_ORIGINS=https://sharaspot.com,https://api.sharaspot.com
   ```

3. **Enable HTTPS cookies:**
   ```env
   COOKIE_SECURE=True
   ```

### Database
1. Use strong PostgreSQL credentials
2. Enable SSL/TLS connections
3. Regular backups and point-in-time recovery
4. Connection pooling properly configured (20 base + 40 overflow)

### API Keys
1. Store all API keys in environment variables
2. Never commit `.env` files to version control
3. Rotate keys periodically
4. Use separate keys for development/staging/production

### Monitoring
1. Monitor rate limit violations
2. Track failed login attempts
3. Alert on account lockouts
4. Log all authentication events

---

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email: security@sharaspot.com

**Do NOT** create public GitHub issues for security vulnerabilities.

---

## Security Checklist for Developers

- [ ] All user input validated and sanitized
- [ ] No SQL queries use string concatenation
- [ ] Sensitive data encrypted at rest and in transit
- [ ] Authentication required for all protected endpoints
- [ ] Rate limiting applied to public endpoints
- [ ] CORS origins properly configured
- [ ] Security headers implemented
- [ ] Dependencies regularly updated
- [ ] Environment variables never hardcoded
- [ ] Passwords hashed with bcrypt
- [ ] Session tokens securely generated and stored

---

## Compliance

- **OWASP Top 10:** Mitigated
- **Data Protection:** PostgreSQL encryption at rest
- **Password Storage:** Bcrypt (industry standard)
- **API Security:** JWT + Rate Limiting + CORS

---

Last Updated: 2025-11-17
Version: 2.0.0
