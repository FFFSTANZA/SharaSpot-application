# Getting Started with SharaSpot

Welcome to SharaSpot! This guide will help you get the application up and running quickly.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Python 3.9+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/)
- **Yarn 1.22+** - [Install](https://classic.yarnpkg.com/en/docs/install)

### Optional but Recommended
- **Docker** - For containerized development
- **Git** - For version control
- **VS Code** - Recommended IDE with Python and TypeScript extensions

---

## 🚀 Backend Setup

### 1. Install PostgreSQL with PostGIS

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib postgis

# macOS (using Homebrew)
brew install postgresql postgis

# Windows
# Download and install from https://www.postgresql.org/download/windows/
```

### 2. Create Database

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE sharaspot;

# Connect to database
\c sharaspot

# Enable PostGIS extension
CREATE EXTENSION postgis;

# Exit
\q
```

### 3. Set Up Python Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 4. Install Dependencies

```bash
# Install Python packages
pip install -r requirements.txt
```

### 5. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

**Required environment variables:**

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/sharaspot
ASYNC_DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/sharaspot

# Security (generate a secure random key)
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External APIs (get these from respective providers)
MAPBOX_API_KEY=your_mapbox_key
OPENWEATHER_API_KEY=your_openweather_key

# AWS S3 (optional for local development)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=sharaspot-photos

# CORS
ALLOWED_ORIGINS=http://localhost:19006,http://localhost:8081,http://localhost:3000
```

### 6. Initialize Database

```bash
# Run migrations
alembic upgrade head

# (Optional) Seed initial data
python scripts/seed_data.py
```

### 7. Run Backend

```bash
# Start development server
uvicorn main:app --reload

# Server will start at http://localhost:8000
```

### 8. Verify Backend

Open your browser and visit:
- **API Documentation:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

---

## 📱 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
# Install all packages
yarn install
```

### 3. Configure Environment

```bash
# Create .env file
nano .env
```

**Add the following:**

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Start Development Server

```bash
# Start Expo dev server
yarn start
```

### 5. Run on Platform

Once the dev server starts, you can:

**Web:**
```bash
# Press 'w' in terminal, or
yarn web
```

**Android:**
```bash
# Press 'a' in terminal, or
yarn android
# Requires Android Studio and emulator
```

**iOS:**
```bash
# Press 'i' in terminal, or
yarn ios
# Requires Xcode (macOS only)
```

**Physical Device:**
- Install "Expo Go" app from App Store/Play Store
- Scan the QR code shown in terminal

---

## 🐳 Docker Setup (Alternative)

### Using Docker Compose

```bash
# Start all services
docker-compose up

# Backend will be at http://localhost:8000
# Frontend will be at http://localhost:19006
```

### Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgis/postgis:14-3.2
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: sharaspot
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/sharaspot
    depends_on:
      - db

volumes:
  postgres_data:
```

---

## 🧪 Verify Installation

### Backend Tests

```bash
cd backend

# Run tests
pytest

# With coverage
pytest --cov=. --cov-report=html
```

### Frontend Tests

```bash
cd frontend

# Run tests
yarn test
```

---

## 🔧 Common Issues

### Backend Issues

**Issue:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
# Solution: Ensure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

**Issue:** `psycopg2` installation fails
```bash
# Solution: Install PostgreSQL development files
# Ubuntu/Debian:
sudo apt-get install libpq-dev python3-dev

# macOS:
brew install postgresql
```

**Issue:** Database connection fails
```bash
# Solution: Check PostgreSQL is running
sudo service postgresql status  # Linux
brew services list              # macOS

# Check DATABASE_URL in .env matches your setup
```

### Frontend Issues

**Issue:** `Cannot find module 'expo'`
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules
yarn install
```

**Issue:** Metro bundler port conflict
```bash
# Solution: Kill process on port 8081
# Linux/macOS:
lsof -ti:8081 | xargs kill

# Windows:
netstat -ano | findstr :8081
taskkill /PID [PID] /F
```

**Issue:** Expo Go connection issues
```bash
# Solution: Ensure devices are on same network
# Or use tunnel mode:
yarn start --tunnel
```

---

## 📚 Next Steps

Now that you have SharaSpot running:

1. **Explore the API** - Visit http://localhost:8000/docs
2. **Read Architecture Docs** - [MODULAR_MONOLITH_ARCHITECTURE.md](./MODULAR_MONOLITH_ARCHITECTURE.md)
3. **Understand Modules** - [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)
4. **Build Features** - [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
5. **Deploy** - [DEPLOYMENT.md](./DEPLOYMENT.md) *(coming soon)*

---

## 🆘 Getting Help

- **Documentation:** Check [docs/](../docs/)
- **Issues:** [GitHub Issues](https://github.com/FFFSTANZA/SharaSpot-application/issues)
- **Discussions:** [GitHub Discussions](https://github.com/FFFSTANZA/SharaSpot-application/discussions)

---

## 🎉 You're Ready!

Your SharaSpot development environment is now set up and running. Happy coding! 🚀
