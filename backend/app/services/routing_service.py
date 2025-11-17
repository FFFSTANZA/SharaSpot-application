"""Routing service with Mapbox API and Open-Topo-Data integration for production-grade EV navigation"""
from typing import List, Dict, Optional
import os
import httpx
import asyncio
import logging
import hashlib
import json
from functools import lru_cache
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.routing import HERERouteRequest, HERERouteResponse
from ..models.routing import RouteAlternative
from ..core import calculate_distance
from ..core.config import settings
from ..core.db_models import Charger
from .weather_service import get_weather_along_route

# In-memory cache for elevation data (prevents API abuse)
# Key: hash of coordinates, Value: (elevation_data, timestamp)
_elevation_cache: Dict[str, tuple] = {}
_ELEVATION_CACHE_TTL = 3600 * 24  # 24 hours


def _get_coordinates_hash(coordinates: List[dict]) -> str:
    """Generate hash of coordinates for caching"""
    coords_str = json.dumps([[c['latitude'], c['longitude']] for c in coordinates], sort_keys=True)
    return hashlib.md5(coords_str.encode()).hexdigest()


async def call_mapbox_directions_api(request: HERERouteRequest, route_profile: str = "driving") -> dict:
    """
    Call Mapbox Directions API for routing with turn-by-turn navigation

    Args:
        request: Route request with origin/destination
        route_profile: 'driving', 'driving-traffic', or custom profile

    Returns:
        Mapbox directions response with routes, steps, and geometry

    Raises:
        HTTPException if API key is not configured or API call fails
    """
    from fastapi import HTTPException

    mapbox_api_key = os.environ.get('MAPBOX_API_KEY', '').strip()

    if not mapbox_api_key:
        logging.error("MAPBOX_API_KEY not configured")
        raise HTTPException(
            status_code=503,
            detail="Routing service unavailable. Mapbox API key not configured. Please contact administrator."
        )

    # Mapbox Directions API endpoint
    # Format: /directions/v5/{profile}/{coordinates}
    coordinates = f"{request.origin_lng},{request.origin_lat};{request.destination_lng},{request.destination_lat}"
    mapbox_url = f"https://api.mapbox.com/directions/v5/mapbox/{route_profile}/{coordinates}"

    # Mapbox API parameters for comprehensive routing
    params = {
        "access_token": mapbox_api_key,
        "alternatives": "true",  # Get up to 3 route alternatives
        "geometries": "polyline",  # Use Google polyline format (efficient)
        "steps": "true",  # Get turn-by-turn instructions
        "banner_instructions": "true",  # Visual guidance for turns
        "voice_instructions": "true",  # Voice guidance text
        "voice_units": "metric",  # Use metric units
        "overview": "full",  # Full route geometry
        "annotations": "distance,duration,speed,congestion",  # Detailed annotations
        "continue_straight": "false",  # Allow turns
        "waypoint_names": "Origin;Destination",
    }

    # Retry configuration with exponential backoff
    max_retries = settings.HTTP_CLIENT_MAX_RETRIES
    retry_delay = settings.HTTP_CLIENT_RETRY_DELAY

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=settings.HTTP_CLIENT_TIMEOUT) as client:
                response = await client.get(mapbox_url, params=params)

                # Handle different error cases
                if response.status_code == 401:
                    logging.error("Mapbox API authentication failed - invalid API key")
                    raise HTTPException(
                        status_code=503,
                        detail="Routing service authentication failed. Please contact administrator."
                    )
                elif response.status_code == 403:
                    logging.error("Mapbox API access forbidden - check API key permissions")
                    raise HTTPException(
                        status_code=503,
                        detail="Routing service access denied. Please contact administrator."
                    )
                elif response.status_code == 429:
                    logging.error("Mapbox API rate limit exceeded")
                    raise HTTPException(
                        status_code=503,
                        detail="Routing service temporarily unavailable due to high demand. Please try again later."
                    )

                response.raise_for_status()
                return response.json()

        except HTTPException:
            # Re-raise HTTPExceptions as-is (no retry for auth/permission errors)
            raise

        except httpx.TimeoutException:
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                logging.warning(f"Mapbox API timeout (attempt {attempt + 1}/{max_retries}), retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logging.error("Mapbox API request timeout after all retries")
                raise HTTPException(
                    status_code=504,
                    detail="Routing service timeout. Please try again."
                )

        except httpx.ConnectError as e:
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                logging.warning(f"Mapbox API connection error (attempt {attempt + 1}/{max_retries}), retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logging.error(f"Mapbox API connection error after all retries: {str(e)}")
                raise HTTPException(
                    status_code=503,
                    detail="Unable to connect to routing service. Please check your internet connection."
                )

        except Exception as e:
            logging.error(f"Mapbox API unexpected error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Routing service error: {str(e)}"
            )

    # This should never be reached, but add for safety
    raise HTTPException(
        status_code=500,
        detail="Routing service error: Maximum retries exceeded"
    )


async def fetch_elevation_data(coordinates: List[dict]) -> List[float]:
    """
    Fetch elevation data from Open-Topo-Data (FREE and production-ready)

    PERFORMANCE OPTIMIZATIONS:
    - 24-hour in-memory cache to reduce API calls
    - Batch processing (100 coords per request)
    - Graceful fallback on errors

    Args:
        coordinates: List of {latitude, longitude} dictionaries

    Returns:
        List of elevation values in meters

    Note: Open-Topo-Data is free, open-source, and can be self-hosted
          Default uses public instance: https://api.opentopodata.org
    """
    from fastapi import HTTPException

    if not coordinates:
        return []

    # Check cache first
    coords_hash = _get_coordinates_hash(coordinates)
    if coords_hash in _elevation_cache:
        cached_data, timestamp = _elevation_cache[coords_hash]
        # Check if cache is still valid (24 hours)
        if (datetime.now() - timestamp).total_seconds() < _ELEVATION_CACHE_TTL:
            logging.info(f"Using cached elevation data for {len(coordinates)} coordinates")
            return cached_data

    # Open-Topo-Data public API endpoint (FREE)
    # Using SRTM 30m dataset (global coverage, good accuracy)
    base_url = "https://api.opentopodata.org/v1/srtm30m"

    # API accepts max 100 locations per request, so batch if needed
    batch_size = 100
    all_elevations = []

    try:
        for i in range(0, len(coordinates), batch_size):
            batch = coordinates[i:i + batch_size]

            # Format: lat,lng|lat,lng|...
            locations = "|".join([f"{c['latitude']},{c['longitude']}" for c in batch])

            params = {"locations": locations}

            # Retry logic for elevation data (less critical than routing)
            max_retries = 2
            retry_delay = 1.0

            for attempt in range(max_retries):
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.get(base_url, params=params)

                        if response.status_code == 200:
                            data = response.json()
                            if data.get("status") == "OK" and "results" in data:
                                elevations = [r.get("elevation", 0) or 0 for r in data["results"]]
                                all_elevations.extend(elevations)
                                break
                        elif response.status_code == 429:
                            # Rate limited, wait and retry
                            if attempt < max_retries - 1:
                                await asyncio.sleep(retry_delay * (2 ** attempt))
                                continue

                        # If we got here, use fallback
                        logging.warning(f"Open-Topo-Data returned status {response.status_code}, using fallback elevation")
                        all_elevations.extend([0] * len(batch))
                        break

                except Exception as e:
                    if attempt < max_retries - 1:
                        await asyncio.sleep(retry_delay * (2 ** attempt))
                    else:
                        logging.warning(f"Elevation fetch failed: {str(e)}, using fallback")
                        all_elevations.extend([0] * len(batch))
                        break

        # Cache the result
        if all_elevations:
            _elevation_cache[coords_hash] = (all_elevations, datetime.now())
            logging.info(f"Cached elevation data for {len(coordinates)} coordinates")

        return all_elevations

    except Exception as e:
        logging.warning(f"Elevation data unavailable: {str(e)}, continuing without elevation")
        return [0] * len(coordinates)


def decode_polyline(polyline: str) -> List[dict]:
    """
    Decode Google Polyline Algorithm Format (used by Mapbox)

    This is the standard polyline encoding used by Google Maps and Mapbox.
    More efficient than JSON for route geometry.

    Reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
    """
    coordinates = []
    index = 0
    lat = 0
    lng = 0

    while index < len(polyline):
        # Decode latitude
        result = 0
        shift = 0
        while True:
            b = ord(polyline[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat

        # Decode longitude
        result = 0
        shift = 0
        while True:
            b = ord(polyline[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += dlng

        coordinates.append({
            "latitude": lat / 1e5,
            "longitude": lng / 1e5
        })

    return coordinates


def calculate_elevation_metrics(elevations: List[float]) -> tuple:
    """
    Calculate elevation gain and loss from elevation profile

    Args:
        elevations: List of elevation values in meters

    Returns:
        Tuple of (total_gain_m, total_loss_m)
    """
    if not elevations or len(elevations) < 2:
        return (0.0, 0.0)

    total_gain = 0.0
    total_loss = 0.0

    for i in range(1, len(elevations)):
        diff = elevations[i] - elevations[i - 1]
        if diff > 0:
            total_gain += diff
        else:
            total_loss += abs(diff)

    return (round(total_gain, 1), round(total_loss, 1))


def calculate_ev_energy_consumption(distance_m: float, duration_s: float,
                                    elevation_gain_m: float, elevation_loss_m: float,
                                    speed_annotations: Optional[List[float]] = None) -> float:
    """
    Calculate estimated EV energy consumption in kWh

    Uses physics-based model accounting for:
    - Rolling resistance
    - Air resistance (speed-dependent)
    - Elevation changes (potential energy)
    - Regenerative braking (energy recovery on descent)

    Args:
        distance_m: Route distance in meters
        duration_s: Route duration in seconds
        elevation_gain_m: Total elevation gain in meters
        elevation_loss_m: Total elevation loss in meters
        speed_annotations: Optional list of speeds (m/s) along route

    Returns:
        Energy consumption in kWh
    """
    if distance_m == 0:
        return 0.0

    distance_km = distance_m / 1000
    avg_speed_kmh = (distance_m / duration_s) * 3.6 if duration_s > 0 else 50

    # EV physics constants
    vehicle_mass_kg = 1800  # Average EV mass
    rolling_coef = 0.01  # Rolling resistance coefficient
    drag_coef = 0.28  # Aerodynamic drag coefficient
    frontal_area_m2 = 2.3  # Frontal area
    air_density = 1.225  # kg/m³
    regen_efficiency = 0.70  # 70% energy recovery on braking
    drivetrain_efficiency = 0.90  # 90% motor efficiency
    gravity = 9.81  # m/s²

    # 1. Rolling resistance energy (constant with speed)
    rolling_resistance_wh = (vehicle_mass_kg * gravity * rolling_coef * distance_m) / (3600 * drivetrain_efficiency)

    # 2. Air resistance energy (quadratic with speed)
    avg_speed_ms = avg_speed_kmh / 3.6
    air_resistance_wh = (0.5 * air_density * drag_coef * frontal_area_m2 * (avg_speed_ms ** 3) * duration_s) / (3600 * drivetrain_efficiency)

    # 3. Elevation energy (potential energy changes)
    elevation_gain_wh = (vehicle_mass_kg * gravity * elevation_gain_m) / (3600 * drivetrain_efficiency)
    elevation_recovery_wh = (vehicle_mass_kg * gravity * elevation_loss_m * regen_efficiency) / 3600

    # Total energy consumption
    total_wh = rolling_resistance_wh + air_resistance_wh + elevation_gain_wh - elevation_recovery_wh

    # Add 15% overhead for HVAC, electronics, etc.
    total_wh *= 1.15

    # Ensure minimum reasonable consumption (100 Wh/km baseline)
    min_consumption_wh = distance_km * 100
    total_wh = max(total_wh, min_consumption_wh)

    return round(total_wh / 1000, 2)  # Convert to kWh


def calculate_route_scores(distance_m: float, duration_s: float,
                          energy_kwh: float, elevation_gain_m: float,
                          chargers_count: int, avg_charger_reliability: float) -> tuple:
    """
    Calculate eco score and reliability score for a route

    Args:
        distance_m: Route distance in meters
        duration_s: Route duration in seconds
        energy_kwh: Estimated energy consumption in kWh
        elevation_gain_m: Total elevation gain
        chargers_count: Number of chargers along route
        avg_charger_reliability: Average reliability of chargers (0-1)

    Returns:
        Tuple of (eco_score, reliability_score) both 0-100
    """
    distance_km = distance_m / 1000

    # Calculate Eco Score (0-100, higher is better)
    # Factors: energy efficiency (50%), distance efficiency (30%), elevation (20%)

    # Energy efficiency: Compare to baseline 140 Wh/km
    wh_per_km = (energy_kwh * 1000) / distance_km if distance_km > 0 else 140
    energy_efficiency = max(0, min(100, 100 - ((wh_per_km - 140) / 2)))

    # Distance efficiency: Shorter is better (penalty for very long routes)
    distance_efficiency = max(0, min(100, 100 - (distance_km / 10)))

    # Elevation penalty: More climbing = lower score
    elevation_penalty = max(0, min(100, 100 - (elevation_gain_m / 10)))

    eco_score = (
        energy_efficiency * 0.5 +
        distance_efficiency * 0.3 +
        elevation_penalty * 0.2
    )

    # Calculate Reliability Score based on chargers along route
    reliability_score = min(100, avg_charger_reliability * 100 + chargers_count * 2)

    return round(eco_score, 1), round(reliability_score, 1)


async def find_chargers_along_route(coordinates: List[dict], db: AsyncSession, max_detour_km: float = 5.0) -> List[dict]:
    """
    Find SharaSpot chargers along the route using optimized bounding box filtering

    Args:
        coordinates: List of route coordinates
        db: Database session
        max_detour_km: Maximum detour distance from route in km

    Returns:
        List of chargers near the route (max 10)
    """
    if not coordinates:
        return []

    # Calculate bounding box around route with padding for max_detour
    # Approximate: 1 degree latitude ≈ 111 km, 1 degree longitude ≈ 111 km * cos(lat)
    avg_lat = sum(c["latitude"] for c in coordinates) / len(coordinates)
    lat_padding = max_detour_km / 111.0
    lng_padding = max_detour_km / (111.0 * abs(max(0.01, abs(avg_lat) / 90.0)))  # Adjust for latitude

    min_lat = min(c["latitude"] for c in coordinates) - lat_padding
    max_lat = max(c["latitude"] for c in coordinates) + lat_padding
    min_lng = min(c["longitude"] for c in coordinates) - lng_padding
    max_lng = max(c["longitude"] for c in coordinates) + lng_padding

    # Query only chargers within bounding box (dramatically reduces rows scanned)
    query = select(Charger).where(
        Charger.latitude >= min_lat,
        Charger.latitude <= max_lat,
        Charger.longitude >= min_lng,
        Charger.longitude <= max_lng,
        Charger.verification_level >= 1  # Only verified chargers
    ).limit(500)  # Safety limit to prevent excessive processing

    result = await db.execute(query)
    candidate_chargers = result.scalars().all()

    # Calculate actual distance to route for each candidate
    route_chargers = []
    sampled_coords = coordinates[::max(1, len(coordinates) // 20)]  # Sample every ~5% of route

    for charger in candidate_chargers:
        # Calculate minimum distance from charger to any point on route
        min_distance = min(
            calculate_distance(
                charger.latitude, charger.longitude,
                coord["latitude"], coord["longitude"]
            )
            for coord in sampled_coords
        )

        # If charger is within max detour distance, include it
        if min_distance <= max_detour_km:
            route_chargers.append({
                "id": charger.id,
                "name": charger.name,
                "address": charger.address,
                "latitude": charger.latitude,
                "longitude": charger.longitude,
                "port_types": charger.port_types,
                "available_ports": charger.available_ports,
                "total_ports": charger.total_ports,
                "verification_level": charger.verification_level,
                "uptime_percentage": charger.uptime_percentage,
                "distance_from_route_km": round(min_distance, 2),
                "amenities": charger.amenities or []
            })

    # Sort by distance from route
    route_chargers.sort(key=lambda x: x["distance_from_route_km"])

    return route_chargers[:10]  # Return top 10 closest chargers


def process_turn_instructions(steps: List[dict]) -> List[dict]:
    """
    Process Mapbox step instructions into production-ready turn-by-turn guidance

    Args:
        steps: List of step dictionaries from Mapbox route leg

    Returns:
        List of turn instructions with voice, visual, and lane guidance
    """
    instructions = []

    for idx, step in enumerate(steps):
        # Extract voice instructions (Mapbox provides optimized text)
        voice_text = ""
        if "voiceInstructions" in step and step["voiceInstructions"]:
            # Use first voice instruction (most relevant)
            voice_text = step["voiceInstructions"][0].get("announcement", "")

        # Fallback to banner instruction if no voice
        if not voice_text and "bannerInstructions" in step and step["bannerInstructions"]:
            primary = step["bannerInstructions"][0].get("primary", {})
            voice_text = primary.get("text", "")

        # Fallback to step maneuver instruction
        if not voice_text:
            voice_text = step.get("maneuver", {}).get("instruction", "Continue")

        instruction = {
            "step_index": idx,
            "distance_m": step.get("distance", 0),
            "duration_s": step.get("duration", 0),
            "instruction": step.get("maneuver", {}).get("instruction", "Continue"),
            "voice_text": voice_text,
            "type": step.get("maneuver", {}).get("type", "turn"),
            "modifier": step.get("maneuver", {}).get("modifier", ""),  # left, right, straight, etc.
            "street_name": step.get("name", ""),
            "exit_number": step.get("maneuver", {}).get("exit", ""),
            "location": step.get("maneuver", {}).get("location", []),  # [lng, lat]
        }

        # Add lane guidance if available
        if "intersections" in step and step["intersections"]:
            intersection = step["intersections"][0]
            if "lanes" in intersection:
                instruction["lanes"] = intersection["lanes"]

        instructions.append(instruction)

    return instructions


async def calculate_mapbox_routes(request: HERERouteRequest, db: AsyncSession) -> HERERouteResponse:
    """
    Calculate EV routes using Mapbox Directions API with Open-Topo-Data elevation
    and SharaSpot charger integration

    Provides production-grade navigation with:
    - Turn-by-turn instructions
    - Voice guidance
    - Elevation data
    - Energy consumption estimates
    - Charger integration
    """
    from fastapi import HTTPException

    # Validate input parameters
    if not (-90 <= request.origin_lat <= 90) or not (-180 <= request.origin_lng <= 180):
        raise HTTPException(
            status_code=400,
            detail="Invalid origin coordinates"
        )

    if not (-90 <= request.destination_lat <= 90) or not (-180 <= request.destination_lng <= 180):
        raise HTTPException(
            status_code=400,
            detail="Invalid destination coordinates"
        )

    # Check if origin and destination are not too close (< 100m)
    distance_between = (
        ((request.destination_lat - request.origin_lat) ** 2 +
         (request.destination_lng - request.origin_lng) ** 2) ** 0.5
    ) * 111000  # Rough conversion to meters

    if distance_between < 100:
        raise HTTPException(
            status_code=400,
            detail="Origin and destination are too close. Minimum distance is 100 meters."
        )

    # Call Mapbox API for all route profiles in parallel
    route_profiles = ["driving", "driving-traffic", "driving"]  # eco, balanced, fastest
    route_types = ["eco", "balanced", "fastest"]

    # Fetch all routes concurrently for better performance
    mapbox_responses = await asyncio.gather(
        call_mapbox_directions_api(request, route_profiles[0]),
        call_mapbox_directions_api(request, route_profiles[1]),
        call_mapbox_directions_api(request, route_profiles[2]),
        return_exceptions=True
    )

    # Process routes
    processed_routes = []
    all_routes = []

    for idx, response in enumerate(mapbox_responses):
        if isinstance(response, Exception):
            logging.warning(f"Route {idx} failed: {str(response)}")
            continue

        if "routes" not in response or not response["routes"]:
            continue

        # Use first route from each profile (Mapbox ranks them)
        route_data = response["routes"][0]
        all_routes.append((route_data, route_types[idx]))

    # Fallback: if all profiles failed, try once more with basic driving
    if not all_routes:
        logging.warning("All route profiles failed, using fallback")
        fallback_response = await call_mapbox_directions_api(request, "driving")

        if "routes" in fallback_response and fallback_response["routes"]:
            # Use up to 3 alternatives from single call
            for idx, route_data in enumerate(fallback_response["routes"][:3]):
                all_routes.append((route_data, route_types[idx] if idx < len(route_types) else "alternative"))

    if not all_routes:
        raise HTTPException(
            status_code=500,
            detail="No routes found for the requested origin and destination"
        )

    # Process each route
    for route_idx, (route_data, route_type) in enumerate(all_routes):
        # Decode polyline to coordinates
        polyline = route_data.get("geometry", "")
        if not polyline:
            logging.warning(f"Route {route_type} missing polyline data")
            continue

        try:
            coordinates = decode_polyline(polyline)
        except Exception as e:
            logging.error(f"Failed to decode polyline for route {route_type}: {str(e)}")
            coordinates = [
                {"latitude": request.origin_lat, "longitude": request.origin_lng},
                {"latitude": request.destination_lat, "longitude": request.destination_lng}
            ]

        # Sample coordinates for elevation (every ~50m to balance accuracy vs API calls)
        # Mapbox routes can be very detailed, so we sample intelligently
        sample_interval = max(1, len(coordinates) // 100)  # Max 100 elevation points
        sampled_coords = coordinates[::sample_interval]

        # Fetch elevation data from Open-Topo-Data
        elevations = await fetch_elevation_data(sampled_coords)

        # Calculate elevation metrics
        elevation_gain, elevation_loss = calculate_elevation_metrics(elevations)

        # Extract route summary
        distance_m = route_data.get("distance", 0)
        duration_s = route_data.get("duration", 0)

        # Calculate energy consumption using physics-based model
        energy_kwh = calculate_ev_energy_consumption(
            distance_m, duration_s, elevation_gain, elevation_loss
        )

        # Find chargers along this route
        chargers = await find_chargers_along_route(coordinates, db, max_detour_km=5.0)

        # Calculate average charger reliability
        avg_reliability = sum(c["uptime_percentage"] for c in chargers) / len(chargers) if chargers else 0.75

        # Calculate scores
        eco_score, reliability_score = calculate_route_scores(
            distance_m, duration_s, energy_kwh, elevation_gain,
            len(chargers), avg_reliability / 100
        )

        # Process turn-by-turn instructions
        turn_instructions = []
        if "legs" in route_data and route_data["legs"]:
            for leg in route_data["legs"]:
                if "steps" in leg:
                    turn_instructions.extend(process_turn_instructions(leg["steps"]))

        # Build processed route with correct index
        processed_route = RouteAlternative(
            id=f"mapbox_{route_type}_{route_idx}",
            type=route_type,
            distance_m=distance_m,
            duration_s=duration_s,
            base_time_s=duration_s,  # Mapbox includes traffic in main duration
            polyline=polyline,
            coordinates=coordinates,
            energy_consumption_kwh=energy_kwh,
            elevation_gain_m=elevation_gain,
            elevation_loss_m=elevation_loss,
            eco_score=eco_score,
            reliability_score=reliability_score,
            summary={
                "distance_km": round(distance_m / 1000, 2),
                "duration_min": round(duration_s / 60, 1),
                "avg_speed_kmh": round((distance_m / 1000) / (duration_s / 3600), 1) if duration_s > 0 else 0,
                "chargers_available": len(chargers),
                "traffic_delay_min": 0,  # Mapbox includes traffic in duration
                "turn_instructions": turn_instructions  # Add turn-by-turn
            }
        )

        processed_routes.append({
            "route": processed_route,
            "chargers": chargers[:10]  # Top 10 chargers for route
        })

    if not processed_routes:
        raise HTTPException(
            status_code=500,
            detail="Failed to process routes from routing service"
        )

    # Sort routes: eco first, then balanced, then fastest
    route_order = {"eco": 0, "balanced": 1, "fastest": 2}
    processed_routes.sort(key=lambda x: route_order.get(x["route"].type, 999))

    # Get real-time weather data for the route
    weather_data = None
    if processed_routes and processed_routes[0]["route"].coordinates:
        weather_data = await get_weather_along_route(processed_routes[0]["route"].coordinates)

    return HERERouteResponse(
        routes=[item["route"] for item in processed_routes],
        chargers_along_route=processed_routes[0]["chargers"] if processed_routes else [],
        weather_data=weather_data,
        traffic_incidents=[]
    )


# Legacy function name for backward compatibility
async def calculate_here_routes(request: HERERouteRequest, db: AsyncSession) -> HERERouteResponse:
    """Legacy function - redirects to Mapbox implementation"""
    return await calculate_mapbox_routes(request, db)
