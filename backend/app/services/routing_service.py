"""Routing service with HERE API integration"""
from typing import List, Optional
from math import radians, sin, cos, sqrt, atan2
import os
import requests
import logging
import random

from ..schemas.routing import HERERouteRequest, HERERouteResponse
from ..models.routing import RouteAlternative
from ..core import get_database, calculate_distance


async def call_here_routing_api(request: HERERouteRequest) -> dict:
    """
    Call HERE Routing API v8 for EV routing
    Returns mock data until API key is provided
    """
    here_api_key = os.environ.get('HERE_API_KEY', None)

    if not here_api_key:
        # Return mock HERE-style response
        return generate_mock_here_response(request)

    # Real HERE API call (when key is available)
    try:
        here_url = "https://router.hereapi.com/v8/routes"

        # HERE API parameters for EV routing
        params = {
            "apiKey": here_api_key,
            "transportMode": "car",
            "origin": f"{request.origin_lat},{request.origin_lng}",
            "destination": f"{request.destination_lat},{request.destination_lng}",
            "return": "polyline,summary,elevation,routeHandle,actions",
            "alternatives": "3",  # Get 3 route alternatives
            "ev[freeFlowSpeedTable]": "0,0.239,27,0.239,45,0.259,60,0.196,75,0.207,90,0.238,100,0.26,110,0.296,120,0.337,130,0.351",
            "ev[trafficSpeedTable]": "0,0.349,27,0.319,45,0.329,60,0.266,75,0.287,90,0.318,100,0.33,110,0.335,120,0.35,130,0.36",
            "ev[ascent]": "9",
            "ev[descent]": "4.3",
            "ev[makeReachable]": "true",
            "spans": "names,length,duration,baseDuration,elevation,consumption",
        }

        response = requests.get(here_url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()

    except Exception as e:
        logging.error(f"HERE API error: {str(e)}")
        # Fallback to mock data
        return generate_mock_here_response(request)


def generate_mock_here_response(request: HERERouteRequest) -> dict:
    """Generate mock HERE API response for testing"""
    # Calculate straight-line distance
    R = 6371000  # Earth radius in meters
    lat1, lon1 = radians(request.origin_lat), radians(request.origin_lng)
    lat2, lon2 = radians(request.destination_lat), radians(request.destination_lng)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance_m = int(R * c)

    # Generate 3 route alternatives with different characteristics
    routes = []

    # Route 1: Eco-Optimized (lowest energy)
    eco_distance = distance_m * 1.08  # Slightly longer for energy efficiency
    eco_duration = int(eco_distance / 13.9)  # ~50 km/h average
    eco_energy = (eco_distance / 1000) * 0.145  # 145 Wh/km (efficient)
    routes.append({
        "id": "route_eco",
        "sections": [{
            "type": "vehicle",
            "transport": {"mode": "car"},
            "summary": {
                "duration": eco_duration,
                "length": int(eco_distance),
                "baseDuration": int(eco_duration * 0.85),
                "consumption": int(eco_energy * 1000)  # Wh
            },
            "polyline": generate_mock_polyline(request.origin_lat, request.origin_lng,
                                               request.destination_lat, request.destination_lng, 8),
            "spans": [
                {
                    "offset": 0,
                    "elevation": {"rise": 85, "fall": 45},
                    "consumption": int(eco_energy * 1000)
                }
            ]
        }]
    })

    # Route 2: Balanced (good mix)
    balanced_distance = distance_m * 1.03
    balanced_duration = int(balanced_distance / 15.3)  # ~55 km/h average
    balanced_energy = (balanced_distance / 1000) * 0.165  # 165 Wh/km
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
            "polyline": generate_mock_polyline(request.origin_lat, request.origin_lng,
                                               request.destination_lat, request.destination_lng, 6),
            "spans": [
                {
                    "offset": 0,
                    "elevation": {"rise": 120, "fall": 65},
                    "consumption": int(balanced_energy * 1000)
                }
            ]
        }]
    })

    # Route 3: Fastest (shortest time)
    fastest_distance = distance_m * 0.98
    fastest_duration = int(fastest_distance / 18.1)  # ~65 km/h average
    fastest_energy = (fastest_distance / 1000) * 0.195  # 195 Wh/km (high speed)
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
            "polyline": generate_mock_polyline(request.origin_lat, request.origin_lng,
                                               request.destination_lat, request.destination_lng, 4),
            "spans": [
                {
                    "offset": 0,
                    "elevation": {"rise": 180, "fall": 95},
                    "consumption": int(fastest_energy * 1000)
                }
            ]
        }]
    })

    return {"routes": routes}


def generate_mock_polyline(start_lat: float, start_lng: float,
                           end_lat: float, end_lng: float, points: int = 5) -> str:
    """Generate a mock polyline between two points"""
    # Simple linear interpolation
    coords = []
    for i in range(points + 1):
        t = i / points
        lat = start_lat + (end_lat - start_lat) * t
        lng = start_lng + (end_lng - start_lng) * t
        coords.append({"lat": lat, "lng": lng})

    # Return as simplified encoded string (for mock)
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
    duration_min = summary["duration"] / 60
    energy_kwh = summary["consumption"] / 1000  # Convert Wh to kWh

    # Get elevation data
    elevation_rise = 0
    elevation_fall = 0
    if "spans" in section and len(section["spans"]) > 0:
        elev_data = section["spans"][0].get("elevation", {})
        elevation_rise = elev_data.get("rise", 0)
        elevation_fall = elev_data.get("fall", 0)

    # Calculate Eco Score (0-100, higher is better)
    # Factors: energy efficiency (50%), distance efficiency (30%), elevation (20%)
    energy_efficiency = max(0, 100 - (energy_kwh / distance_km - 0.14) * 500)  # Baseline 140 Wh/km
    distance_efficiency = max(0, 100 - distance_km)
    elevation_penalty = max(0, 100 - (elevation_rise / 10))

    eco_score = (
        energy_efficiency * 0.5 +
        distance_efficiency * 0.3 +
        elevation_penalty * 0.2
    )

    # Calculate Reliability Score based on chargers along route
    reliability_score = min(100, avg_charger_reliability * 100 + chargers_count * 2)

    return round(eco_score, 1), round(reliability_score, 1)


async def find_chargers_along_route(coordinates: List[dict], max_detour_km: float = 5.0) -> List[dict]:
    """Find SharaSpot chargers along the route"""
    db = get_database()
    all_chargers = await db.chargers.find().to_list(1000)

    route_chargers = []
    for charger in all_chargers:
        # Calculate minimum distance from charger to any point on route
        min_distance = float('inf')
        for coord in coordinates[::max(1, len(coordinates) // 20)]:  # Sample every ~5% of route
            distance = calculate_distance(
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

    return route_chargers[:10]  # Return top 10 closest chargers


async def calculate_here_routes(request: HERERouteRequest) -> HERERouteResponse:
    """Calculate EV routes using HERE API with SharaSpot charger integration"""
    # Call HERE API
    here_response = await call_here_routing_api(request)

    if "routes" not in here_response:
        raise Exception("Invalid response from routing service")

    # Process routes
    processed_routes = []
    route_types = ["eco", "balanced", "fastest"]

    for idx, route_data in enumerate(here_response["routes"][:3]):
        section = route_data["sections"][0]
        summary = section["summary"]

        # Decode polyline to coordinates
        coordinates = decode_polyline_coordinates(
            section.get("polyline", ""),
            request.origin_lat, request.origin_lng,
            request.destination_lat, request.destination_lng
        )

        # Find chargers along this route
        chargers = await find_chargers_along_route(coordinates, max_detour_km=5.0)

        # Calculate average charger reliability
        avg_reliability = sum(c["uptime_percentage"] for c in chargers) / len(chargers) if chargers else 0.75

        # Calculate scores
        eco_score, reliability_score = calculate_route_scores(
            route_data, len(chargers), avg_reliability / 100
        )

        # Get elevation data
        elevation_rise = 0
        elevation_fall = 0
        if "spans" in section and len(section["spans"]) > 0:
            elev_data = section["spans"][0].get("elevation", {})
            elevation_rise = elev_data.get("rise", 0)
            elevation_fall = elev_data.get("fall", 0)

        route_type = route_types[idx] if idx < len(route_types) else "alternative"

        processed_route = RouteAlternative(
            id=route_data.get("id", f"route_{idx}"),
            type=route_type,
            distance_m=summary["length"],
            duration_s=summary["duration"],
            base_time_s=summary.get("baseDuration", summary["duration"]),
            polyline=section.get("polyline", ""),
            coordinates=coordinates,
            energy_consumption_kwh=summary["consumption"] / 1000,  # Convert Wh to kWh
            elevation_gain_m=elevation_rise,
            elevation_loss_m=elevation_fall,
            eco_score=eco_score,
            reliability_score=reliability_score,
            summary={
                "distance_km": round(summary["length"] / 1000, 2),
                "duration_min": round(summary["duration"] / 60, 1),
                "avg_speed_kmh": round((summary["length"] / 1000) / (summary["duration"] / 3600), 1),
                "chargers_available": len(chargers),
                "traffic_delay_min": round((summary["duration"] - summary.get("baseDuration", summary["duration"])) / 60, 1)
            }
        )

        processed_routes.append({
            "route": processed_route,
            "chargers": chargers[:5]  # Top 5 chargers for each route
        })

    # Mock weather data (until HERE weather integration)
    weather_data = {
        "temperature_c": 22,
        "condition": "Clear",
        "wind_speed_kmh": 12,
        "humidity_percent": 65
    }

    return HERERouteResponse(
        routes=[item["route"] for item in processed_routes],
        chargers_along_route=processed_routes[0]["chargers"] if processed_routes else [],
        weather_data=weather_data,
        traffic_incidents=[]
    )
