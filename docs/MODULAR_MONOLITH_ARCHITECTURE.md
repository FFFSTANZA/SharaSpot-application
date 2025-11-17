# SharaSpot Modular Monolith Architecture

## Overview

This document describes the **Modular Monolith Architecture** for SharaSpot, designed to provide:
- **Clear module boundaries** with well-defined interfaces
- **Independent deployability** while maintaining a single deployment unit
- **Scalability** for future microservices migration if needed
- **Maintainability** through separation of concerns
- **Testability** via dependency injection and isolation

---

## Architecture Principles

### 1. Module Independence
- Each module owns its data and business logic
- Modules communicate through well-defined interfaces
- No direct database access across modules
- Shared nothing architecture within bounded contexts

### 2. Dependency Rule
- Dependencies point inward (from infrastructure to domain)
- Domain layer has no external dependencies
- Shared kernel provides common abstractions

### 3. Event-Driven Communication
- Modules emit domain events for state changes
- Event bus enables loose coupling
- Asynchronous communication where appropriate

### 4. Single Responsibility
- Each module handles one bounded context
- Clear ownership of features and data

---

## Backend Architecture

### Module Structure

```
backend/
├── modules/                          # Domain Modules (Bounded Contexts)
│   ├── auth/                        # Authentication & User Management
│   │   ├── domain/                  # Domain models & business logic
│   │   │   ├── entities/           # User, Session entities
│   │   │   ├── value_objects/      # Email, Password value objects
│   │   │   ├── repositories/       # Repository interfaces
│   │   │   ├── services/           # Domain services
│   │   │   └── events/             # Domain events
│   │   ├── application/            # Application layer (use cases)
│   │   │   ├── commands/          # Command handlers (CQRS)
│   │   │   ├── queries/           # Query handlers (CQRS)
│   │   │   ├── dtos/              # Data transfer objects
│   │   │   └── services/          # Application services
│   │   ├── infrastructure/         # Infrastructure layer
│   │   │   ├── persistence/       # Database repositories
│   │   │   ├── external/          # OAuth providers
│   │   │   └── events/            # Event publishers
│   │   ├── presentation/          # API layer
│   │   │   ├── routes.py          # FastAPI routes
│   │   │   ├── schemas.py         # Request/response schemas
│   │   │   └── dependencies.py    # Route dependencies
│   │   └── __init__.py            # Module interface
│   │
│   ├── chargers/                   # Charger Management
│   │   ├── domain/
│   │   │   ├── entities/          # Charger, Verification entities
│   │   │   ├── value_objects/     # Location, ConnectorType
│   │   │   ├── repositories/
│   │   │   ├── services/          # Geospatial services
│   │   │   └── events/
│   │   ├── application/
│   │   │   ├── commands/          # AddCharger, VerifyCharger
│   │   │   ├── queries/           # SearchChargers, GetChargerDetails
│   │   │   └── dtos/
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   ├── geospatial/        # PostGIS integration
│   │   │   └── storage/           # S3 photo uploads
│   │   └── presentation/
│   │
│   ├── routing/                    # Route Planning & Energy Calculations
│   │   ├── domain/
│   │   │   ├── entities/          # Route, RouteSegment
│   │   │   ├── value_objects/     # EnergyConsumption, Distance
│   │   │   ├── services/          # Routing algorithms
│   │   │   └── events/
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/           # CalculateRoute, GetAlternatives
│   │   │   └── dtos/
│   │   ├── infrastructure/
│   │   │   ├── external/          # Mapbox API, Weather API
│   │   │   └── persistence/
│   │   └── presentation/
│   │
│   ├── gamification/               # Coins & Rewards System
│   │   ├── domain/
│   │   │   ├── entities/          # CoinTransaction, Reward
│   │   │   ├── value_objects/     # TrustScore, RewardAmount
│   │   │   ├── services/          # Reward calculation
│   │   │   └── events/            # CoinAwarded event
│   │   ├── application/
│   │   │   ├── commands/          # AwardCoins, SpendCoins
│   │   │   ├── queries/           # GetCoinBalance, GetTransactions
│   │   │   └── dtos/
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   └── presentation/
│   │
│   └── analytics/                  # Metrics & Reporting
│       ├── domain/
│       │   ├── entities/          # AnalyticsSnapshot, UserActivity
│       │   ├── services/          # Metrics calculation
│       │   └── events/
│       ├── application/
│       │   ├── commands/          # TrackEvent
│       │   ├── queries/           # GetMetrics, GetUserEngagement
│       │   └── dtos/
│       ├── infrastructure/
│       │   └── persistence/
│       └── presentation/
│
├── shared/                         # Shared Kernel (Cross-cutting Concerns)
│   ├── domain/                    # Common domain primitives
│   │   ├── entity.py             # Base entity class
│   │   ├── value_object.py       # Base value object
│   │   ├── repository.py         # Repository interface
│   │   ├── events.py             # Event base classes
│   │   └── exceptions.py         # Domain exceptions
│   │
│   ├── application/               # Common application layer
│   │   ├── dto.py                # Base DTO
│   │   ├── command.py            # Command/Query interfaces
│   │   ├── handler.py            # Handler interfaces
│   │   └── use_case.py           # Use case base
│   │
│   ├── infrastructure/            # Infrastructure services
│   │   ├── database/             # Database connection & session
│   │   │   ├── connection.py
│   │   │   ├── session.py
│   │   │   └── unit_of_work.py   # UoW pattern
│   │   ├── events/               # Event bus implementation
│   │   │   ├── bus.py
│   │   │   ├── publisher.py
│   │   │   └── subscriber.py
│   │   ├── logging/              # Logging infrastructure
│   │   │   └── logger.py
│   │   ├── cache/                # Caching layer
│   │   │   └── cache.py
│   │   └── http/                 # HTTP client
│   │       └── client.py
│   │
│   ├── presentation/              # Common API infrastructure
│   │   ├── middleware/           # Middleware stack
│   │   ├── dependencies.py       # Common dependencies
│   │   ├── responses.py          # Standard responses
│   │   └── exceptions.py         # HTTP exceptions
│   │
│   └── config/                    # Configuration
│       ├── settings.py           # Application settings
│       ├── database.py           # Database config
│       └── security.py           # Security config
│
├── container.py                    # Dependency Injection Container
├── main.py                        # Application entry point
└── __init__.py
```

### Key Patterns

#### 1. **Dependency Injection**
```python
# container.py
from dependency_injector import containers, providers

class Container(containers.DeclarativeContainer):
    config = providers.Configuration()

    # Infrastructure
    db_engine = providers.Singleton(create_db_engine, config.database)
    event_bus = providers.Singleton(EventBus)

    # Repositories
    user_repository = providers.Factory(UserRepository, engine=db_engine)
    charger_repository = providers.Factory(ChargerRepository, engine=db_engine)

    # Services
    auth_service = providers.Factory(
        AuthService,
        user_repository=user_repository,
        event_bus=event_bus
    )
```

#### 2. **Repository Pattern**
```python
# shared/domain/repository.py
class Repository(ABC, Generic[T]):
    @abstractmethod
    async def get_by_id(self, id: UUID) -> Optional[T]: ...

    @abstractmethod
    async def save(self, entity: T) -> T: ...

    @abstractmethod
    async def delete(self, id: UUID) -> None: ...

# modules/auth/domain/repositories/user_repository.py
class IUserRepository(Repository[User]):
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]: ...
```

#### 3. **CQRS Pattern**
```python
# modules/auth/application/commands/register_user.py
@dataclass
class RegisterUserCommand:
    email: str
    password: str
    display_name: str

class RegisterUserHandler:
    def __init__(self, user_repo: IUserRepository, event_bus: IEventBus):
        self.user_repo = user_repo
        self.event_bus = event_bus

    async def handle(self, command: RegisterUserCommand) -> User:
        # Business logic
        user = User.create(...)
        await self.user_repo.save(user)
        await self.event_bus.publish(UserRegistered(user.id))
        return user
```

#### 4. **Event-Driven Communication**
```python
# shared/infrastructure/events/bus.py
class EventBus:
    def __init__(self):
        self._subscribers: Dict[Type[Event], List[Callable]] = {}

    async def publish(self, event: Event) -> None:
        for handler in self._subscribers.get(type(event), []):
            await handler(event)

    def subscribe(self, event_type: Type[Event], handler: Callable) -> None:
        self._subscribers.setdefault(event_type, []).append(handler)

# modules/gamification/infrastructure/events/handlers.py
@event_handler(ChargerVerified)
async def award_verification_coins(event: ChargerVerified):
    await coin_service.award_coins(event.user_id, amount=10, reason="verification")
```

#### 5. **Unit of Work Pattern**
```python
# shared/infrastructure/database/unit_of_work.py
class UnitOfWork:
    async def __aenter__(self):
        self.session = await get_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            await self.session.commit()
        else:
            await self.session.rollback()
        await self.session.close()
```

---

## Frontend Architecture

### Module Structure

```
frontend/
├── src/
│   ├── features/                     # Feature Modules (Vertical Slices)
│   │   ├── auth/                    # Authentication Feature
│   │   │   ├── components/         # Feature-specific components
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   └── OAuthButtons.tsx
│   │   │   ├── hooks/              # Feature-specific hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useLogin.ts
│   │   │   │   └── useSignup.ts
│   │   │   ├── screens/            # Feature screens
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── SignupScreen.tsx
│   │   │   │   └── PreferencesScreen.tsx
│   │   │   ├── api/                # Feature API calls
│   │   │   │   └── authApi.ts
│   │   │   ├── store/              # Feature state
│   │   │   │   └── authStore.ts
│   │   │   ├── types/              # Feature types
│   │   │   │   └── auth.types.ts
│   │   │   └── index.ts            # Public API
│   │   │
│   │   ├── chargers/               # Charger Management Feature
│   │   │   ├── components/
│   │   │   │   ├── ChargerCard.tsx
│   │   │   │   ├── ChargerList.tsx
│   │   │   │   ├── AddChargerForm.tsx
│   │   │   │   └── VerificationModal.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChargers.ts
│   │   │   │   ├── useChargerSearch.ts
│   │   │   │   └── useVerification.ts
│   │   │   ├── screens/
│   │   │   │   ├── ChargerListScreen.tsx
│   │   │   │   ├── ChargerDetailScreen.tsx
│   │   │   │   └── AddChargerScreen.tsx
│   │   │   ├── api/
│   │   │   │   └── chargersApi.ts
│   │   │   ├── store/
│   │   │   │   └── chargersStore.ts
│   │   │   └── types/
│   │   │
│   │   ├── map/                    # Map Feature
│   │   │   ├── components/
│   │   │   │   ├── MapView.tsx
│   │   │   │   ├── ChargerMarker.tsx
│   │   │   │   └── FilterPanel.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useMap.ts
│   │   │   │   ├── useLocation.ts
│   │   │   │   └── useFilters.ts
│   │   │   ├── screens/
│   │   │   ├── store/
│   │   │   └── types/
│   │   │
│   │   ├── profile/                # User Profile Feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   ├── api/
│   │   │   ├── store/
│   │   │   └── types/
│   │   │
│   │   └── routing/                # Route Planning Feature
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── screens/
│   │       ├── api/
│   │       ├── store/
│   │       └── types/
│   │
│   ├── shared/                      # Shared Infrastructure
│   │   ├── api/                    # API Client Layer
│   │   │   ├── client.ts          # Axios configuration
│   │   │   ├── interceptors.ts    # Request/response interceptors
│   │   │   ├── endpoints.ts       # API endpoints
│   │   │   └── types.ts           # API types
│   │   │
│   │   ├── ui/                     # UI Component Library
│   │   │   ├── atoms/             # Basic components
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Card/
│   │   │   │   └── Badge/
│   │   │   ├── molecules/         # Composite components
│   │   │   │   ├── FormField/
│   │   │   │   ├── SearchBar/
│   │   │   │   └── Modal/
│   │   │   └── organisms/         # Complex components
│   │   │       ├── Header/
│   │   │       ├── TabBar/
│   │   │       └── Drawer/
│   │   │
│   │   ├── hooks/                  # Shared Hooks
│   │   │   ├── useDebounce.ts
│   │   │   ├── useAsync.ts
│   │   │   ├── usePermissions.ts
│   │   │   └── useStorage.ts
│   │   │
│   │   ├── utils/                  # Utility Functions
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   ├── date.ts
│   │   │   └── geo.ts
│   │   │
│   │   ├── store/                  # Global State Management
│   │   │   ├── index.ts           # Store setup
│   │   │   ├── middleware.ts      # Store middleware
│   │   │   └── types.ts
│   │   │
│   │   ├── types/                  # Shared Types
│   │   │   ├── common.ts
│   │   │   ├── api.ts
│   │   │   └── models.ts
│   │   │
│   │   ├── constants/              # Constants
│   │   │   ├── theme.ts
│   │   │   ├── config.ts
│   │   │   └── routes.ts
│   │   │
│   │   └── services/               # Shared Services
│   │       ├── storage.ts
│   │       ├── analytics.ts
│   │       └── notifications.ts
│   │
│   └── app/                         # Expo Router App (Thin Layer)
│       ├── _layout.tsx             # Root layout
│       ├── index.tsx               # Entry point
│       ├── (tabs)/                 # Tab navigation
│       └── [dynamic routes]        # Screen routes
│
├── package.json
└── tsconfig.json
```

### Key Patterns

#### 1. **Feature-Based Architecture**
Each feature is self-contained with:
- Components (UI)
- Hooks (business logic)
- API (data fetching)
- Store (state management)
- Types (TypeScript definitions)

#### 2. **State Management with Zustand**
```typescript
// features/chargers/store/chargersStore.ts
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ChargersState {
  chargers: Charger[];
  filters: ChargerFilters;
  loading: boolean;

  // Actions
  setChargers: (chargers: Charger[]) => void;
  updateFilters: (filters: Partial<ChargerFilters>) => void;
  addCharger: (charger: Charger) => void;
}

export const useChargersStore = create<ChargersState>()(
  immer((set) => ({
    chargers: [],
    filters: {},
    loading: false,

    setChargers: (chargers) => set({ chargers }),
    updateFilters: (filters) => set((state) => {
      state.filters = { ...state.filters, ...filters };
    }),
    addCharger: (charger) => set((state) => {
      state.chargers.push(charger);
    }),
  }))
);
```

#### 3. **Custom Hooks for Business Logic**
```typescript
// features/chargers/hooks/useChargers.ts
export const useChargers = () => {
  const { chargers, loading, setChargers } = useChargersStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['chargers'],
    queryFn: () => chargersApi.getChargers(),
    onSuccess: setChargers,
  });

  const addCharger = useMutation({
    mutationFn: chargersApi.addCharger,
    onSuccess: () => {
      queryClient.invalidateQueries(['chargers']);
    },
  });

  return {
    chargers,
    loading: loading || isLoading,
    addCharger: addCharger.mutate,
  };
};
```

#### 4. **Type-Safe API Client**
```typescript
// shared/api/client.ts
import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.API_URL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  // ... other methods
}

export const apiClient = new ApiClient();
```

#### 5. **Feature Public API**
```typescript
// features/chargers/index.ts
// Public API - only export what other features need
export { ChargerCard, ChargerList } from './components';
export { useChargers, useChargerSearch } from './hooks';
export type { Charger, ChargerFilters } from './types';

// Internal components/hooks not exported
```

---

## Communication Between Modules

### Backend: Event-Driven Communication
```python
# Module A publishes event
await event_bus.publish(ChargerVerified(charger_id, user_id))

# Module B subscribes to event
@event_handler(ChargerVerified)
async def on_charger_verified(event: ChargerVerified):
    await gamification_service.award_coins(event.user_id, 10)
```

### Frontend: Store Subscriptions
```typescript
// Feature A updates store
useChargersStore.setState({ selectedCharger });

// Feature B subscribes to changes
const selectedCharger = useChargersStore(state => state.selectedCharger);
```

---

## Benefits of This Architecture

### 1. **Scalability**
- Modules can be extracted to microservices
- Clear boundaries enable independent scaling
- Event-driven architecture supports async processing

### 2. **Maintainability**
- Clear separation of concerns
- Feature-based organization easy to navigate
- Well-defined dependencies

### 3. **Testability**
- Dependency injection enables mocking
- Isolated modules can be tested independently
- Repository pattern abstracts data layer

### 4. **Team Collaboration**
- Teams can own specific modules
- Clear interfaces reduce conflicts
- Feature folders contain all related code

### 5. **Performance**
- Event-driven architecture for async tasks
- Repository pattern enables caching
- CQRS optimizes read/write operations

---

## Migration Strategy

### Phase 1: Shared Kernel (Week 1)
1. Create shared infrastructure
2. Implement event bus
3. Set up dependency injection container

### Phase 2: Extract Modules (Week 2-3)
1. Start with simplest module (gamification)
2. Refactor one module at a time
3. Maintain backward compatibility

### Phase 3: Frontend Restructure (Week 4)
1. Create feature folders
2. Extract shared components
3. Implement state management

### Phase 4: Testing & Documentation (Week 5)
1. Unit tests for each module
2. Integration tests
3. Update documentation

---

## Conclusion

This modular monolith architecture provides:
- **Clear boundaries** between business domains
- **Flexibility** to evolve into microservices
- **Maintainability** through separation of concerns
- **Scalability** for future growth
- **Developer experience** with well-organized code

The architecture balances the simplicity of a monolith with the modularity of microservices, providing the best of both worlds.
