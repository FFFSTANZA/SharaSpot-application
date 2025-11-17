# Eco Route & Navigation Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Route Calculation](#route-calculation)
- [Energy Consumption Model](#energy-consumption-model)
- [Elevation Data Integration](#elevation-data-integration)
- [Charger Integration](#charger-integration)
- [Turn-by-Turn Navigation](#turn-by-turn-navigation)
- [API Reference](#api-reference)
- [Frontend Implementation](#frontend-implementation)

---

## Overview

The SharaSpot Eco Route system provides intelligent, energy-optimized routing for electric vehicles. It combines real-time traffic data, elevation analysis, physics-based energy modeling, and charger integration to deliver the most efficient routes.

### Key Features
- **3 Route Profiles**: Eco, Balanced, Fastest
- **Physics-Based Energy Model**: Accounts for rolling resistance, air resistance, elevation, and regenerative braking
- **Elevation Integration**: FREE elevation data from Open-Topo-Data
- **Charger Suggestions**: Finds chargers within 5km of route
- **Turn-by-Turn Navigation**: Voice guidance with lane directions
- **Real-Time Battery Monitoring**: Predicts battery level at destination
- **Low Battery Alerts**: Suggests nearby chargers when battery drops below 20%

---

## Architecture

### Technology Stack

**Backend**:
- **Routing API**: Mapbox Directions API (production-grade)
- **Elevation API**: Open-Topo-Data (FREE, SRTM 30m dataset)
- **Weather API**: OpenWeatherMap (FREE tier)
- **Caching**: In-memory elevation cache (24-hour TTL)

**Frontend**:
- **Maps**: react-native-maps (Mapbox provider)
- **Voice**: Expo Speech API (FREE)
- **Location**: Expo Location (real-time tracking)
- **Haptics**: Expo Haptics (turn feedback)

---

## Route Calculation

### 1. Mapbox Directions API

**Endpoint**: `https://api.mapbox.com/directions/v5/mapbox/driving/{coordinates}`

**Parameters**:
```python
{
    "alternatives": 3,           # Get 3 alternative routes
    "geometries": "polyline6",   # Google polyline format
    "steps": "true",             # Turn-by-turn instructions
    "banner_instructions": "true", # Navigation banners
    "voice_instructions": "true", # Voice guidance text
    "annotations": "distance,duration,speed", # Route metadata
    "overview": "full"           # Complete route geometry
}
```

**Response**:
```json
{
  "routes": [
    {
      "distance": 15234.5,      // meters
      "duration": 1920.3,       // seconds
      "geometry": "encoded_polyline_string",
      "legs": [
        {
          "steps": [
            {
              "distance": 500,
              "duration": 60,
              "geometry": "...",
              "maneuver": {
                "type": "turn",
                "instruction": "Turn right onto Park Avenue",
                "modifier": "right"
              },
              "voiceInstructions": [
                {
                  "distanceAlongGeometry": 450,
                  "announcement": "In 500 meters, turn right onto Park Avenue"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 2. Route Profiles

**Implementation**:
```python
async def calculate_routes(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    vehicle_config: dict
) -> List[Route]:
    """
    Calculate 3 alternative routes with different optimization strategies.
    """
    # Call Mapbox API once to get 3 alternatives
    mapbox_routes = await call_mapbox_directions_api(origin, destination)

    routes = []
    for idx, mapbox_route in enumerate(mapbox_routes[:3]):
        # Decode polyline to coordinates
        coordinates = decode_polyline(mapbox_route['geometry'])

        # Fetch elevation data
        elevations = await fetch_elevation_data(coordinates)

        # Calculate energy consumption
        energy_kwh = calculate_ev_energy_consumption(
            coordinates,
            elevations,
            vehicle_config
        )

        # Determine profile based on characteristics
        if idx == 0:
            profile = "eco"       # Lowest energy
        elif idx == 1:
            profile = "balanced"  # Balance time & energy
        else:
            profile = "fastest"   # Shortest time

        # Calculate scores
        eco_score = calculate_eco_score(energy_kwh, mapbox_route['distance'])
        reliability_score = await calculate_reliability_score(coordinates)

        routes.append({
            "profile": profile,
            "distance_km": mapbox_route['distance'] / 1000,
            "duration_minutes": mapbox_route['duration'] / 60,
            "energy_consumption_kwh": energy_kwh,
            "eco_score": eco_score,
            "reliability_score": reliability_score,
            "geometry": mapbox_route['geometry'],
            "steps": process_turn_instructions(mapbox_route['legs'][0]['steps'])
        })

    return routes
```

---

## Energy Consumption Model

### Physics-Based Calculation

**Formula Components**:
1. **Rolling Resistance**: Friction between tires and road
2. **Air Resistance**: Drag force (quadratic with speed)
3. **Elevation Change**: Potential energy gain/loss
4. **Regenerative Braking**: Energy recovery on descents
5. **HVAC Overhead**: Heating/cooling energy

---

### 1. Rolling Resistance

**Formula**:
```
E_rolling = m × g × C_rr × d
```

**Variables**:
- `m` = vehicle mass (kg)
- `g` = gravity (9.81 m/s²)
- `C_rr` = rolling resistance coefficient (0.008-0.015)
- `d` = distance (m)

**Vehicle Coefficients**:
```python
ROLLING_RESISTANCE = {
    "sedan": 0.008,      # Low resistance (aerodynamic)
    "suv": 0.012,        # Medium resistance
    "truck": 0.015,      # High resistance (larger tires)
}
```

---

### 2. Air Resistance

**Formula**:
```
E_air = 0.5 × ρ × C_d × A × v³ × t
```

**Variables**:
- `ρ` = air density (1.225 kg/m³)
- `C_d` = drag coefficient
- `A` = frontal area (m²)
- `v` = velocity (m/s)
- `t` = time (s)

**Vehicle Parameters**:
```python
VEHICLE_PARAMS = {
    "sedan": {
        "mass_kg": 1800,
        "drag_coefficient": 0.24,  # Low drag
        "frontal_area_m2": 2.2,
    },
    "suv": {
        "mass_kg": 2200,
        "drag_coefficient": 0.32,  # Medium drag
        "frontal_area_m2": 2.8,
    },
    "truck": {
        "mass_kg": 2800,
        "drag_coefficient": 0.40,  # High drag
        "frontal_area_m2": 3.5,
    },
}
```

---

### 3. Elevation Change

**Potential Energy Formula**:
```
E_elevation = m × g × Δh
```

**Variables**:
- `m` = vehicle mass (kg)
- `g` = gravity (9.81 m/s²)
- `Δh` = elevation change (m)
  - Positive for climbing (energy consumed)
  - Negative for descending (energy recovered)

---

### 4. Regenerative Braking

**Recovery Efficiency**: 70%

**Formula**:
```
E_recovered = |E_elevation| × 0.70  (for Δh < 0)
```

**Example**:
```
Descending 100m:
E_potential = 1800 kg × 9.81 m/s² × -100m = -1,765,800 J = -0.49 kWh
E_recovered = 0.49 kWh × 0.70 = 0.343 kWh
```

---

### 5. HVAC Overhead

**Additional Consumption**: 15% of total energy

**Rationale**: Climate control (heating/cooling) consumes energy independent of driving

---

### Complete Energy Calculation

**Implementation**:
```python
async def calculate_ev_energy_consumption(
    route_geometry: List[Tuple[float, float]],
    elevations: List[float],
    vehicle_type: str,
    battery_capacity_kwh: float
) -> float:
    """
    Calculate energy consumption using physics-based model.

    Args:
        route_geometry: List of (lat, lng) coordinates
        elevations: Elevation at each coordinate (meters)
        vehicle_type: "sedan", "suv", "truck"
        battery_capacity_kwh: Battery capacity

    Returns:
        Total energy consumption (kWh)
    """
    # Vehicle parameters
    params = VEHICLE_PARAMS[vehicle_type]
    mass = params["mass_kg"]
    drag_coeff = params["drag_coefficient"]
    frontal_area = params["frontal_area_m2"]
    rolling_resistance_coeff = ROLLING_RESISTANCE[vehicle_type]

    total_energy_joules = 0

    # Iterate through route segments
    for i in range(len(route_geometry) - 1):
        # Calculate segment distance (Haversine formula)
        distance_m = calculate_distance(
            route_geometry[i],
            route_geometry[i + 1]
        )

        # Elevation change
        elevation_change_m = elevations[i + 1] - elevations[i]

        # Assume average speed based on distance and typical urban driving
        # For simplicity, use 50 km/h = 13.89 m/s
        # (In production, use Mapbox's speed annotations)
        speed_m_s = 13.89
        time_s = distance_m / speed_m_s

        # 1. Rolling resistance energy
        E_rolling = mass * 9.81 * rolling_resistance_coeff * distance_m

        # 2. Air resistance energy
        E_air = 0.5 * 1.225 * drag_coeff * frontal_area * (speed_m_s ** 3) * time_s

        # 3. Elevation energy (with regenerative braking)
        E_elevation = mass * 9.81 * elevation_change_m
        if E_elevation < 0:
            # Descending: recover 70% of potential energy
            E_elevation = E_elevation * 0.3  # Only lose 30%
        # else: climbing, full energy required

        # Total segment energy
        segment_energy = E_rolling + E_air + E_elevation

        total_energy_joules += segment_energy

    # Convert joules to kWh
    total_energy_kwh = total_energy_joules / 3_600_000

    # Add HVAC overhead (15%)
    total_energy_kwh *= 1.15

    return round(total_energy_kwh, 2)
```

---

### Example Calculation

**Route**: 15 km, flat terrain, sedan

**Segment 1**: 1 km, flat
```
E_rolling = 1800 × 9.81 × 0.008 × 1000 = 141,264 J
E_air = 0.5 × 1.225 × 0.24 × 2.2 × (13.89³) × 72 = 55,832 J
E_elevation = 0 J
Segment total = 197,096 J
```

**Total for 15 km** (15 segments):
```
Total = 197,096 × 15 = 2,956,440 J = 0.82 kWh
With HVAC (15%): 0.82 × 1.15 = 0.94 kWh
```

**Battery Impact** (50 kWh battery, 80% initial):
```
Initial: 40 kWh (80%)
Consumed: 0.94 kWh
Final: 39.06 kWh (78.1%)
```

---

## Elevation Data Integration

### Open-Topo-Data API

**Provider**: Open-Topo-Data (FREE, self-hostable)

**Dataset**: SRTM 30m (Shuttle Radar Topography Mission)
- **Coverage**: Global (56°S to 60°N)
- **Resolution**: 30 meters
- **Accuracy**: ±16 meters vertical

**Endpoint**: `https://api.opentopodata.org/v1/srtm30m?locations={lat1,lng1}|{lat2,lng2}|...`

---

### Implementation

```python
import asyncio
from datetime import datetime, timedelta

# In-memory cache (24-hour TTL)
elevation_cache = {}

async def fetch_elevation_data(
    coordinates: List[Tuple[float, float]]
) -> List[float]:
    """
    Fetch elevation data for route coordinates.

    Uses batch processing (100 coords/request) and 24-hour cache.

    Args:
        coordinates: List of (lat, lng) tuples

    Returns:
        List of elevations (meters)
    """
    elevations = []
    batch_size = 100  # API limit

    for i in range(0, len(coordinates), batch_size):
        batch = coordinates[i:i + batch_size]

        # Create cache key
        cache_key = hash(tuple(batch))

        # Check cache
        if cache_key in elevation_cache:
            cached_data, timestamp = elevation_cache[cache_key]
            if datetime.utcnow() - timestamp < timedelta(hours=24):
                elevations.extend(cached_data)
                continue

        # Format locations parameter
        locations = "|".join([f"{lat},{lng}" for lat, lng in batch])

        # API request
        url = f"https://api.opentopodata.org/v1/srtm30m?locations={locations}"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as response:
                    data = await response.json()

                    batch_elevations = [
                        result['elevation'] for result in data['results']
                    ]

                    # Cache for 24 hours
                    elevation_cache[cache_key] = (batch_elevations, datetime.utcnow())

                    elevations.extend(batch_elevations)

        except Exception as e:
            print(f"Elevation API error: {e}")
            # Fallback: use previous elevation or 0
            elevations.extend([elevations[-1] if elevations else 0] * len(batch))

        # Rate limiting (be respectful to free API)
        await asyncio.sleep(0.1)

    return elevations
```

---

### Elevation Profile

**Frontend Display**:
```typescript
interface ElevationPoint {
  distance: number;  // meters from start
  elevation: number; // meters above sea level
}

// Calculate elevation profile
const elevationProfile: ElevationPoint[] = coordinates.map((coord, idx) => ({
  distance: cumulativeDistances[idx],
  elevation: elevations[idx]
}));

// Chart component
<LineChart
  data={elevationProfile}
  xKey="distance"
  yKey="elevation"
  color="#00C853"
/>
```

---

## Charger Integration

### Finding Chargers Along Route

**Strategy**: Bounding box + Haversine distance filtering

**Implementation**:
```python
async def find_chargers_along_route(
    route_geometry: List[Tuple[float, float]],
    port_type: str,
    max_detour_km: float = 5.0,
    db: AsyncSession
) -> List[Charger]:
    """
    Find chargers within max_detour_km of route.

    Args:
        route_geometry: Route coordinates
        port_type: User's vehicle port type
        max_detour_km: Maximum detour from route (default 5 km)

    Returns:
        List of nearby chargers, sorted by distance from route
    """
    # 1. Calculate bounding box around route
    lats = [coord[0] for coord in route_geometry]
    lngs = [coord[1] for coord in route_geometry]

    min_lat = min(lats) - 0.05  # ~5.5 km buffer
    max_lat = max(lats) + 0.05
    min_lng = min(lngs) + 0.05
    max_lng = max(lngs) + 0.05

    # 2. Query chargers in bounding box
    query = select(Charger).where(
        Charger.latitude >= min_lat,
        Charger.latitude <= max_lat,
        Charger.longitude >= min_lng,
        Charger.longitude <= max_lng,
        Charger.port_types.contains([port_type])  # PostgreSQL array contains
    )

    result = await db.execute(query)
    candidates = result.scalars().all()

    # 3. Filter by actual distance to route
    chargers_on_route = []

    for charger in candidates:
        # Calculate minimum distance from charger to any point on route
        min_distance_km = min([
            haversine_distance(
                (charger.latitude, charger.longitude),
                route_point
            )
            for route_point in route_geometry
        ])

        if min_distance_km <= max_detour_km:
            chargers_on_route.append({
                **charger.__dict__,
                "distance_from_route_km": round(min_distance_km, 2)
            })

    # 4. Sort by distance and limit to top 10
    chargers_on_route.sort(key=lambda c: c['distance_from_route_km'])

    return chargers_on_route[:10]


def haversine_distance(
    coord1: Tuple[float, float],
    coord2: Tuple[float, float]
) -> float:
    """
    Calculate great-circle distance between two coordinates.

    Args:
        coord1: (lat, lng) in degrees
        coord2: (lat, lng) in degrees

    Returns:
        Distance in kilometers
    """
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2) ** 2 + \
        math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2

    c = 2 * math.asin(math.sqrt(a))

    # Earth radius in kilometers
    r = 6371

    return c * r
```

---

## Turn-by-Turn Navigation

### Navigation Features

**Frontend Page**: `/app/navigation.tsx`

1. **Voice Guidance**: Expo Speech API
2. **Visual Instructions**: Large turn cards
3. **Distance Countdown**: Real-time distance to next maneuver
4. **Lane Guidance**: Visual lane indicators
5. **Haptic Feedback**: Vibration on turns
6. **Battery Monitor**: Energy consumption tracking
7. **Low Battery Alerts**: Charger suggestions at 20%

---

### Voice Guidance Implementation

```typescript
import * as Speech from 'expo-speech';

const speakInstruction = async (instruction: string) => {
  // Stop any ongoing speech
  await Speech.stop();

  // Speak the instruction
  await Speech.speak(instruction, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.9,  // Slightly slower for clarity
    onDone: () => console.log('Instruction spoken'),
    onError: (error) => console.error('Speech error:', error)
  });
};

// Trigger voice guidance based on distance
useEffect(() => {
  const distanceToNext = calculateDistanceToNextStep();

  // Speak at 500m, 200m, 100m
  if ([500, 200, 100].includes(Math.floor(distanceToNext))) {
    speakInstruction(currentStep.voiceInstructions[0].announcement);
  }

  // Speak "Now" at 50m
  if (distanceToNext <= 50) {
    speakInstruction(`Now, ${currentStep.maneuver.instruction}`);
  }
}, [userLocation]);
```

---

### Real-Time Location Tracking

```typescript
import * as Location from 'expo-location';

useEffect(() => {
  let locationSubscription: Location.LocationSubscription;

  const startTracking = async () => {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location access is required for navigation');
      return;
    }

    // Start watching location
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,  // Update every second
        distanceInterval: 5,  // Or every 5 meters
      },
      (location) => {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Update distance to next step
        updateNavigationProgress(location.coords);

        // Update battery prediction
        updateBatteryPrediction(location.coords);
      }
    );
  };

  startTracking();

  return () => {
    if (locationSubscription) {
      locationSubscription.remove();
    }
  };
}, []);
```

---

### Navigation Progress

```typescript
const updateNavigationProgress = (currentLocation: Location.LocationCoords) => {
  // Calculate distance to next step
  const distanceToNext = haversineDistance(
    { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
    { latitude: currentStep.maneuver.location[1], longitude: currentStep.maneuver.location[0] }
  );

  setDistanceToNextStep(distanceToNext);

  // Check if we've reached the maneuver point (within 20 meters)
  if (distanceToNext <= 0.02) {  // 20 meters in km
    // Advance to next step
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Speak next instruction
      speakInstruction(steps[currentStepIndex + 1].voiceInstructions[0].announcement);
    } else {
      // Arrived at destination
      handleArrival();
    }
  }
};
```

---

### Battery Monitoring

```typescript
const [batteryLevel, setBatteryLevel] = useState(currentBatteryPercent);
const [energyConsumed, setEnergyConsumed] = useState(0);

const updateBatteryPrediction = (currentLocation: Location.LocationCoords) => {
  // Calculate distance traveled since last update
  const distanceTraveled = haversineDistance(lastLocation, currentLocation);

  // Estimate energy consumed for this segment
  // (simplified: use route's average consumption rate)
  const energyPerKm = route.energy_consumption_kwh / route.distance_km;
  const segmentEnergy = distanceTraveled * energyPerKm;

  setEnergyConsumed(prev => prev + segmentEnergy);

  // Update battery level
  const newBatteryPercent = currentBatteryPercent -
    (segmentEnergy / batteryCapacityKwh * 100);

  setBatteryLevel(newBatteryPercent);

  // Low battery alert
  if (newBatteryPercent <= 20 && !hasShownLowBatteryAlert) {
    showLowBatteryAlert();
  }

  setLastLocation(currentLocation);
};

const showLowBatteryAlert = async () => {
  setHasShownLowBatteryAlert(true);

  // Find nearby chargers
  const nearbyChargers = await findNearbyChargers(userLocation);

  Alert.alert(
    'Low Battery',
    `Your battery is at ${batteryLevel.toFixed(0)}%. Would you like to see nearby chargers?`,
    [
      { text: 'No', style: 'cancel' },
      {
        text: 'Show Chargers',
        onPress: () => setShowChargerModal(true)
      }
    ]
  );
};
```

---

### Arrival Detection

```typescript
const handleArrival = async () => {
  // Stop navigation
  setIsNavigating(false);

  // Stop location tracking
  if (locationSubscription) {
    locationSubscription.remove();
  }

  // Haptic feedback
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  // Award coins for completing navigation
  const coinsEarned = 5;
  await awardNavigationCoins(coinsEarned);

  // Show arrival summary
  Alert.alert(
    'Arrived!',
    `You've reached your destination!\n\n` +
    `Distance: ${route.distance_km.toFixed(1)} km\n` +
    `Energy Used: ${energyConsumed.toFixed(2)} kWh\n` +
    `Duration: ${elapsedMinutes} min\n\n` +
    `You earned ${coinsEarned} Shara Coins!`,
    [{ text: 'OK', onPress: () => router.back() }]
  );
};
```

---

## API Reference

### POST `/api/routing/here/calculate`

**Request**:
```json
{
  "origin_lat": 28.6139,
  "origin_lng": 77.2090,
  "destination_lat": 28.5355,
  "destination_lng": 77.3910,
  "battery_capacity_kwh": 50.0,
  "current_battery_percent": 80,
  "vehicle_type": "sedan",
  "port_type": "ccs2"
}
```

**Response**:
```json
{
  "routes": [
    {
      "profile": "eco",
      "distance_km": 15.2,
      "duration_minutes": 32,
      "energy_consumption_kwh": 3.8,
      "battery_at_destination": 72,
      "eco_score": 92,
      "reliability_score": 85,
      "geometry": "encoded_polyline_string",
      "steps": [
        {
          "instruction": "Head north on Main Street",
          "distance_meters": 500,
          "duration_seconds": 60,
          "voice_text": "In 500 meters, turn right onto Park Avenue",
          "maneuver": {
            "type": "turn",
            "modifier": "right",
            "location": [77.2095, 28.6145]
          },
          "lanes": [
            {"valid": false, "indications": ["left"]},
            {"valid": true, "indications": ["straight", "right"]}
          ]
        }
      ],
      "chargers_along_route": [
        {
          "id": "uuid",
          "name": "Midway Charging Hub",
          "latitude": 28.5747,
          "longitude": 77.3009,
          "distance_from_route_km": 0.8,
          "port_types": ["ccs2"],
          "verification_level": 4,
          "available_ports": 3
        }
      ],
      "elevation_profile": [
        {"distance": 0, "elevation": 215},
        {"distance": 1000, "elevation": 225},
        {"distance": 2000, "elevation": 235}
      ],
      "weather": {
        "temperature": 28,
        "wind_speed": 5.2,
        "conditions": "clear sky"
      }
    }
  ]
}
```

---

## Frontend Implementation

### Map Page (`/(tabs)/map.tsx`)

```typescript
export default function MapPage() {
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const calculateRoutes = async () => {
    try {
      setLoading(true);

      const response = await axios.post('/api/routing/here/calculate', {
        origin_lat: origin.latitude,
        origin_lng: origin.longitude,
        destination_lat: destination.latitude,
        destination_lng: destination.longitude,
        battery_capacity_kwh: user.battery_capacity || 50,
        current_battery_percent: currentBattery,
        vehicle_type: user.vehicle_type,
        port_type: user.port_type,
      });

      setRoutes(response.data.routes);
      setSelectedRoute(response.data.routes[0]); // Default to eco

    } catch (error) {
      Alert.alert('Error', 'Failed to calculate routes');
    } finally {
      setLoading(false);
    }
  };

  const startNavigation = () => {
    router.push({
      pathname: '/navigation',
      params: {
        route: JSON.stringify(selectedRoute),
        battery_capacity: user.battery_capacity,
        current_battery: currentBattery,
      }
    });
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map}>
        {/* Origin marker */}
        {origin && <Marker coordinate={origin} pinColor="green" />}

        {/* Destination marker */}
        {destination && <Marker coordinate={destination} pinColor="red" />}

        {/* Route polyline */}
        {selectedRoute && (
          <Polyline
            coordinates={decodePolyline(selectedRoute.geometry)}
            strokeColor="#00C853"
            strokeWidth={4}
          />
        )}

        {/* Chargers along route */}
        {selectedRoute?.chargers_along_route.map(charger => (
          <Marker
            key={charger.id}
            coordinate={{
              latitude: charger.latitude,
              longitude: charger.longitude
            }}
            pinColor={getVerificationColor(charger.verification_level)}
          />
        ))}
      </MapView>

      {/* Route selection */}
      {routes.length > 0 && (
        <View style={styles.routeSelector}>
          {routes.map(route => (
            <TouchableOpacity
              key={route.profile}
              onPress={() => setSelectedRoute(route)}
              style={[
                styles.routeCard,
                selectedRoute?.profile === route.profile && styles.selectedRoute
              ]}
            >
              <Text style={styles.profileName}>{route.profile}</Text>
              <Text>{route.distance_km.toFixed(1)} km</Text>
              <Text>{route.duration_minutes.toFixed(0)} min</Text>
              <Text>{route.energy_consumption_kwh.toFixed(1)} kWh</Text>
              <Text>Eco: {route.eco_score}/100</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ElectricButton
        title="Start Navigation"
        onPress={startNavigation}
        disabled={!selectedRoute}
      />
    </View>
  );
}
```

---

This comprehensive documentation covers the complete Eco Route & Navigation system. For API integration, see [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md).
