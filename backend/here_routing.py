"""
HERE API Routing Integration
Addresses P1 issue #7: Synchronous HTTP calls replaced with async httpx
"""

import httpx
import logging
from typing import List, dict
from math import radians, sin, cos, sqrt, atan2

from config import (
    HERE_API_KEY, HERE_ROUTING_API_URL, HERE_API_TIMEOUT,
    HERE_MAX_ROUTE_ALTERNATIVES, HERE_MAX_DETOUR_KM
)

logger = logging.getLogger(__name__)


async def call_here_routing_api(request_data: dict) -> dict:
    """
    Call HERE Routing API v8 for EV routing using async HTTP client

    Args:
        request_data: Dictionary with origin, destination, battery params

    Returns:
        HERE API response or mock data
    """
    if not HERE_API_KEY:
        logger.info("HERE_API_KEY not set, returning mock data")
        return generate_mock_here_response(request_data)

    try:
        # Build HERE API parameters
        params = {
            "apiKey": HERE_API_KEY,
            "transportMode": "car",
            "origin": f"{request_data['origin_lat']},{request_data['origin_lng']}",
            "destination": f"{request_data['destination_lat']},{request_data['destination_lng']}",
            "return": "polyline,summary,elevation,routeHandle,actions",
            "alternatives": str(HERE_MAX_ROUTE_ALTERNATIVES),
            "ev[freeFlowSpeedTable]": "0,0.239,27,0.239,45,0.259,60,0.196,75,0.207,90,0.238,100,0.26,110,0.296,120,0.337,130,0.351",
            "ev[trafficSpeedTable]": "0,0.349,27,0.319,45,0.329,60,0.266,75,0.287,90,0.318,100,0.33,110,0.335,120,0.35,130,0.36",
            "ev[ascent]": "9",
            "ev[descent]": "4.3",
            "ev[makeReachable]": "true",
            "spans": "names,length,duration,baseDuration,elevation,consumption",
        }

        # Use async HTTP client
        async with httpx.AsyncClient(timeout=HERE_API_TIMEOUT) as client:
            response = await client.get(HERE_ROUTING_API_URL, params=params)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPError as e:
        logger.error(f"HERE API HTTP error: {type(e).__name__}: {str(e)}")
        return generate_mock_here_response(request_data)
    except Exception as e:
        logger.error(f"HERE API error: {type(e).__name__}: {str(e)}")
        return generate_mock_here_response(request_data)


def calculate_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in km using Haversine formula"""
    R = 6371  # Earth radius in km

    lat1, lon1 = radians(lat1), radians(lng1)
    lat2, lon2 = radians(lat2), radians(lng2)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))

    return R * c


def generate_mock_here_response(request_data: dict) -> dict:
    """Generate mock HERE API response for testing"""

    # Calculate straight-line distance
    R = 6371000  # Earth radius in meters
    lat1, lon1 = radians(request_data['origin_lat']), radians(request_data['origin_lng'])
    lat2, lon2 = radians(request_data['destination_lat']), radians(request_data['destination_lng'])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance_m = int(R * c)

    routes = []

    # Route 1: Eco-Optimized
    eco_distance = distance_m * 1.08
    eco_duration = int(eco_distance / 13.9)
    eco_energy = (eco_distance / 1000) * 0.145
    routes.append({
        "id": "route_eco",
        "sections": [{
            "type": "vehicle",
            "transport": {"mode": "car"},
            "summary": {
                "duration": eco_duration,
                "length": int(eco_distance),
                "baseDuration": int(eco_duration * 0.85),
                "consumption": int(eco_energy * 1000)
            },
            "polyline": generate_mock_polyline(
                request_data['origin_lat'], request_data['origin_lng'],
                request_data['destination_lat'], request_data['destination_lng'], 8
            ),
            "spans": [{
                "offset": 0,
                "elevation": {"rise": 85, "fall": 45},
                "consumption": int(eco_energy * 1000)
            }]
        }]
    })

    # Route 2: Balanced
    balanced_distance = distance_m * 1.03
    balanced_duration = int(balanced_distance / 15.3)
    balanced_energy = (balanced_distance / 1000) * 0.165
    routes.append({
        "id": "route_balanced",
        "sections": [{
            "type": "vehicle",
            "transport": {"mode": "car"},
            "summary": {
                "duration": balanced_duration,
                "length": int(balanced_distance),
                "baseDuration": int(balanced_duration * 0.88),
                "consumption": int(balanced_energy * 1000)
            },
            "polyline": generate_mock_polyline(
                request_data['origin_lat'], request_data['origin_lng'],
                request_data['destination_lat'], request_data['destination_lng'], 6
            ),
            "spans": [{
                "offset": 0,
                "elevation": {"rise": 120, "fall": 65},
                "consumption": int(balanced_energy * 1000)
            }]
        }]
    })

    # Route 3: Fastest
    fastest_distance = distance_m * 0.98
    fastest_duration = int(fastest_distance / 18.1)
    fastest_energy = (fastest_distance / 1000) * 0.195
    routes.append({
        "id": "route_fastest",
        "sections": [{
            "type": "vehicle",
            "transport": {"mode": "car"},
            "summary": {
                "duration": fastest_duration,
                "length": int(fastest_distance),
                "baseDuration": int(fastest_duration * 0.92),
                "consumption": int(fastest_energy * 1000)
            },
            "polyline": generate_mock_polyline(
                request_data['origin_lat'], request_data['origin_lng'],
                request_data['destination_lat'], request_data['destination_lng'], 4
            ),
            "spans": [{
                "offset": 0,
                "elevation": {"rise": 180, "fall": 95},
                "consumption": int(fastest_energy * 1000)
            }]
        }]
    })

    return {"routes": routes}


def generate_mock_polyline(start_lat: float, start_lng: float,
                           end_lat: float, end_lng: float, points: int = 5) -> str:
    """Generate a mock polyline between two points"""
    return f"mock_polyline_{points}_points"


def decode_polyline_coordinates(polyline: str, start_lat: float, start_lng: float,
                                end_lat: float, end_lng: float) -> List[dict]:
    """Decode polyline to coordinates (simplified for mock)"""
    if polyline.startswith("mock_polyline"):
        points = int(polyline.split("_")[2])
        coords = []
        for i in range(points + 1):
            t = i / points
            lat = start_lat + (end_lat - start_lat) * t
            lng = start_lng + (end_lng - start_lng) * t
            coords.append({"latitude": lat, "longitude": lng})
        return coords

    # Real HERE polyline decoding would go here
    return []


def calculate_route_scores(route_data: dict, chargers_count: int,
                          avg_charger_reliability: float) -> tuple:
    """Calculate eco score and reliability score for a route"""
    section = route_data["sections"][0]
    summary = section["summary"]

    distance_km = summary["length"] / 1000
    energy_kwh = summary["consumption"] / 1000

    # Get elevation data
    elevation_rise = 0
    if "spans" in section and len(section["spans"]) > 0:
        elev_data = section["spans"][0].get("elevation", {})
        elevation_rise = elev_data.get("rise", 0)

    # Calculate Eco Score (0-100, higher is better)
    energy_efficiency = max(0, 100 - (energy_kwh / distance_km - 0.14) * 500)
    distance_efficiency = max(0, 100 - distance_km)
    elevation_penalty = max(0, 100 - (elevation_rise / 10))

    eco_score = (
        energy_efficiency * 0.5 +
        distance_efficiency * 0.3 +
        elevation_penalty * 0.2
    )

    # Calculate Reliability Score
    reliability_score = min(100, avg_charger_reliability * 100 + chargers_count * 2)

    return round(eco_score, 1), round(reliability_score, 1)


async def find_chargers_along_route(db, coordinates: List[dict],
                                    max_detour_km: float = HERE_MAX_DETOUR_KM) -> List[dict]:
    """Find SharaSpot chargers along the route"""
    all_chargers = await db.chargers.find().to_list(1000)

    route_chargers = []
    for charger in all_chargers:
        # Calculate minimum distance from charger to any point on route
        min_distance = float('inf')
        for coord in coordinates[::max(1, len(coordinates) // 20)]:
            distance = calculate_distance_km(
                charger["latitude"], charger["longitude"],
                coord["latitude"], coord["longitude"]
            )
            min_distance = min(min_distance, distance)

        # If charger is within max detour distance, include it
        if min_distance <= max_detour_km:
            route_chargers.append({
                "id": charger["id"],
                "name": charger["name"],
                "address": charger["address"],
                "latitude": charger["latitude"],
                "longitude": charger["longitude"],
                "port_types": charger["port_types"],
                "available_ports": charger["available_ports"],
                "total_ports": charger["total_ports"],
                "verification_level": charger["verification_level"],
                "uptime_percentage": charger["uptime_percentage"],
                "distance_from_route_km": round(min_distance, 2),
                "amenities": charger.get("amenities", [])
            })

    # Sort by distance from route
    route_chargers.sort(key=lambda x: x["distance_from_route_km"])

    return route_chargers[:10]
