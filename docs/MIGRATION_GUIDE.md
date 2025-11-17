# Migration Guide: Modular Monolith Architecture

This guide helps you migrate the existing SharaSpot codebase to the new modular monolith architecture.

## Overview

The new architecture provides:
- **Backend**: Domain-driven modular monolith with CQRS, event bus, and dependency injection
- **Frontend**: Feature-based architecture with Zustand state management and type-safe API client

## Backend Migration

### Phase 1: Set Up Infrastructure (Completed ✓)

1. **Shared Kernel** - Created in `/backend/shared/`
   - Domain primitives (Entity, ValueObject, Repository, Events)
   - Application layer (Command, Query, UseCase)
   - Infrastructure (Database session, Unit of Work)

2. **Dependency Injection** - Created `/backend/container.py`
   - Simple DI container for managing dependencies
   - Supports singleton, transient, and factory registrations

3. **Example Module** - Gamification module created in `/backend/modules/gamification/`
   - Demonstrates the layered architecture
   - Shows CQRS pattern with commands and queries
   - Includes domain events

### Phase 2: Migrate Existing Modules

For each existing module (auth, chargers, routing, analytics), follow this structure:

```
backend/modules/{module_name}/
├── domain/
│   ├── entities.py         # Domain entities
│   ├── value_objects.py    # Value objects
│   ├── events.py          # Domain events
│   └── repositories.py    # Repository interfaces
├── application/
│   ├── commands.py        # Write operations (CQRS)
│   └── queries.py         # Read operations (CQRS)
├── infrastructure/
│   └── persistence/       # Database implementation
└── presentation/
    └── routes.py          # FastAPI routes
```

#### Example: Migrating Auth Module

1. **Create domain entities** (`modules/auth/domain/entities.py`):
```python
from shared.domain import Entity
from .value_objects import Email, Password
from .events import UserRegistered

class User(Entity):
    def __init__(self, email: Email, password_hash: str, display_name: str):
        super().__init__()
        self._email = email
        self._password_hash = password_hash
        self._display_name = display_name

    @classmethod
    def register(cls, email: str, password: str, display_name: str):
        user = cls(Email(email), password, display_name)
        user.raise_event(UserRegistered(aggregate_id=user.id, email=email))
        return user
```

2. **Create commands** (`modules/auth/application/commands.py`):
```python
@dataclass
class RegisterUserCommand(Command):
    email: str
    password: str
    display_name: str

class RegisterUserHandler(CommandHandler):
    async def handle(self, command: RegisterUserCommand):
        user = User.register(command.email, command.password, command.display_name)
        await self.user_repo.save(user)
        return user
```

3. **Create API routes** (`modules/auth/presentation/routes.py`):
```python
@router.post("/signup")
async def signup(request: SignupRequest):
    command = RegisterUserCommand(...)
    result = await handler.handle(command)
    return result
```

### Phase 3: Integrate Modules

1. **Register dependencies** in `container.py`:
```python
def configure_container():
    container = get_container()

    # Register repositories
    container.register_transient(IUserRepository, lambda c: UserRepository(db))

    # Register handlers
    container.register_factory(
        RegisterUserHandler,
        lambda c: RegisterUserHandler(c.resolve(IUserRepository), c.resolve(EventBus))
    )

    return container
```

2. **Update `main.py`** to initialize modules:
```python
from container import configure_container
from modules.auth.presentation.routes import router as auth_router
from modules.gamification.presentation.routes import router as gamification_router

# Configure DI container
configure_container()

# Include module routers
app.include_router(auth_router)
app.include_router(gamification_router)
```

### Phase 4: Set Up Event Handlers

Subscribe to domain events for cross-module communication:

```python
from shared.domain import event_handler
from modules.gamification.application.commands import AwardCoinsCommand

@event_handler(ChargerVerified)
async def on_charger_verified(event: ChargerVerified):
    # Award coins when charger is verified
    command = AwardCoinsCommand(
        user_id=event.user_id,
        amount=10,
        reason="charger_verified"
    )
    await handler.handle(command)
```

## Frontend Migration

### Phase 1: Set Up Infrastructure (Completed ✓)

1. **API Client** - Created in `/frontend/src/shared/api/`
   - Type-safe HTTP client with interceptors
   - Automatic token refresh
   - Error normalization

2. **State Management** - Created in `/frontend/src/shared/store/`
   - Zustand setup with middleware
   - Persistence support

3. **Example Feature** - Auth feature created in `/frontend/src/features/auth/`
   - API layer
   - State management
   - Custom hooks
   - TypeScript types

### Phase 2: Migrate Existing Features

For each feature (chargers, map, profile, routing), create this structure:

```
frontend/src/features/{feature_name}/
├── api/
│   └── {feature}Api.ts    # API calls
├── store/
│   └── {feature}Store.ts  # Zustand store
├── hooks/
│   └── use{Feature}.ts    # Custom hooks
├── types/
│   └── {feature}.types.ts # TypeScript types
├── components/            # Feature-specific components
└── index.ts              # Public API
```

#### Example: Migrating Chargers Feature

1. **Create API layer** (`features/chargers/api/chargersApi.ts`):
```typescript
import { apiClient, API_ENDPOINTS } from '../../../shared/api';

export const chargersApi = {
  async getNearby(lat: number, lng: number, radius: number) {
    return apiClient.get(API_ENDPOINTS.CHARGERS.NEARBY, {
      params: { lat, lng, radius }
    });
  },

  async getDetails(id: string) {
    return apiClient.get(API_ENDPOINTS.CHARGERS.DETAILS(id));
  },

  async verify(id: string, data: VerificationData) {
    return apiClient.post(API_ENDPOINTS.CHARGERS.VERIFY(id), data);
  }
};
```

2. **Create store** (`features/chargers/store/chargersStore.ts`):
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useChargersStore = create(
  immer((set) => ({
    chargers: [],
    selectedCharger: null,
    filters: {},

    setChargers: (chargers) => set({ chargers }),
    selectCharger: (charger) => set({ selectedCharger: charger }),
    updateFilters: (filters) => set((state) => {
      state.filters = { ...state.filters, ...filters };
    }),
  }))
);
```

3. **Create custom hook** (`features/chargers/hooks/useChargers.ts`):
```typescript
import { useChargersStore } from '../store/chargersStore';
import { chargersApi } from '../api/chargersApi';

export function useChargers() {
  const { chargers, setChargers } = useChargersStore();

  const fetchNearby = async (lat: number, lng: number) => {
    const data = await chargersApi.getNearby(lat, lng, 5000);
    setChargers(data);
  };

  return {
    chargers,
    fetchNearby,
  };
}
```

4. **Update components** to use the new hooks:
```typescript
// Before
import { AuthContext } from '../../contexts/AuthContext';

// After
import { useAuth } from '../../features/auth';

function MyComponent() {
  const { user, login, logout } = useAuth();
  // ...
}
```

### Phase 3: Organize Shared UI Components

Move components to atomic design structure:

```
frontend/src/shared/ui/
├── atoms/           # Basic components
│   ├── Button/
│   ├── Input/
│   └── Badge/
├── molecules/       # Composite components
│   ├── FormField/
│   └── SearchBar/
└── organisms/       # Complex components
    ├── Header/
    └── TabBar/
```

### Phase 4: Update Expo Router

Keep app directory thin, delegate logic to features:

```typescript
// app/login.tsx
import { LoginScreen } from '../src/features/auth/screens/LoginScreen';

export default function LoginRoute() {
  return <LoginScreen />;
}
```

## Installation

### Backend Dependencies

No new dependencies required! The modular monolith uses existing packages.

### Frontend Dependencies

Install Zustand for state management:

```bash
cd frontend
yarn add zustand
yarn add -D @types/node  # For TypeScript path resolution
```

## Testing the Migration

### Backend Tests

```bash
cd backend
pytest tests/test_gamification.py  # Test new module
```

### Frontend Tests

```bash
cd frontend
yarn test
```

## Rollout Strategy

### Week 1: Infrastructure Setup (DONE ✓)
- [x] Create shared kernel
- [x] Set up dependency injection
- [x] Create example module (gamification)
- [x] Set up frontend API client
- [x] Set up state management
- [x] Create example feature (auth)

### Week 2-3: Module Migration
- [ ] Migrate auth module to new structure
- [ ] Migrate chargers module
- [ ] Migrate routing module
- [ ] Migrate analytics module

### Week 4: Frontend Migration
- [ ] Migrate chargers feature
- [ ] Migrate map feature
- [ ] Migrate profile feature
- [ ] Migrate routing feature

### Week 5: Testing & Refinement
- [ ] Integration tests
- [ ] Performance testing
- [ ] Documentation updates
- [ ] Team training

## Benefits Realized

### Backend
- ✅ Clear module boundaries
- ✅ Testable business logic (isolated from infrastructure)
- ✅ Event-driven communication between modules
- ✅ CQRS for optimized read/write operations
- ✅ Repository pattern for data abstraction

### Frontend
- ✅ Feature-based organization (easy to navigate)
- ✅ Type-safe API client
- ✅ Centralized state management
- ✅ Reusable custom hooks
- ✅ Clear separation of concerns

## Troubleshooting

### Backend Issues

**Q: Import errors from shared kernel**
```python
# Add to PYTHONPATH or use absolute imports
from backend.shared.domain import Entity
```

**Q: Circular dependencies**
- Use dependency injection
- Use interfaces (protocols) instead of concrete classes
- Move shared types to shared kernel

### Frontend Issues

**Q: Module resolution errors**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@features/*": ["src/features/*"]
    }
  }
}
```

**Q: Zustand state not persisting**
- Check AsyncStorage is properly configured
- Ensure persist middleware is applied
- Check the `partialize` function only includes serializable data

## Next Steps

1. **Migrate remaining backend modules** following the gamification example
2. **Migrate remaining frontend features** following the auth example
3. **Set up monitoring** for event bus and module interactions
4. **Add integration tests** for cross-module communication
5. **Document APIs** for each module

## Resources

- [Backend Architecture Docs](./MODULAR_MONOLITH_ARCHITECTURE.md)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)

## Support

If you have questions or need help with the migration:
1. Review the example modules (gamification, auth)
2. Check this migration guide
3. Consult the architecture documentation
4. Ask the team for code review

Happy migrating! 🚀
