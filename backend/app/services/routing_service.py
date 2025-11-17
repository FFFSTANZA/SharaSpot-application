"""Routing service with HERE API integration"""
from typing import List
import os
import requests
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.routing import HERERouteRequest, HERERouteResponse
from ..models.routing import RouteAlternative
from ..core import calculate_distance
from ..core.db_models import Charger


async def call_here_routing_api(request: HERERouteRequest) -> dict:
    """
    Call HERE Routing API v8 for EV routing
    Raises HTTPException if API key is not configured or API call fails
    """
    from fastapi import HTTPException

    here_api_key = os.environ.get('HERE_API_KEY', '').strip()

    if not here_api_key:
        logging.error("HERE_API_KEY not configured")
        raise HTTPException(
            status_code=503,
            detail="Routing service unavailable. HERE API key not configured. Please contact administrator."
        )

    # Real HERE API call
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

        # Handle different error cases
        if response.status_code == 401:
            logging.error("HERE API authentication failed - invalid API key")
            raise HTTPException(
                status_code=503,
                detail="Routing service authentication failed. Please contact administrator."
            )
        elif response.status_code == 403:
            logging.error("HERE API access forbidden - check API key permissions")
            raise HTTPException(
                status_code=503,
                detail="Routing service access denied. Please contact administrator."
            )
        elif response.status_code == 429:
            logging.error("HERE API rate limit exceeded")
            raise HTTPException(
                status_code=503,
                detail="Routing service temporarily unavailable due to high demand. Please try again later."
            )

        response.raise_for_status()
        return response.json()

    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except requests.exceptions.Timeout:
        logging.error("HERE API request timeout")
        raise HTTPException(
            status_code=504,
            detail="Routing service timeout. Please try again."
        )
    except requests.exceptions.ConnectionError as e:
        logging.error(f"HERE API connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to routing service. Please check your internet connection."
        )
    except Exception as e:
        logging.error(f"HERE API unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Routing service error: {str(e)}"
        )


def decode_here_flexible_polyline(polyline: str) -> List[dict]:
    """
    Decode HERE Flexible Polyline Format
    Format: https://github.com/heremaps/flexible-polyline

    This is a simplified implementation. For production use, consider using
    the official flexpolyline library: pip install flexpolyline
    """
    try:
        # Try using flexpolyline library if available
        import flexpolyline
        decoded = flexpolyline.decode(polyline)
        return [{"latitude": lat, "longitude": lng} for lat, lng, *_ in decoded]
    except ImportError:
        logging.warning("flexpolyline library not installed. Using basic decoding.")
        # Fallback to basic polyline decoding
        # Note: This is a very basic implementation and may not work for all polylines
        # For production, install: pip install flexpolyline
        return decode_polyline_basic(polyline)


def decode_polyline_basic(polyline: str) -> List[dict]:
    """
    Basic polyline decoding (Google Polyline Algorithm Format)
    This is a fallback when flexpolyline is not available
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


async def find_chargers_along_route(coordinates: List[dict], db: AsyncSession, max_detour_km: float = 5.0) -> List[dict]:
    """Find SharaSpot chargers along the route"""
    result = await db.execute(select(Charger))
    all_chargers = result.scalars().all()

    route_chargers = []
    for charger in all_chargers:
        # Calculate minimum distance from charger to any point on route
        min_distance = float('inf')
        for coord in coordinates[::max(1, len(coordinates) // 20)]:  # Sample every ~5% of route
            distance = calculate_distance(
                charger.latitude, charger.longitude,
                coord["latitude"], coord["longitude"]
            )
            min_distance = min(min_distance, distance)

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


async def calculate_here_routes(request: HERERouteRequest, db: AsyncSession) -> HERERouteResponse:
    """Calculate EV routes using HERE API with SharaSpot charger integration"""
    from fastapi import HTTPException

    # Call HERE API
    here_response = await call_here_routing_api(request)

    if "routes" not in here_response or not here_response["routes"]:
        raise HTTPException(
            status_code=500,
            detail="No routes found for the requested origin and destination"
        )

    # Process routes
    processed_routes = []
    route_types = ["eco", "balanced", "fastest"]

    for idx, route_data in enumerate(here_response["routes"][:3]):
        section = route_data["sections"][0]
        summary = section["summary"]

        # Decode polyline to coordinates
        polyline = section.get("polyline", "")
        if not polyline:
            logging.warning(f"Route {idx} missing polyline data")
            continue

        try:
            coordinates = decode_here_flexible_polyline(polyline)
        except Exception as e:
            logging.error(f"Failed to decode polyline for route {idx}: {str(e)}")
            # Use start and end coordinates as fallback
            coordinates = [
                {"latitude": request.origin_lat, "longitude": request.origin_lng},
                {"latitude": request.destination_lat, "longitude": request.destination_lng}
            ]

        # Find chargers along this route
        chargers = await find_chargers_along_route(coordinates, db, max_detour_km=5.0)

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
            polyline=polyline,
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

    if not processed_routes:
        raise HTTPException(
            status_code=500,
            detail="Failed to process routes from routing service"
        )

    # Weather data is optional - can be added later via HERE Weather API or other service
    weather_data = None

    return HERERouteResponse(
        routes=[item["route"] for item in processed_routes],
        chargers_along_route=processed_routes[0]["chargers"] if processed_routes else [],
        weather_data=weather_data,
        traffic_incidents=[]
    )
