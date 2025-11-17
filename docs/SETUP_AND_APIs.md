# SharaSpot - Setup Guide & API Requirements

## Table of Contents
- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [External APIs Required](#external-apis-required)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Project Overview

**SharaSpot** is a community-driven EV charging station finder and verification platform with:
- Smart eco-routing for electric vehicles
- Community verification system with gamification
- Real-time charger availability tracking
- Turn-by-turn navigation with voice guidance

### Technology Stack

**Backend**:
- FastAPI (Python 3.11+)
- PostgreSQL with PostGIS
- SQLAlchemy (async ORM)
- Redis (rate limiting)

**Frontend**:
- React Native (Expo SDK 49)
- TypeScript
- Mapbox Maps
- Expo Router

---

## Prerequisites

### System Requirements
- **Python**: 3.11 or higher
- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher (with PostGIS extension)
- **Redis**: 7.x or higher (optional, for rate limiting)
- **Git**: For version control

### Development Tools
- **Code Editor**: VS Code recommended
- **API Testing**: Postman or Insomnia
- **iOS Development**: Xcode (macOS only)
- **Android Development**: Android Studio

---

## Backend Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd SharaSpot-application/backend
```

---

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

**Main Dependencies**:
- `fastapi==0.104.1` - Web framework
- `uvicorn[standard]==0.24.0` - ASGI server
- `sqlalchemy==2.0.23` - ORM
- `asyncpg==0.29.0` - PostgreSQL driver
- `alembic==1.12.1` - Database migrations
- `bcrypt==4.1.1` - Password hashing
- `python-jose[cryptography]==3.3.0` - JWT tokens
- `boto3==1.29.7` - AWS S3 integration
- `aiohttp==3.9.1` - Async HTTP client
- `slowapi==0.1.9` - Rate limiting

---

### 4. Configure Environment Variables

Create `.env` file in `backend/` directory:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/sharaspot

# Security
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET_KEY=your-super-secret-session-key-change-this

# External APIs (see "External APIs Required" section below)
MAPBOX_API_KEY=pk.eyJ1...
OPENWEATHER_API_KEY=your-openweather-api-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# AWS S3 (for photo storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=sharaspot-photos
AWS_REGION=us-east-1

# Redis (optional, for rate limiting)
REDIS_URL=redis://localhost:6379/0

# App Settings
ENVIRONMENT=development
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

---

### 5. Generate Secret Keys

```bash
# Generate JWT secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate session secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the generated keys to your `.env` file.

---

### 6. Setup Database

**Install PostgreSQL**:
```bash
# macOS
brew install postgresql postgis

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib postgis

# Windows: Download from postgresql.org
```

**Create Database**:
```bash
# Start PostgreSQL service
# macOS
brew services start postgresql

# Ubuntu/Linux
sudo systemctl start postgresql

# Create database
createdb sharaspot

# Enable PostGIS extension
psql sharaspot -c "CREATE EXTENSION postgis;"
```

---

### 7. Run Database Migrations

```bash
# Navigate to backend directory
cd backend

# Run migrations
alembic upgrade head
```

**Create New Migration** (if you made model changes):
```bash
alembic revision --autogenerate -m "description of changes"
alembic upgrade head
```

---

### 8. Start Backend Server

```bash
# Development mode (with auto-reload)
uvicorn app.main:app --reload --port 8000

# Production mode
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Verify Backend**:
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd ../frontend
```

---

### 2. Install Dependencies

```bash
npm install
```

**Main Dependencies**:
- `expo`: ~49.0.0
- `react`: 18.2.0
- `react-native`: 0.72.6
- `expo-router`: ~2.0.0
- `react-native-maps`: 1.7.1
- `axios`: ^1.6.0
- `expo-secure-store`: ~12.3.1
- `expo-location`: ~16.1.0
- `expo-speech`: ~11.3.0

---

### 3. Configure Environment

Create `.env` file in `frontend/` directory:

```bash
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:8000

# Mapbox (for maps)
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1...

# Google OAuth (optional, if using OAuth)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

### 4. Start Development Server

```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # Web browser
```

**QR Code**: Scan with Expo Go app on your phone for live testing.

---

## External APIs Required

### 1. Mapbox API (Required)

**Purpose**: Routing, navigation, and maps

**Pricing**: Free tier available (50,000 requests/month)

**Setup**:
1. Create account at https://account.mapbox.com/
2. Go to "Access Tokens"
3. Create new token with these scopes:
   - `styles:tiles`
   - `styles:read`
   - `fonts:read`
   - `datasets:read`
   - `vision:read`
4. Copy token to `.env` as `MAPBOX_API_KEY`

**Documentation**: https://docs.mapbox.com/api/

---

### 2. OpenWeatherMap API (Required)

**Purpose**: Weather data for routes

**Pricing**: Free tier (60 calls/minute, 1,000,000 calls/month)

**Setup**:
1. Create account at https://openweathermap.org/
2. Go to "API Keys"
3. Generate API key
4. Copy to `.env` as `OPENWEATHER_API_KEY`

**Documentation**: https://openweathermap.org/api

---

### 3. Google OAuth (Optional)

**Purpose**: Google Sign-In

**Pricing**: Free

**Setup**:
1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Create credentials:
   - **Web application** (for backend)
     - Authorized redirect URIs: `http://localhost:8000/api/auth/google/callback`
   - **iOS/Android** (for mobile app)
7. Copy Client ID and Secret to `.env`

**Documentation**: https://developers.google.com/identity/protocols/oauth2

---

### 4. AWS S3 (Required for Photo Upload)

**Purpose**: Photo storage

**Pricing**: Free tier (5GB storage, 20,000 GET requests, 2,000 PUT requests/month)

**Setup**:
1. Create AWS account at https://aws.amazon.com/
2. Go to S3 → Create Bucket
   - Bucket name: `sharaspot-photos`
   - Region: `us-east-1` (or your preferred region)
   - Block public access: OFF (we use presigned URLs)
3. Create IAM user:
   - Go to IAM → Users → Add User
   - Access type: Programmatic access
   - Attach policy: `AmazonS3FullAccess`
   - Copy Access Key ID and Secret Access Key
4. Add credentials to `.env`

**CORS Configuration** (in S3 bucket settings):
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

**Documentation**: https://docs.aws.amazon.com/s3/

---

### 5. Open-Topo-Data (FREE, Optional to Self-Host)

**Purpose**: Elevation data for energy calculations

**Pricing**: FREE (public API or self-host)

**Setup**:
- **Option 1**: Use public API (no setup required)
  - URL: `https://api.opentopodata.org/v1/srtm30m`
  - Rate limit: Be respectful, cache results

- **Option 2**: Self-host (Docker)
  ```bash
  docker run -d -p 5000:5000 \
    -v $(pwd)/data:/app/data \
    opentopodata/opentopodata
  ```

**Documentation**: https://www.opentopodata.org/

---

## Database Setup

### Schema Overview

**Tables**:
- `users` - User accounts
- `user_sessions` - Active sessions
- `chargers` - Charging stations
- `verification_actions` - Verification reports
- `coin_transactions` - Gamification transactions
- `oauth_tokens` - OAuth credentials
- `oauth_states` - CSRF protection
- `analytics_events` - User activity tracking

---

### Initial Data (Optional)

**Seed Database** with sample data:

```bash
# Create seed script
python scripts/seed_database.py
```

**Sample Seed Script** (`scripts/seed_database.py`):
```python
import asyncio
from app.core.database import AsyncSessionLocal
from app.services.charger_service import add_charger

async def seed_chargers():
    async with AsyncSessionLocal() as db:
        # Add sample chargers
        sample_chargers = [
            {
                "name": "DLF CyberHub Charging Station",
                "address": "DLF Cyber City, Gurugram",
                "latitude": 28.4950,
                "longitude": 77.0890,
                "port_types": ["ccs2", "type2"],
                "total_ports": 4,
                "amenities": ["restroom", "restaurant", "wifi"],
            },
            # Add more sample chargers
        ]

        for charger_data in sample_chargers:
            await add_charger(charger_data, [], system_user_id, db)

if __name__ == "__main__":
    asyncio.run(seed_chargers())
```

---

### Database Backup

```bash
# Backup database
pg_dump sharaspot > backup_$(date +%Y%m%d).sql

# Restore database
psql sharaspot < backup_20251117.sql
```

---

## Running the Application

### Development Mode

**Terminal 1** - Backend:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2** - Frontend:
```bash
cd frontend
npm start
```

**Terminal 3** - Redis (optional):
```bash
redis-server
```

---

### Production Mode

**Backend** (with Gunicorn):
```bash
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

**Frontend** (build and deploy):
```bash
# Web build
npm run build

# iOS build (requires Apple Developer account)
eas build --platform ios --profile production

# Android build
eas build --platform android --profile production
```

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

**Test Structure**:
```
backend/tests/
├── test_auth.py           # Authentication tests
├── test_chargers.py       # Charger API tests
├── test_verification.py   # Verification tests
├── test_routing.py        # Routing tests
└── test_analytics.py      # Analytics tests
```

---

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## Deployment

### Backend Deployment (Heroku Example)

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Create app
heroku create sharaspot-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET_KEY=your-key
heroku config:set MAPBOX_API_KEY=your-key
# ... set all other env vars

# Deploy
git push heroku main

# Run migrations
heroku run alembic upgrade head
```

---

### Frontend Deployment (Expo EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

---

## Environment Variables Summary

### Backend `.env`

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/sharaspot

# Security
JWT_SECRET_KEY=<generate-with-secrets.token_urlsafe(32)>
SESSION_SECRET_KEY=<generate-with-secrets.token_urlsafe(32)>

# External APIs
MAPBOX_API_KEY=pk.eyJ1...
OPENWEATHER_API_KEY=<your-key>
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>

# AWS S3
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_S3_BUCKET=sharaspot-photos
AWS_REGION=us-east-1

# Redis
REDIS_URL=redis://localhost:6379/0

# App Settings
ENVIRONMENT=development|production
DEBUG=true|false
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

---

### Frontend `.env`

```bash
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:8000

# Mapbox
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1...

# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

---

## API Keys Cost Summary

| API | Free Tier | Cost After Free Tier |
|-----|-----------|---------------------|
| **Mapbox** | 50k requests/month | $5 per 1k requests |
| **OpenWeatherMap** | 1M calls/month | $0.0012 per call |
| **Google OAuth** | Unlimited | FREE |
| **AWS S3** | 5GB storage, 20k GET, 2k PUT/month | $0.023/GB storage |
| **Open-Topo-Data** | Unlimited (public API) | FREE (or self-host) |

**Estimated Monthly Cost** (for 10k users, 100k API calls):
- Mapbox: ~$250
- OpenWeather: ~$0 (within free tier)
- AWS S3: ~$5-10
- **Total**: ~$260/month

---

## Troubleshooting

### Common Issues

**Issue**: `ModuleNotFoundError: No module named 'app'`
**Solution**: Ensure you're in the backend directory and virtual environment is activated

**Issue**: `psycopg2.OperationalError: could not connect to server`
**Solution**: Check PostgreSQL is running: `brew services start postgresql`

**Issue**: `Expo error: Unable to resolve module`
**Solution**: Clear cache: `npm start -- --clear`

**Issue**: `CORS error in browser`
**Solution**: Add frontend URL to `ALLOWED_ORIGINS` in backend `.env`

**Issue**: `Mapbox map not loading`
**Solution**: Verify `MAPBOX_API_KEY` is correct in both backend and frontend

---

### Logs

**Backend Logs**:
```bash
# Development
tail -f logs/app.log

# Production (Heroku)
heroku logs --tail
```

**Frontend Logs**:
```bash
# Expo console shows logs automatically
# Or use React Native Debugger
```

---

## Next Steps

1. **Configure all API keys** in `.env` files
2. **Run database migrations**: `alembic upgrade head`
3. **Start backend**: `uvicorn app.main:app --reload`
4. **Start frontend**: `npm start`
5. **Test API**: Visit http://localhost:8000/docs
6. **Test app**: Scan QR code with Expo Go

---

## Additional Resources

- **Backend Documentation**: [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)
- **Frontend Documentation**: [FRONTEND_DOCUMENTATION.md](./FRONTEND_DOCUMENTATION.md)
- **Report Verification**: [REPORT_VERIFICATION.md](./REPORT_VERIFICATION.md)
- **Eco Route**: [ECO_ROUTE_DOCUMENTATION.md](./ECO_ROUTE_DOCUMENTATION.md)
- **Analytics API**: [METRICS_API_DOCUMENTATION.md](./METRICS_API_DOCUMENTATION.md)
- **Data Collection**: [../data/README.md](../data/README.md)

---

## Support

For issues and questions:
- **GitHub Issues**: <repository-url>/issues
- **Email**: support@sharaspot.com
- **Documentation**: https://docs.sharaspot.com

---

**Happy Coding! ⚡🚗**
