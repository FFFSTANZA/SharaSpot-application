# SharaSpot Modular Monolith Architecture 🚀

Welcome to the new and improved SharaSpot architecture! This document provides a quick overview of the modernized codebase.

## 🎯 What's New?

We've transformed SharaSpot from a traditional monolith into a **powerful modular monolith** with clear boundaries, better maintainability, and room for growth.

### Backend Improvements

✅ **Domain-Driven Design** - Business logic organized into bounded contexts
✅ **CQRS Pattern** - Separate commands (writes) from queries (reads)
✅ **Event-Driven Architecture** - Modules communicate via domain events
✅ **Dependency Injection** - Testable, loosely coupled components
✅ **Repository Pattern** - Clean data access abstraction
✅ **Unit of Work Pattern** - Transaction management

### Frontend Improvements

✅ **Feature-Based Architecture** - Code organized by feature, not by type
✅ **Zustand State Management** - Lightweight, powerful, type-safe
✅ **Type-Safe API Client** - Automatic token refresh, error handling
✅ **Custom Hooks** - Reusable business logic
✅ **Atomic Design** - UI components organized by complexity

## 📁 New Structure

### Backend

```
backend/
├── shared/                    # Shared kernel
│   ├── domain/               # Domain primitives
│   │   ├── entity.py
│   │   ├── value_object.py
│   │   ├── repository.py
│   │   └── events.py
│   ├── application/          # Application abstractions
│   │   ├── command.py
│   │   ├── query.py
│   │   └── use_case.py
│   └── infrastructure/       # Infrastructure services
│       └── database/
│           ├── session.py
│           └── unit_of_work.py
│
├── modules/                   # Domain modules
│   ├── auth/                 # Authentication module
│   ├── chargers/             # Charger management
│   ├── routing/              # Route planning
│   ├── gamification/         # Coins & rewards (EXAMPLE ✨)
│   │   ├── domain/           # Business logic
│   │   ├── application/      # Use cases
│   │   ├── infrastructure/   # Data access
│   │   └── presentation/     # API routes
│   └── analytics/            # Metrics & reporting
│
└── container.py               # Dependency injection
```

### Frontend

```
frontend/src/
├── shared/                    # Shared infrastructure
│   ├── api/                  # API client
│   │   ├── client.ts        # Type-safe HTTP client
│   │   └── config.ts        # Endpoints & config
│   ├── store/               # State management setup
│   ├── hooks/               # Reusable hooks
│   ├── ui/                  # UI component library
│   │   ├── atoms/          # Basic components
│   │   ├── molecules/      # Composite components
│   │   └── organisms/      # Complex components
│   └── services/           # Shared services
│
└── features/                 # Feature modules
    ├── auth/                # Authentication (EXAMPLE ✨)
    │   ├── api/            # API calls
    │   ├── store/          # State management
    │   ├── hooks/          # Custom hooks
    │   ├── types/          # TypeScript types
    │   └── components/     # Feature components
    ├── chargers/           # Charger features
    ├── map/                # Map features
    ├── profile/            # Profile features
    └── routing/            # Routing features
```

## 🚀 Quick Start

### Backend

The backend now uses a layered architecture with clear separation of concerns:

```python
# 1. Define domain entity
from shared.domain import Entity

class CoinWallet(Entity):
    def award_coins(self, amount, reason):
        # Business logic here
        self.raise_event(CoinsAwarded(...))

# 2. Create command
@dataclass
class AwardCoinsCommand(Command):
    user_id: UUID
    amount: Decimal
    reason: str

# 3. Handle command
class AwardCoinsHandler(CommandHandler):
    async def handle(self, command: AwardCoinsCommand):
        wallet = await self.repo.get_or_create(command.user_id)
        wallet.award_coins(command.amount, command.reason)
        await self.repo.save(wallet)

# 4. Expose via API
@router.post("/award")
async def award_coins(request: AwardCoinsRequest):
    command = AwardCoinsCommand(...)
    result = await handler.handle(command)
    return result
```

### Frontend

The frontend uses feature-based organization with Zustand:

```typescript
// 1. Define API calls (features/auth/api/authApi.ts)
export const authApi = {
  async login(credentials: LoginRequest) {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }
};

// 2. Create store (features/auth/store/authStore.ts)
export const useAuthStore = create((set) => ({
  user: null,
  login: async (credentials) => {
    const response = await authApi.login(credentials);
    set({ user: response.user });
  }
}));

// 3. Create custom hook (features/auth/hooks/useAuth.ts)
export function useAuth() {
  const { user, login } = useAuthStore();
  return { user, login };
}

// 4. Use in component
function LoginScreen() {
  const { user, login } = useAuth();
  // ...
}
```

## 📚 Documentation

- **[Architecture Overview](./MODULAR_MONOLITH_ARCHITECTURE.md)** - Detailed architecture guide
- **[Migration Guide](./MIGRATION_GUIDE.md)** - Step-by-step migration instructions
- **[Backend Docs](./BACKEND_DOCUMENTATION.md)** - Existing backend documentation
- **[Frontend Docs](./FRONTEND_DOCUMENTATION.md)** - Existing frontend documentation

## 🔑 Key Concepts

### Backend

**Domain Entity** - Business objects with identity and lifecycle
**Value Object** - Immutable objects defined by their attributes
**Repository** - Interface for data access
**Domain Event** - Something that happened that domain experts care about
**Command** - Intention to change state
**Query** - Intention to read data

### Frontend

**Feature Module** - Self-contained vertical slice of functionality
**Store** - Zustand state container
**Custom Hook** - Reusable business logic
**API Client** - Type-safe HTTP communication

## 🎯 Example Modules

We've created two complete example modules to guide your migration:

### Backend: Gamification Module (`backend/modules/gamification/`)

Shows how to:
- ✅ Define domain entities and value objects
- ✅ Implement CQRS with commands and queries
- ✅ Raise and handle domain events
- ✅ Create repository interfaces
- ✅ Build API endpoints

### Frontend: Auth Feature (`frontend/src/features/auth/`)

Shows how to:
- ✅ Create type-safe API calls
- ✅ Set up Zustand store with persistence
- ✅ Build custom hooks
- ✅ Define TypeScript types
- ✅ Organize feature code

## 🛠️ Installation

### Backend

No new dependencies! The modular monolith uses existing packages.

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

Install Zustand for state management:

```bash
cd frontend
yarn add zustand immer
yarn install
```

## 🧪 Testing

### Backend

```bash
cd backend
pytest tests/
```

### Frontend

```bash
cd frontend
yarn test
```

## 🤝 Contributing

When adding new features:

1. **Backend**: Follow the module structure in `modules/gamification/`
2. **Frontend**: Follow the feature structure in `features/auth/`
3. **Shared Code**: Add to appropriate shared folder
4. **Documentation**: Update relevant docs

## 📈 Benefits

### For Developers

- 🎯 **Clear structure** - Know exactly where code belongs
- 🧪 **Testable** - Isolated modules are easy to test
- 🔄 **Reusable** - Features export clean public APIs
- 📝 **Type-safe** - Full TypeScript support
- 🚀 **Productive** - Less time figuring out architecture

### For the Application

- ⚡ **Performant** - Optimized state management
- 🔧 **Maintainable** - Clear boundaries and dependencies
- 📦 **Scalable** - Can extract modules to microservices
- 🛡️ **Robust** - Business logic protected in domain layer
- 🔌 **Flexible** - Modules communicate via events

## 🗺️ Roadmap

### Completed ✅
- [x] Design architecture
- [x] Create shared kernel
- [x] Build example backend module (gamification)
- [x] Set up dependency injection
- [x] Create API client layer
- [x] Set up state management
- [x] Build example frontend feature (auth)

### Next Steps
- [ ] Migrate auth module to new structure
- [ ] Migrate chargers module
- [ ] Migrate routing module
- [ ] Migrate map feature
- [ ] Add integration tests
- [ ] Performance optimization

## 💡 Tips

### Backend Tips

1. **Start with domain** - Define entities and business rules first
2. **Keep it simple** - Don't over-engineer
3. **Use events** - For cross-module communication
4. **Test business logic** - In isolation from infrastructure
5. **Follow examples** - The gamification module is your guide

### Frontend Tips

1. **Feature first** - Group by feature, not by type
2. **Hooks for logic** - Keep components focused on UI
3. **Type everything** - TypeScript catches bugs early
4. **Atomic components** - Build from simple to complex
5. **Follow examples** - The auth feature is your guide

## 🆘 Need Help?

1. Check the **[Migration Guide](./MIGRATION_GUIDE.md)**
2. Review the **example modules**
3. Read the **[Architecture Docs](./MODULAR_MONOLITH_ARCHITECTURE.md)**
4. Ask the team!

## 🎉 Welcome to the New Architecture!

This modular monolith provides a solid foundation for SharaSpot's growth. It's:

- **Powerful** - Enterprise patterns, done right
- **Practical** - Based on battle-tested practices
- **Flexible** - Adapt as needs evolve
- **Clear** - Easy to understand and navigate

Happy coding! 🚀
