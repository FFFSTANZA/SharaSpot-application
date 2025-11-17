# Production-Grade EV Navigation System

## Overview

This document describes the comprehensive EV navigation system implemented for SharaSpot, featuring turn-by-turn navigation, voice guidance, battery monitoring, and intelligent charging stop suggestions.

## Architecture

### Backend (Python/FastAPI)

#### Mapbox Directions API Integration
- **File**: `backend/app/services/routing_service.py`
- **Primary Function**: `calculate_mapbox_routes()`
- **Features**:
  - 3 route alternatives: Eco, Balanced, Fastest
  - Parallel route fetching for optimal performance
  - Turn-by-turn instructions with voice text
  - Banner instructions for visual guidance
  - Lane-level guidance
  - Traffic-aware routing

#### Open-Topo-Data Elevation Integration
- **Function**: `fetch_elevation_data()`
- **Dataset**: SRTM 30m (global coverage)
- **Optimizations**:
  - 24-hour in-memory cache
  - Batch processing (100 coords/request)
  - Graceful fallback on errors
- **Benefits**: FREE, accurate elevation data for energy consumption modeling

#### Physics-Based Energy Consumption
- **Function**: `calculate_ev_energy_consumption()`
- **Model Includes**:
  - Rolling resistance (constant)
  - Air resistance (speed-dependent, quadratic)
  - Elevation changes (potential energy)
  - Regenerative braking (70% efficiency)
  - HVAC overhead (15%)
- **Accuracy**: ±10% typical EV consumption patterns

### Frontend (React Native/Expo)

#### Navigation Screen
- **File**: `frontend/app/navigation.tsx`
- **Features**:
  - Full-screen map with route overlay
  - Real-time turn-by-turn instructions
  - Voice guidance with Expo Speech (FREE)
  - Battery monitoring with visual indicators
  - Low battery alerts (triggers at 22%)
  - Charging stop prompts
  - Lane guidance
  - Arrival summary with coins earned

#### Map Screen Integration
- **File**: `frontend/app/(tabs)/map.tsx`
- **Updates**:
  - "Start Navigation" button
  - Route data preparation
  - Battery capacity calculation
  - Navigation screen integration

## User Flow

### Before Navigation

1. **Route Planning**
   - User enters origin (auto-filled with current location) and destination
   - Sets battery level (slider, default 80%)
   - Taps "Find Best EV Routes"

2. **Route Selection**
   - Views 3 alternatives: Eco (highlighted), Balanced, Fastest
   - Reviews:
     - Distance, time, energy consumption
     - Eco score (0-100)
     - Reliability score (based on chargers)
     - Battery at arrival
     - Chargers along route (top 5)
   - Selects preferred route
   - Taps "Start Navigation"

### During Navigation

1. **Navigation Screen Launch**
   - Full-screen map with route
   - Status bar shows:
     - Battery: 80% → 68% predicted
     - ETA: 42 min
     - Distance: 38 km remaining

2. **Turn-by-Turn Guidance**
   - Visual: Large arrow icon with street name
   - Voice: "In 800 meters, turn right onto Highway 45"
   - Lane guidance: "Stay in right 2 lanes"
   - Distance updates in real-time

3. **Battery Monitoring**
   - Real-time battery percentage
   - Color-coded:
     - Green: > 30%
     - Amber: > 15%
     - Red: ≤ 15%

4. **Low Battery Alert (at 22%)**
   - Voice: "Battery low, charging station in 5 kilometers"
   - Map highlights nearest charger
   - Prompt: "Add charging stop?"
   - Shows charger details:
     - Name, address
     - Available ports
     - Verification level

5. **Charging Stop (if added)**
   - Reroutes to charger
   - Voice: "You've arrived at ChargePoint Station"
   - Prompt: "Start charging? Tap to verify station (earn 2 coins)"
   - After charging: Resume navigation to destination

6. **Arrival**
   - Voice: "You've arrived at your destination"
   - Summary screen:
     - Distance: 38 km driven
     - Energy: 12.5 kWh used
     - Duration: 42 min
     - SharaCoins: 5 earned

## API Endpoints

### Route Calculation
```http
POST /api/routing/here/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "origin_lat": 13.0827,
  "origin_lng": 80.2707,
  "destination_lat": 13.0418,
  "destination_lng": 80.2341,
  "battery_capacity_kwh": 60,
  "current_battery_percent": 80,
  "vehicle_type": "sedan",
  "port_type": "Type 2"
}
```

**Response**:
```json
{
  "routes": [
    {
      "id": "mapbox_eco_0",
      "type": "eco",
      "distance_m": 38000,
      "duration_s": 2520,
      "energy_consumption_kwh": 5.3,
      "elevation_gain_m": 45,
      "elevation_loss_m": 38,
      "eco_score": 87.5,
      "reliability_score": 92.0,
      "coordinates": [...],
      "summary": {
        "distance_km": 38,
        "duration_min": 42,
        "avg_speed_kmh": 54,
        "chargers_available": 5,
        "turn_instructions": [
          {
            "step_index": 0,
            "distance_m": 800,
            "instruction": "Turn right onto Highway 45",
            "voice_text": "In 800 meters, turn right onto Highway 45",
            "type": "turn",
            "modifier": "right",
            "street_name": "Highway 45",
            "location": [80.2707, 13.0827],
            "lanes": [...]
          }
        ]
      }
    }
  ],
  "chargers_along_route": [...],
  "weather_data": {...}
}
```

## Performance Optimizations

### Backend

1. **Parallel Route Fetching**
   - Fetch 3 route profiles concurrently using `asyncio.gather()`
   - Reduces latency by ~66% vs sequential

2. **Elevation Caching**
   - 24-hour in-memory cache
   - Hash-based lookup (MD5)
   - Prevents redundant API calls

3. **Coordinate Sampling**
   - Sample every ~50m for elevation (max 100 points)
   - Balances accuracy vs API usage

4. **Charger Bounding Box**
   - Filter chargers by geographic bounds first
   - Dramatically reduces DB rows scanned

5. **Batch Processing**
   - Open-Topo-Data: 100 coords/request
   - Minimizes HTTP overhead

### Frontend

1. **Conditional Imports**
   - Maps only on mobile (not web)
   - Reduces bundle size

2. **Location Tracking**
   - Best-for-navigation accuracy
   - 1-second or 5-meter intervals
   - Optimal for turn-by-turn

3. **Voice Synthesis**
   - Expo Speech API (free, built-in)
   - Zero additional dependencies
   - Automatic speech queueing

4. **State Management**
   - React hooks with local state
   - Minimal re-renders
   - Efficient update cycles

## Configuration

### Environment Variables

#### Backend (.env)
```bash
# Mapbox API (PRIMARY)
MAPBOX_API_KEY=your_mapbox_api_key_here

# HERE API (LEGACY - for backward compatibility)
HERE_API_KEY=your_here_api_key_here

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/sharaspot

# Other APIs
OPENWEATHER_API_KEY=your_openweather_key_here
```

#### Frontend (.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

## Dependencies

### Backend
- `httpx`: Async HTTP client
- `asyncio`: Concurrent processing
- `fastapi`: Web framework
- `sqlalchemy`: Database ORM

### Frontend
- `expo-speech@~14.0.7`: Voice guidance (NEW)
- `expo-location@^19.0.7`: GPS tracking
- `react-native-maps@^1.26.18`: Map rendering
- `expo-router@~5.1.4`: Navigation

## Cost Analysis

| Service | Provider | Cost | Usage |
|---------|----------|------|-------|
| Routing | Mapbox | $0.60/1K | ~100 requests/day = $1.80/month |
| Elevation | Open-Topo-Data | **FREE** | Unlimited (with caching) |
| Voice | Expo Speech | **FREE** | Built-in, no API calls |
| Maps | Google Maps | FREE tier | < 28K loads/month |

**Total Estimated Cost**: ~$2-5/month for 100 users

## Testing Checklist

- [ ] Route calculation with 3 alternatives
- [ ] Turn-by-turn instructions display
- [ ] Voice guidance (test audio)
- [ ] Battery percentage updates
- [ ] Low battery alert (at 22%)
- [ ] Charging stop prompt
- [ ] Lane guidance display
- [ ] Arrival summary
- [ ] Coins awarded after navigation
- [ ] Offline handling (graceful degradation)
- [ ] Location permissions
- [ ] Background location tracking

## Known Limitations

1. **Geocoding**: Currently uses mock coordinates; needs integration with geocoding service
2. **Route Recalculation**: Not yet implemented if user deviates from route
3. **Offline Maps**: Not available; requires internet connection
4. **Custom Waypoints**: Not yet supported
5. **Multi-stop Routes**: Limited to single destination

## Future Enhancements

1. **Live Traffic Integration**: Real-time traffic updates
2. **Predictive Charging**: ML-based charging stop suggestions
3. **Community Reports**: Hazard warnings, road closures
4. **AR Navigation**: Augmented reality turn guidance
5. **Voice Customization**: Multiple voice options, languages
6. **CarPlay/Android Auto**: Integration for in-vehicle displays
7. **Offline Maps**: Download maps for offline navigation

## Monitoring & Metrics

### Key Metrics to Track

1. **Navigation Success Rate**: % of navigations completed
2. **Average Energy Accuracy**: Predicted vs actual consumption
3. **Voice Guidance Reliability**: % of instructions spoken
4. **Battery Alert Effectiveness**: % of low-battery users who charged
5. **API Response Times**:
   - Mapbox: < 500ms (p95)
   - Open-Topo-Data: < 1s (p95)
6. **Cache Hit Rate**: % of elevation requests served from cache

## Support & Troubleshooting

### Common Issues

1. **"Routing service unavailable"**
   - Check MAPBOX_API_KEY is set
   - Verify API key permissions
   - Check API quota

2. **No voice guidance**
   - Check device volume
   - Verify permissions (audio)
   - Check expo-speech installation

3. **Location not updating**
   - Check location permissions
   - Verify GPS is enabled
   - Check accuracy settings

4. **High API costs**
   - Verify caching is working
   - Check for duplicate requests
   - Review sampling interval

## Credits

- **Mapbox**: Industry-leading routing and maps
- **Open-Topo-Data**: Free elevation data
- **Expo**: React Native framework and Speech API
- **SharaSpot Team**: Implementation and integration

## License

Proprietary - SharaSpot EV Charging Platform

---

**Last Updated**: 2025-11-17
**Version**: 1.0.0
**Author**: SharaSpot Development Team
