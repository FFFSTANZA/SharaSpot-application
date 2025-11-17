# SharaSpot Documentation

Welcome to the comprehensive documentation for **SharaSpot** - a community-driven EV charging station finder and verification platform.

## 📚 Documentation Index

### Getting Started
- **[Setup & API Requirements](./SETUP_AND_APIs.md)** - Complete setup guide, prerequisites, and external API configuration

### Backend Documentation
- **[Backend Documentation](./BACKEND_DOCUMENTATION.md)** - Complete backend architecture, API routes, services, and database models
- **[Metrics API](./METRICS_API_DOCUMENTATION.md)** - Analytics and business intelligence API endpoints

### Frontend Documentation
- **[Frontend Documentation](./FRONTEND_DOCUMENTATION.md)** - React Native app structure, components, and pages

### Feature Documentation
- **[Report Verification System](./REPORT_VERIFICATION.md)** - Comprehensive guide to the verification algorithm, trust scores, and coin rewards
- **[Eco Route & Navigation](./ECO_ROUTE_DOCUMENTATION.md)** - Smart routing, energy consumption model, and turn-by-turn navigation

### Data Collection
- **[Data Sources](../data/README.md)** - Information about data collection from multiple sources (located in data folder)

---

## 🚀 Quick Start

### 1. First Time Setup
Read [SETUP_AND_APIs.md](./SETUP_AND_APIs.md) for:
- Installing prerequisites
- Configuring environment variables
- Setting up external API keys
- Database initialization

### 2. Backend Development
Refer to [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md) for:
- API endpoint reference
- Service layer architecture
- Database models
- Security implementation

### 3. Frontend Development
Check [FRONTEND_DOCUMENTATION.md](./FRONTEND_DOCUMENTATION.md) for:
- Component library
- Page structure
- State management
- Navigation

### 4. Understanding Key Features

#### Verification System
The [Report Verification](./REPORT_VERIFICATION.md) system uses:
- Time-decay weighted scoring
- Trust-based user influence
- Anti-spam protection
- Dynamic verification levels (1-5)
- Gamified coin rewards (2-9 coins)

#### Smart Routing
The [Eco Route](./ECO_ROUTE_DOCUMENTATION.md) feature provides:
- Physics-based energy consumption model
- Elevation-aware routing
- Charger integration along routes
- Turn-by-turn voice navigation
- Real-time battery monitoring

#### Analytics
The [Metrics API](./METRICS_API_DOCUMENTATION.md) offers:
- User growth tracking
- Engagement metrics (DAU/WAU/MAU)
- Cohort retention analysis
- Feature adoption rates
- Gamification economy monitoring

---

## 🏗️ Architecture Overview

### Technology Stack

**Backend**:
- FastAPI (Python)
- PostgreSQL + PostGIS
- SQLAlchemy (async ORM)
- Redis (rate limiting)

**Frontend**:
- React Native (Expo)
- TypeScript
- Mapbox Maps
- Expo Router

**External APIs**:
- Mapbox Directions API (routing)
- OpenWeatherMap (weather data)
- Open-Topo-Data (elevation data)
- Google OAuth (authentication)
- AWS S3 (photo storage)

---

## 📖 Documentation Guide

### For New Developers

**Start Here**:
1. [SETUP_AND_APIs.md](./SETUP_AND_APIs.md) - Set up your development environment
2. [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md) - Understand the backend API
3. [FRONTEND_DOCUMENTATION.md](./FRONTEND_DOCUMENTATION.md) - Explore the mobile app structure

**Then Explore**:
- Verification system internals
- Routing algorithms
- Analytics implementation

---

### For API Users

**Essential Reading**:
1. [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md) - All API endpoints with request/response examples
2. [METRICS_API_DOCUMENTATION.md](./METRICS_API_DOCUMENTATION.md) - Analytics endpoints

**Interactive API Docs**:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

### For Product Managers

**Business Metrics**:
- [METRICS_API_DOCUMENTATION.md](./METRICS_API_DOCUMENTATION.md)
  - User growth tracking
  - Engagement rates
  - Retention analysis
  - Feature adoption

**Feature Specifications**:
- [REPORT_VERIFICATION.md](./REPORT_VERIFICATION.md) - How verification works
- [ECO_ROUTE_DOCUMENTATION.md](./ECO_ROUTE_DOCUMENTATION.md) - Routing features

---

## 🔑 Key Concepts

### Verification Levels (1-5)
| Level | Color | Description |
|-------|-------|-------------|
| 5 | Green | Excellent - Highly reliable |
| 4 | Light Green | Good - Reliable |
| 3 | Yellow | Moderate - Needs more data |
| 2 | Orange | Low - Limited data |
| 1 | Red | Poor - Issues reported |

See [REPORT_VERIFICATION.md](./REPORT_VERIFICATION.md) for algorithm details.

---

### Trust Score (0-100)
User reputation based on contributions:
- **Formula**: `min(100, chargers_added × 10 + verifications × 2 + photos × 3)`
- **Impact**: Higher trust = more weight on verifications

See [REPORT_VERIFICATION.md](./REPORT_VERIFICATION.md#trust-score-system).

---

### Coin Economy
Gamification rewards for contributions:
- Add charger: **5 coins** (+3 per photo)
- Verification: **2-9 coins** (based on detail level)
- Navigation: **5 coins**

See [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md#coin-reward-system).

---

### Route Profiles
- **Eco**: Optimized for energy efficiency
- **Balanced**: Balance between time and energy
- **Fastest**: Minimum travel time

See [ECO_ROUTE_DOCUMENTATION.md](./ECO_ROUTE_DOCUMENTATION.md#route-profiles).

---

## 🛠️ Development Workflow

### Making Changes

1. **Backend Changes**:
   - Update code in `backend/app/`
   - Add database migrations if needed: `alembic revision --autogenerate`
   - Update [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)
   - Write tests in `backend/tests/`

2. **Frontend Changes**:
   - Update code in `frontend/app/` or `frontend/components/`
   - Update [FRONTEND_DOCUMENTATION.md](./FRONTEND_DOCUMENTATION.md)
   - Test on iOS and Android

3. **Feature Changes**:
   - Update feature-specific docs ([REPORT_VERIFICATION.md](./REPORT_VERIFICATION.md), [ECO_ROUTE_DOCUMENTATION.md](./ECO_ROUTE_DOCUMENTATION.md))
   - Update API docs if endpoints changed

---

### Testing

**Backend**:
```bash
cd backend
pytest tests/ -v --cov=app
```

**Frontend**:
```bash
cd frontend
npm test
```

See [SETUP_AND_APIs.md](./SETUP_AND_APIs.md#testing) for details.

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

**User Metrics**:
- DAU, WAU, MAU
- Stickiness (DAU/MAU %)
- 7-day and 30-day retention
- User growth rate

**Engagement**:
- Actions per user
- Verification participation
- Charger contribution rate
- Navigation usage

**Data Quality**:
- Verification level distribution
- Photo coverage
- High-quality charger percentage

See [METRICS_API_DOCUMENTATION.md](./METRICS_API_DOCUMENTATION.md) for all metrics.

---

## 🔐 Security

### Best Practices
- All passwords hashed with Bcrypt
- JWT tokens for authentication
- Rate limiting on all endpoints
- CSRF protection for OAuth
- Input validation with Pydantic
- Secure S3 presigned URLs

See [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md#security).

---

## 🌍 External APIs

### Required APIs
1. **Mapbox** - Routing and maps (FREE tier: 50k requests/month)
2. **OpenWeatherMap** - Weather data (FREE tier: 1M calls/month)
3. **AWS S3** - Photo storage (FREE tier: 5GB storage)
4. **Open-Topo-Data** - Elevation data (FREE, unlimited)
5. **Google OAuth** - Social login (FREE, unlimited)

See [SETUP_AND_APIs.md](./SETUP_AND_APIs.md#external-apis-required) for setup instructions.

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**:
- Check PostgreSQL is running
- Verify `.env` file exists with all required variables
- Run `alembic upgrade head` for migrations

**Frontend build errors**:
- Clear cache: `npm start -- --clear`
- Delete `node_modules` and reinstall: `npm install`

**Maps not loading**:
- Verify Mapbox API key in both backend and frontend `.env`
- Check network connectivity

See [SETUP_AND_APIs.md](./SETUP_AND_APIs.md#troubleshooting) for more.

---

## 📞 Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: You're reading it!
- **Email**: support@sharaspot.com

---

## 📝 Contributing

### Documentation Updates

When adding new features:
1. Update relevant documentation files
2. Add examples and code snippets
3. Update this README if adding new docs

### Code Standards

**Backend**:
- Follow PEP 8
- Add type hints
- Write docstrings
- Add tests

**Frontend**:
- Use TypeScript
- Follow React/React Native best practices
- Add prop types
- Write tests

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 🙏 Acknowledgments

- Mapbox for routing and mapping
- OpenStreetMap contributors
- Open-Topo-Data project
- Expo team for React Native tooling

---

**Last Updated**: November 17, 2025

**Version**: 2.0.0
