# SharaSpot - EV Charging Station Network

SharaSpot is a comprehensive EV charging station discovery and route planning application built with a modern modular monolith architecture.

[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20Native-61DAFB.svg)](https://reactnative.dev/)
[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue.svg)](./docs/MODULAR_MONOLITH_ARCHITECTURE.md)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)](./DEEP_CHECK_COMPLETE.md)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+ with PostGIS
- Yarn 1.22

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
alembic upgrade head

# Run server
uvicorn main:app --reload
```

Visit **http://localhost:8000/docs** for API documentation

### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Start development server
yarn start

# Run on specific platform
yarn android  # Android
yarn ios      # iOS
yarn web      # Web browser
```

---

## 📁 Architecture

### Modular Monolith Structure

SharaSpot uses a **modular monolith architecture** combining the simplicity of a monolith with the modularity of microservices.

#### Backend (FastAPI + Python)

```
backend/
├── modules/                    # Domain Modules
│   ├── auth/                  # Authentication & Users
│   ├── chargers/              # Charger Management
│   ├── routing/               # Route Planning
│   ├── gamification/          # Coins & Rewards
│   ├── profile/               # User Profiles
│   └── analytics/             # Metrics & Reporting
│
├── shared/                     # Shared Kernel
│   ├── domain/                # DDD Primitives
│   ├── application/           # CQRS Patterns
│   └── infrastructure/        # Database, Events
│
├── main.py                     # Application Entry Point
└── container.py                # Dependency Injection
```

**Key Patterns:**
- ✅ Domain-Driven Design (DDD)
- ✅ CQRS (Command Query Responsibility Segregation)
- ✅ Event-Driven Architecture
- ✅ Repository Pattern
- ✅ Dependency Injection

#### Frontend (React Native + Expo)

```
frontend/src/
├── features/                   # Feature Modules
│   ├── auth/                  # Authentication
│   ├── chargers/              # Charger Management
│   ├── map/                   # Interactive Map
│   ├── profile/               # User Profile
│   └── routing/               # Route Planning
│
└── shared/                     # Shared Infrastructure
    ├── api/                   # API Client
    ├── ui/                    # Component Library
    ├── hooks/                 # Custom Hooks
    ├── store/                 # State Management
    └── utils/                 # Utilities
```

**Key Patterns:**
- ✅ Feature-Based Organization
- ✅ Zustand State Management
- ✅ Atomic Design (UI Components)
- ✅ Custom Hooks
- ✅ Type-Safe API Client

---

## 🎯 Features

### For Users
- 🔍 **Discover Charging Stations** - Find nearby EV chargers with real-time availability
- 🗺️ **Smart Route Planning** - Optimized routes with charging stops
- ⚡ **Energy Calculations** - Accurate battery consumption predictions
- ⭐ **Community Verification** - Crowdsourced station status updates
- 🪙 **Rewards System** - Earn coins for contributions
- 📱 **Cross-Platform** - iOS, Android, and Web

### For Developers
- 🏗️ **Clean Architecture** - Modular monolith with clear boundaries
- 🔧 **Easy to Maintain** - Well-organized, documented code
- 🧪 **Testable** - Isolated modules, dependency injection
- 📈 **Scalable** - Can extract modules to microservices
- 🚀 **Production Ready** - Fully verified, zero errors

---

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI 0.110.1
- **Database:** PostgreSQL + PostGIS
- **ORM:** SQLAlchemy 2.0.27 (async)
- **Authentication:** JWT + OAuth2 (Google)
- **Storage:** AWS S3
- **APIs:** Mapbox, OpenWeatherMap
- **Testing:** Pytest

### Frontend
- **Framework:** React Native 0.79.5 + Expo 54
- **Language:** TypeScript 5.8.3
- **State:** Zustand 4.5.0
- **Navigation:** Expo Router 5.1.4
- **HTTP:** Axios 1.13.2
- **Maps:** react-native-maps

---

## 📚 Documentation

### Architecture & Design
- **[Modular Monolith Architecture](./docs/MODULAR_MONOLITH_ARCHITECTURE.md)** - Complete architecture guide
- **[Backend Documentation](./docs/BACKEND_DOCUMENTATION.md)** - API reference and patterns
- **[Frontend Documentation](./docs/FRONTEND_DOCUMENTATION.md)** - Components and state management

### Migration & Setup
- **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - How the architecture was built
- **[Migration Complete](./MIGRATION_COMPLETE.md)** - Migration summary
- **[Verification Report](./DEEP_CHECK_COMPLETE.md)** - Comprehensive verification

### Algorithms & Logic
- **[Route Planning](./docs/ECO_ROUTE_DOCUMENTATION.md)** - Energy-optimized routing
- **[Verification System](./docs/REPORT_VERIFICATION.md)** - Community verification algorithm

---

## 🎨 Module Overview

### Auth Module
**Purpose:** User authentication and management

**Features:**
- Email/password authentication
- Google OAuth integration
- Guest sessions
- Account lockout protection
- JWT token management

**API:** `/api/auth/*`

### Chargers Module
**Purpose:** EV charging station management

**Features:**
- Geospatial search (PostGIS)
- Community verification
- Photo uploads (AWS S3)
- Real-time availability
- Spam detection

**API:** `/api/chargers/*`

### Routing Module
**Purpose:** Intelligent route planning

**Features:**
- Multi-stop route optimization
- Energy consumption modeling
- Weather-based calculations
- 3 route alternatives
- Charging stop suggestions

**API:** `/api/routing/*`

### Gamification Module
**Purpose:** Rewards and incentives

**Features:**
- Coin rewards for contributions
- Trust score calculation
- Transaction history
- Time-decay weighted scoring

**API:** `/api/gamification/*`

### Profile Module
**Purpose:** User profile management

**Features:**
- User preferences
- Vehicle configuration
- Activity history
- Statistics dashboard

**API:** `/api/profile/*`

### Analytics Module
**Purpose:** Business metrics and reporting

**Features:**
- User growth tracking
- Engagement metrics
- Activity analytics
- Cached aggregations

**API:** `/api/analytics/*`

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific module
pytest tests/test_chargers.py
```

### Frontend Tests

```bash
cd frontend

# Run tests
yarn test

# Run with coverage
yarn test --coverage
```

---

## 🚀 Deployment

### Backend Deployment

```bash
# Using Docker
docker build -t sharaspot-backend ./backend
docker run -p 8000:8000 sharaspot-backend

# Using Heroku
heroku create sharaspot-backend
git subtree push --prefix backend heroku main
```

### Frontend Deployment

```bash
cd frontend

# Build for production
expo build:android
expo build:ios
expo build:web

# Deploy with EAS
eas build --platform all
```

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/sharaspot
ASYNC_DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/sharaspot

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External APIs
MAPBOX_API_KEY=your-mapbox-key
OPENWEATHER_API_KEY=your-openweather-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=sharaspot-photos

# CORS
ALLOWED_ORIGINS=http://localhost:19006,http://localhost:8081
```

### Frontend (.env)

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Backend Modules** | 6 |
| **Backend Python Files** | 81 |
| **Frontend Features** | 5 |
| **Frontend TypeScript Files** | 52 |
| **API Endpoints** | 27 |
| **Database Tables** | 9 |
| **UI Components** | 14 |
| **Total Lines of Code** | ~15,000 |


</div>
