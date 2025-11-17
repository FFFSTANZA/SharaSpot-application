# SharaSpot Frontend Documentation

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Pages](#pages)
- [Components](#components)
- [Contexts & State Management](#contexts--state-management)
- [Utilities](#utilities)
- [Styling & Theming](#styling--theming)
- [Navigation](#navigation)

---

## Architecture Overview

### Technology Stack
- **Framework**: React Native (Expo SDK 49)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Maps**: react-native-maps (Mapbox provider)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Storage**: Expo SecureStore + AsyncStorage
- **Location**: Expo Location
- **Voice**: Expo Speech
- **Haptics**: Expo Haptics
- **Image Picker**: Expo ImagePicker

### Design Principles
- **Component-Based Architecture**: Reusable UI components
- **Context Pattern**: Global state management
- **Optimistic UI Updates**: Immediate feedback
- **Offline-First**: Local caching with AsyncStorage
- **Accessibility**: Screen reader support, haptic feedback

---

## Project Structure

```
frontend/
├── app/                          # Pages (Expo Router)
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx             # Home page
│   │   ├── map.tsx               # Map & routing
│   │   └── profile.tsx           # User profile
│   ├── index.tsx                 # App entry point
│   ├── welcome.tsx               # Landing page
│   ├── login.tsx                 # Login page
│   ├── signup.tsx                # Signup page
│   ├── preferences.tsx           # Vehicle preferences
│   ├── navigation.tsx            # Turn-by-turn navigation
│   ├── charger-detail.tsx        # Charger details
│   ├── add-charger.tsx           # Add charger form
│   ├── verify-station.tsx        # Verification form
│   └── verification-report.tsx   # Verification history
├── components/                   # Reusable components
│   ├── ui/                       # UI components
│   │   ├── AnimatedButton.tsx
│   │   ├── AnimatedCard.tsx
│   │   ├── ElectricButton.tsx
│   │   ├── FloatingInput.tsx
│   │   ├── GlassCard.tsx
│   │   └── ...
│   ├── VerificationBadge.tsx
│   ├── VerificationReportModal.tsx
│   ├── FilterModal.tsx
│   └── ...
├── contexts/                     # Context providers
│   └── AuthContext.tsx           # Authentication state
├── utils/                        # Utility functions
│   ├── secureStorage.ts          # Secure storage wrapper
│   └── accessibility.ts          # Accessibility helpers
├── constants/                    # Constants & config
│   └── theme.ts                  # Theme configuration
└── assets/                       # Images, fonts, animations
    ├── images/
    ├── fonts/
    └── animations/
```

---

## Pages

### Authentication Pages

#### 1. Welcome Page (`/welcome.tsx`)
**Route**: `/welcome`

**Purpose**: Landing page with authentication options

**Features**:
- Login button
- Signup button
- Continue as Guest button
- Google OAuth button
- Animated gradient background

**Code Example**:
```typescript
import { ElectricButton } from '../components/ui/ElectricButton';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomePage() {
  const { login, continueAsGuest } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ElectricButton
        title="Login"
        onPress={() => router.push('/login')}
      />
      <ElectricButton
        title="Sign Up"
        onPress={() => router.push('/signup')}
      />
      <ElectricButton
        title="Continue as Guest"
        onPress={continueAsGuest}
        variant="secondary"
      />
    </SafeAreaView>
  );
}
```

---

#### 2. Login Page (`/login.tsx`)
**Route**: `/login`

**Form Fields**:
- Email (FloatingInput)
- Password (FloatingInput, secure)

**Features**:
- Email/password login
- Google OAuth button
- "Forgot Password?" link
- Input validation
- Loading states
- Error handling

**API Integration**:
```typescript
const handleLogin = async () => {
  try {
    setLoading(true);
    await login(email, password);
    router.replace('/(tabs)');
  } catch (error) {
    Alert.alert('Login Failed', error.message);
  } finally {
    setLoading(false);
  }
};
```

---

#### 3. Signup Page (`/signup.tsx`)
**Route**: `/signup`

**Form Fields**:
- Name
- Email
- Password
- Confirm Password

**Validation**:
- Email format validation
- Password strength (min 8 chars)
- Password match verification

**Flow**:
1. Submit signup form
2. Create account
3. Redirect to `/preferences` for vehicle setup

---

#### 4. Preferences Page (`/preferences.tsx`)
**Route**: `/preferences`

**Purpose**: Vehicle and charging port setup

**Form Fields**:
- Vehicle Type (dropdown)
  - Electric Car
  - Electric Scooter
  - Electric Bike
- Port Type (dropdown)
  - CCS2
  - CHAdeMO
  - Type 2
  - GB/T
- Distance Unit
  - Kilometers
  - Miles

**API Call**:
```typescript
await updatePreferences({
  vehicle_type: vehicleType,
  port_type: portType,
  distance_unit: distanceUnit
});
```

---

### Main App Pages (Tabs)

#### 1. Home Page (`/(tabs)/index.tsx`)
**Route**: `/(tabs)/`

**Sections**:
- **Welcome Header**: User greeting, coins, trust score
- **Quick Stats**: Chargers added, verifications, photos
- **Recent Activity**: Timeline of user actions
- **Leaderboard**: Top contributors
- **Suggested Chargers**: Nearby high-quality chargers

**Components Used**:
- `StatCard` - Statistics display
- `GlassCard` - Recent activity cards
- `ProgressRing` - Trust score visualization
- `CustomRefreshControl` - Pull to refresh

---

#### 2. Map Page (`/(tabs)/map.tsx`)
**Route**: `/(tabs)/map`

**Features**:
- **Interactive Map**: Mapbox with custom markers
- **Charger Markers**: Color-coded by verification level
- **User Location**: Real-time tracking
- **Route Planning**: Origin/destination inputs
- **Filter Modal**: Port type, verification level, amenities
- **Charger Details**: Bottom sheet on marker tap
- **Navigation**: Start turn-by-turn navigation

**Map Configuration**:
```typescript
<MapView
  provider="google"
  style={styles.map}
  initialRegion={{
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
  showsUserLocation={true}
  showsMyLocationButton={true}
>
  {chargers.map(charger => (
    <Marker
      key={charger.id}
      coordinate={{
        latitude: charger.latitude,
        longitude: charger.longitude
      }}
      pinColor={getVerificationColor(charger.verification_level)}
      onPress={() => showChargerDetails(charger)}
    />
  ))}
</MapView>
```

**Verification Level Colors**:
- Level 5: Green (#00C853)
- Level 4: Light Green (#64DD17)
- Level 3: Yellow (#FFD600)
- Level 2: Orange (#FF6D00)
- Level 1: Red (#DD2C00)

---

#### 3. Profile Page (`/(tabs)/profile.tsx`)
**Route**: `/(tabs)/profile`

**Sections**:
- **Profile Header**: Avatar, name, email
- **Stats Overview**:
  - Shara Coins
  - Trust Score
  - Rank Badge
- **Activity Stats**:
  - Chargers Added
  - Verifications Count
  - Photos Uploaded
- **Recent Transactions**: Coin earnings history
- **Settings**:
  - Theme (Light/Dark)
  - Notifications
  - Distance Unit
  - Update Preferences
- **Account Actions**:
  - Logout

**Trust Score Visual**:
```typescript
<ProgressRing
  progress={user.trust_score}
  size={120}
  strokeWidth={12}
  color="#00C853"
/>
```

---

### Feature Pages

#### 1. Navigation Page (`/navigation.tsx`)
**Route**: `/navigation`

**Purpose**: Turn-by-turn navigation with voice guidance

**Features**:
- **Route Polyline**: Animated route on map
- **Current Instruction**: Large card with next maneuver
- **Distance to Maneuver**: Real-time countdown
- **Voice Guidance**: Expo Speech API
- **Battery Monitor**: Energy consumption tracking
- **Low Battery Alert**: 20% threshold with charger suggestions
- **Lane Guidance**: Visual lane indicators
- **Haptic Feedback**: Turn confirmations
- **Arrival Detection**: Auto-complete navigation

**State Management**:
```typescript
const [currentStep, setCurrentStep] = useState(0);
const [distanceToNextStep, setDistanceToNextStep] = useState(0);
const [batteryLevel, setBatteryLevel] = useState(80);

useEffect(() => {
  const interval = setInterval(() => {
    updateLocation();
    calculateDistanceToNextStep();
    updateBatteryLevel();
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

**Voice Guidance**:
```typescript
const speakInstruction = async (instruction: string) => {
  await Speech.speak(instruction, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.9,
    onDone: () => console.log('Instruction spoken')
  });
};
```

---

#### 2. Charger Detail Page (`/charger-detail.tsx`)
**Route**: `/charger-detail?id={charger_id}`

**Sections**:
- **Header**: Name, address, distance
- **Verification Badge**: Level 1-5 indicator
- **Port Information**:
  - Available ports / Total ports
  - Port types (CCS2, Type 2, etc.)
- **Amenities**: Icons for restrooms, restaurants, parking, etc.
- **Photo Gallery**: Swipeable carousel
- **Recent Verifications**: Last 5 reports
- **Action Buttons**:
  - Verify Station
  - Get Directions
  - Report Issue

**Verification Badge**:
```typescript
<VerificationBadge
  level={charger.verification_level}
  verifiedCount={charger.verified_by_count}
  lastVerified={charger.last_verified}
/>
```

---

#### 3. Add Charger Page (`/add-charger.tsx`)
**Route**: `/add-charger`

**Form Fields**:
- **Name** (required)
- **Address** (required, with location picker)
- **Port Types** (multi-select)
- **Total Ports** (number)
- **Amenities** (multi-select)
- **Photos** (up to 5, ImagePicker)
- **Notes** (optional)

**Photo Upload**:
```typescript
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
    base64: true,
  });

  if (!result.canceled) {
    setPhotos([...photos, ...result.assets]);
  }
};
```

**Submission**:
```typescript
const handleSubmit = async () => {
  const formData = {
    name,
    address,
    latitude,
    longitude,
    port_types: selectedPortTypes,
    total_ports: totalPorts,
    amenities: selectedAmenities,
    photos: photos.map(p => p.base64),
    notes
  };

  const response = await axios.post('/api/chargers', formData);

  Alert.alert(
    'Success!',
    `Charger added! You earned ${response.data.coins_earned} coins!`
  );

  router.back();
};
```

**Coin Reward**: 5 base + 3 per photo

---

#### 4. Verify Station Page (`/verify-station.tsx`)
**Route**: `/verify-station?id={charger_id}`

**Form Sections**:

**1. Status (required)**
- Active ✅
- Partially Working ⚠️
- Not Working ❌

**2. Port Context (+1 coin)**
- Wait Time (minutes)
- Port Type Used
- Ports Available
- Charging Success (yes/no)

**3. Operational Details (+1 coin)**
- Payment Method (app/card/cash)
- Station Lighting (excellent/good/poor)

**4. Quality Ratings (+3 coins)**
- Cleanliness (1-5 stars)
- Charging Speed (1-5 stars)
- Amenities (1-5 stars)
- Would Recommend (yes/no)

**5. Photo Evidence (+2 coins for not_working)**
- Upload photo

**6. Notes (optional)**
- Additional comments

**Coin Display**:
```typescript
<View style={styles.coinPreview}>
  <Text>Potential Coins: {calculateCoins()} 💰</Text>
</View>

const calculateCoins = () => {
  let coins = 2; // base
  if (portContext) coins += 1;
  if (operationalDetails) coins += 1;
  if (qualityRatings) coins += 3;
  if (waitTime) coins += 1;
  if (photo && status === 'not_working') coins += 2;
  return coins;
};
```

---

#### 5. Verification Report Page (`/verification-report.tsx`)
**Route**: `/verification-report?id={charger_id}`

**Purpose**: View detailed verification history

**Features**:
- **Timeline View**: Chronological list of verifications
- **Filter by Status**: Active/Partial/Not Working
- **User Info**: Trust score, verification count
- **Photo Evidence**: Expandable images
- **Detailed Data**: All verification fields

**Example Entry**:
```typescript
<AnimatedCard>
  <View style={styles.verificationCard}>
    <View style={styles.header}>
      <Text style={styles.status}>{verification.action}</Text>
      <Text style={styles.time}>
        {formatRelativeTime(verification.timestamp)}
      </Text>
    </View>

    <Text>By: {verification.user.name}</Text>
    <Text>Trust Score: {verification.user.trust_score}</Text>

    {verification.port_type_used && (
      <Text>Port: {verification.port_type_used}</Text>
    )}

    {verification.cleanliness_rating && (
      <Text>Cleanliness: {renderStars(verification.cleanliness_rating)}</Text>
    )}

    {verification.photo_url && (
      <Image source={{ uri: verification.photo_url }} />
    )}

    {verification.notes && (
      <Text>{verification.notes}</Text>
    )}
  </View>
</AnimatedCard>
```

---

## Components

### UI Components (`/components/ui/`)

#### 1. ElectricButton
**File**: `components/ui/ElectricButton.tsx`

**Purpose**: Primary action button with electric theme

**Props**:
```typescript
interface ElectricButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}
```

**Usage**:
```typescript
<ElectricButton
  title="Add Charger"
  onPress={handleAddCharger}
  variant="primary"
  icon="plus"
  loading={isSubmitting}
/>
```

---

#### 2. FloatingInput
**File**: `components/ui/FloatingInput.tsx`

**Purpose**: Material Design style input with floating label

**Props**:
```typescript
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
}
```

**Features**:
- Animated label
- Error state with message
- Password visibility toggle
- Accessibility labels

---

#### 3. GlassCard
**File**: `components/ui/GlassCard.tsx`

**Purpose**: Glassmorphism card with blur effect

**Props**:
```typescript
interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: number;
}
```

**Styling**:
```typescript
<BlurView
  intensity={blurIntensity}
  tint="light"
  style={[
    styles.card,
    {
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    style
  ]}
>
  {children}
</BlurView>
```

---

#### 4. ProgressRing
**File**: `components/ui/ProgressRing.tsx`

**Purpose**: Circular progress indicator

**Props**:
```typescript
interface ProgressRingProps {
  progress: number; // 0-100
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
}
```

**Usage**:
```typescript
<ProgressRing
  progress={75}
  size={100}
  strokeWidth={10}
  color="#00C853"
/>
```

---

#### 5. StatCard
**File**: `components/ui/StatCard.tsx`

**Purpose**: Display key metrics

**Props**:
```typescript
interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}
```

---

#### 6. AnimatedButton / AnimatedCard / AnimatedCheckbox
**Purpose**: Components with entrance animations

**Features**:
- Fade in animation
- Scale animation
- Slide animation
- Haptic feedback on press

---

#### 7. ShimmerLoader
**File**: `components/ui/ShimmerLoader.tsx`

**Purpose**: Loading skeleton screens

**Usage**:
```typescript
{loading ? (
  <ShimmerLoader width="100%" height={200} />
) : (
  <ActualContent />
)}
```

---

### Feature Components

#### 1. VerificationBadge
**File**: `components/VerificationBadge.tsx`

**Purpose**: Display verification level

**Props**:
```typescript
interface VerificationBadgeProps {
  level: number; // 1-5
  verifiedCount?: number;
  lastVerified?: string;
  size?: 'small' | 'medium' | 'large';
}
```

**Visual**:
- Level 5: Green shield with checkmark
- Level 4: Light green shield
- Level 3: Yellow caution
- Level 2: Orange warning
- Level 1: Red alert

---

#### 2. FilterModal
**File**: `components/FilterModal.tsx`

**Purpose**: Charger filtering modal

**Filters**:
- Verification Level (1-5)
- Port Type (multi-select)
- Amenities (multi-select)
- Max Distance (slider)

**State**:
```typescript
const [filters, setFilters] = useState({
  verificationLevel: 1,
  portTypes: [],
  amenities: [],
  maxDistance: 10
});
```

---

## Contexts & State Management

### AuthContext
**File**: `contexts/AuthContext.tsx`

**Purpose**: Global authentication state

**State**:
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsPreferences: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  handleGoogleCallback: (token: string, needsPrefs: boolean) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: Preferences) => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

**Usage**:
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();

  if (!user) {
    return <LoginPrompt />;
  }

  return <Dashboard user={user} />;
}
```

**Token Storage**:
```typescript
import { getSecureItem, setSecureItem, deleteSecureItem } from '../utils/secureStorage';

// Store tokens
await setSecureItem('access_token', accessToken);
await setSecureItem('refresh_token', refreshToken);

// Retrieve tokens
const accessToken = await getSecureItem('access_token');

// Delete tokens (logout)
await deleteSecureItem('access_token');
await deleteSecureItem('refresh_token');
```

---

## Utilities

### Secure Storage
**File**: `utils/secureStorage.ts`

**Purpose**: Wrapper for Expo SecureStore with AsyncStorage fallback

**Functions**:
```typescript
export async function setSecureItem(key: string, value: string): Promise<void>;
export async function getSecureItem(key: string): Promise<string | null>;
export async function deleteSecureItem(key: string): Promise<void>;
```

**Implementation**:
```typescript
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setSecureItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    // Fallback to AsyncStorage
    await AsyncStorage.setItem(key, value);
  }
}
```

---

### Accessibility
**File**: `utils/accessibility.ts`

**Functions**:
```typescript
export function announceForAccessibility(message: string): void;
export function setAccessibilityFocus(ref: React.RefObject<any>): void;
```

---

## Styling & Theming

### Theme Configuration
**File**: `constants/theme.ts`

```typescript
export const theme = {
  colors: {
    primary: '#00C853',
    secondary: '#00E676',
    accent: '#69F0AE',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    error: '#DD2C00',
    warning: '#FF6D00',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
    },
    caption: {
      fontSize: 12,
      fontWeight: 'normal',
    },
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    round: 9999,
  },
};
```

---

## Navigation

### Expo Router File-Based Routing

**Structure**:
```
app/
├── index.tsx                 → /
├── welcome.tsx               → /welcome
├── login.tsx                 → /login
├── (tabs)/
│   ├── index.tsx             → /(tabs)/
│   ├── map.tsx               → /(tabs)/map
│   └── profile.tsx           → /(tabs)/profile
├── charger-detail.tsx        → /charger-detail?id=123
└── navigation.tsx            → /navigation
```

**Navigation Examples**:
```typescript
import { router } from 'expo-router';

// Navigate to page
router.push('/charger-detail?id=123');

// Navigate with params
router.push({
  pathname: '/charger-detail',
  params: { id: '123' }
});

// Go back
router.back();

// Replace (no back)
router.replace('/(tabs)');
```

---

## Performance Optimization

### 1. Image Optimization
```typescript
<Image
  source={{ uri: charger.photos[0] }}
  style={styles.image}
  resizeMode="cover"
  defaultSource={require('../assets/placeholder.png')}
/>
```

### 2. List Optimization
```typescript
<FlatList
  data={chargers}
  renderItem={({ item }) => <ChargerCard charger={item} />}
  keyExtractor={item => item.id}
  windowSize={10}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
  initialNumToRender={5}
/>
```

### 3. Memoization
```typescript
const MemoizedChargerCard = React.memo(ChargerCard);

const filteredChargers = useMemo(() => {
  return chargers.filter(c => c.verification_level >= minLevel);
}, [chargers, minLevel]);
```

---

## Testing

### Run Tests
```bash
npm run test
```

### Test Files
- Component tests
- Integration tests
- E2E tests with Detox

---

## Build & Deployment

### Development Build
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Production Build
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### App Configuration
**File**: `app.json`

```json
{
  "expo": {
    "name": "SharaSpot",
    "slug": "sharaspot",
    "version": "2.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#00C853"
    },
    "ios": {
      "bundleIdentifier": "com.sharaspot.app",
      "supportsTablet": true
    },
    "android": {
      "package": "com.sharaspot.app",
      "permissions": ["ACCESS_FINE_LOCATION", "CAMERA"]
    }
  }
}
```

---

## Accessibility Features

- **Screen Reader Support**: Accessible labels on all interactive elements
- **Haptic Feedback**: Touch feedback for buttons and interactions
- **High Contrast**: WCAG AA compliant color contrast
- **Font Scaling**: Respects system font size settings
- **Voice Guidance**: Turn-by-turn navigation with voice

---

This documentation covers the complete frontend architecture of the SharaSpot application. For API integration details, see [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md).
