# SharaSpot Documentation

Welcome to the comprehensive documentation for **SharaSpot** - a community-driven EV charging station finder and verification platform built with a powerful modular monolith architecture.

---

## 🚀 Getting Started

**New to SharaSpot?** Start here:

1. **[Getting Started Guide](./GETTING_STARTED.md)** - Complete setup guide from prerequisites to running the application
   - Prerequisites and installation
   - Backend setup (Python, PostgreSQL, dependencies)
   - Frontend setup (React Native, Expo)
   - Docker setup (alternative)
   - Common issues and troubleshooting

---

## 🏗️ Architecture Documentation

**Understanding the System:**

### Core Architecture
- **[Modular Monolith Architecture](./MODULAR_MONOLITH_ARCHITECTURE.md)** - Comprehensive architecture guide
  - Domain-Driven Design (DDD) principles
  - CQRS and Event-Driven Architecture
  - Module structure and boundaries
  - Shared kernel and dependency injection
  - Inter-module communication

- **[Migration Guide](./MIGRATION_GUIDE.md)** - Step-by-step migration guide
  - Migrating existing code to new structure
  - Module creation patterns
  - Import and dependency management
  - Testing strategies

### Backend Architecture
- **[Backend Documentation](./BACKEND_DOCUMENTATION.md)** - Complete backend reference
  - API endpoint reference
  - Module structure
  - Service layer architecture
  - Database models and migrations
  - Security and authentication

### Frontend Architecture
- **[Frontend Documentation](./FRONTEND_DOCUMENTATION.md)** - React Native app guide
  - Feature-based organization
  - Component library (Atomic Design)
  - State management (Zustand)
  - Navigation and routing
  - Type-safe API client

---

## 📱 Feature Documentation

**Deep dives into specific features:**

- **[Report Verification System](./REPORT_VERIFICATION.md)** - Community verification system
  - Verification algorithm
  - Trust score system
  - Rate limiting and anti-spam
  - Coin reward system
  - Verification levels

- **[Eco Route & Navigation](./ECO_ROUTE_DOCUMENTATION.md)** - Smart routing for EVs
  - Energy consumption model
  - Route optimization algorithm
  - Turn-by-turn navigation
  - Real-time traffic integration

- **[Metrics API](./METRICS_API_DOCUMENTATION.md)** - Analytics and business intelligence
  - Usage metrics
  - Business intelligence endpoints
  - Data aggregation
  - Reporting

---

## 🎯 Quick Reference

### Project Structure

#### Backend Modules
```
backend/
├── shared/              # Shared kernel (DDD primitives)
├── modules/
│   ├── auth/           # Authentication & authorization
│   ├── chargers/       # Charger management
│   ├── routing/        # Route planning & navigation
│   ├── gamification/   # Coins & rewards
│   ├── profile/        # User profiles
│   └── analytics/      # Metrics & reporting
└── container.py        # Dependency injection
```

Each module has 4 layers:
- `domain/` - Business logic and entities
- `application/` - Use cases and services
- `infrastructure/` - Data access and external services
- `presentation/` - API routes and DTOs

#### Frontend Features
```
frontend/src/
├── shared/             # Shared infrastructure
│   ├── api/           # API client
│   ├── ui/            # UI component library
│   ├── hooks/         # Reusable hooks
│   └── store/         # State management setup
└── features/          # Feature modules
    ├── auth/          # Authentication
    ├── chargers/      # Charger features
    ├── map/           # Map features
    ├── profile/       # Profile features
    └── routing/       # Routing features
```

Each feature includes:
- `api/` - API calls
- `store/` - State management (Zustand)
- `hooks/` - Custom hooks
- `types/` - TypeScript types
- `components/` - UI components

---

## 🔧 Development Guides

### Backend Development

**Adding a new module:**
1. Follow the structure in `modules/gamification/` (complete example)
2. Create 4 layers: domain, application, infrastructure, presentation
3. Use shared kernel primitives (Entity, ValueObject, Repository)
4. Register services in `container.py`
5. Add router to `main.py`

**Key Patterns:**
- **Entities**: Business objects with identity (`shared/domain/entity.py`)
- **Value Objects**: Immutable objects (`shared/domain/value_object.py`)
- **Repositories**: Data access abstraction (`shared/domain/repository.py`)
- **Commands**: Write operations (`shared/application/command.py`)
- **Queries**: Read operations (`shared/application/query.py`)
- **Events**: Domain events (`shared/domain/events.py`)

### Frontend Development

**Adding a new feature:**
1. Follow the structure in `features/auth/` (complete example)
2. Create API calls in `api/`
3. Set up Zustand store in `store/`
4. Create custom hooks in `hooks/`
5. Define types in `types/`
6. Build components in `components/`

**Key Patterns:**
- **API Client**: Type-safe HTTP client (`shared/api/client.ts`)
- **State Management**: Zustand with persistence
- **Custom Hooks**: Reusable business logic
- **Atomic Design**: atoms → molecules → organisms

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest                          # Run all tests
pytest --cov                    # With coverage
pytest tests/modules/auth/      # Specific module
```

### Frontend Tests
```bash
cd frontend
yarn test                       # Run all tests
yarn test --watch              # Watch mode
```

---

## 📊 Data & External APIs

### Data Sources
- **[Data Collection](../data/README.md)** - Information about data sources
  - Initial charger data
  - Geographic data
  - External integrations

### External APIs Required
- **Mapbox** - Maps and navigation
- **OpenWeather** - Weather data for route planning
- **AWS S3** - Photo storage (optional for local development)

See [Getting Started Guide](./GETTING_STARTED.md) for API key configuration.

---

## 🏛️ Architecture Principles

### Backend
- **Domain-Driven Design** - Business logic organized into bounded contexts
- **CQRS** - Separate commands from queries
- **Event-Driven** - Modules communicate via domain events
- **Dependency Injection** - Testable, loosely coupled components
- **Repository Pattern** - Clean data access abstraction

### Frontend
- **Feature-Based** - Code organized by feature, not type
- **Type-Safe** - Full TypeScript coverage
- **Atomic Design** - UI components by complexity
- **State Management** - Lightweight Zustand stores
- **Custom Hooks** - Reusable business logic

---

## 📚 Additional Resources

### Archived Documentation
Historical documentation and migration artifacts are available in [`archive/`](./archive/):
- Original setup guides
- Migration completion reports
- Verification reports

### Contributing
When adding new features:
1. **Backend**: Follow the module structure in `modules/gamification/`
2. **Frontend**: Follow the feature structure in `features/auth/`
3. **Tests**: Write tests for business logic
4. **Documentation**: Update relevant docs

---

## 🆘 Getting Help

1. Check the **[Getting Started Guide](./GETTING_STARTED.md)** for setup issues
2. Review **[Architecture Documentation](./MODULAR_MONOLITH_ARCHITECTURE.md)** for design patterns
3. See **[Migration Guide](./MIGRATION_GUIDE.md)** for code organization
4. Check **[GitHub Issues](https://github.com/FFFSTANZA/SharaSpot-application/issues)**

---

## 📖 Documentation Map

```
docs/
├── README.md (this file)                      # Documentation index
├── GETTING_STARTED.md                         # Setup guide
├── MODULAR_MONOLITH_ARCHITECTURE.md          # Architecture guide
├── MIGRATION_GUIDE.md                         # Migration instructions
├── BACKEND_DOCUMENTATION.md                   # Backend reference
├── FRONTEND_DOCUMENTATION.md                  # Frontend reference
├── REPORT_VERIFICATION.md                     # Feature: Verification
├── ECO_ROUTE_DOCUMENTATION.md                # Feature: Routing
├── METRICS_API_DOCUMENTATION.md              # Feature: Analytics
└── archive/                                   # Historical docs
    ├── SETUP_AND_APIs.md                     # Old setup guide
    ├── NEW_ARCHITECTURE_README.md            # Old architecture intro
    ├── MIGRATION_COMPLETE.md                 # Migration report
    ├── VERIFICATION_COMPLETE.md              # Verification report
    └── DEEP_CHECK_COMPLETE.md                # Deep check report
```

---

## 🎉 Welcome!

SharaSpot is built with modern, scalable architecture that makes it:
- **Powerful** - Enterprise patterns done right
- **Maintainable** - Clear boundaries and structure
- **Testable** - Isolated modules
- **Scalable** - Can grow from monolith to microservices
- **Developer-Friendly** - Easy to understand and navigate

Happy coding! 🚀
