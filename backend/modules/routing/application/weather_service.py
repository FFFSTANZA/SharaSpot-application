"""Weather service for real-time weather data"""
import os
import httpx
import logging
import asyncio
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


async def get_weather_data(latitude: float, longitude: float) -> Optional[dict]:
    """
    Get real-time weather data from OpenWeatherMap API using async HTTP client

    Args:
        latitude: Location latitude
        longitude: Location longitude

    Returns:
        Weather data dict with temperature, condition, wind, humidity
        Returns None if API key not configured or request fails
    """
    api_key = os.environ.get('OPENWEATHER_API_KEY', '').strip()

    if not api_key:
        logger.warning("OPENWEATHER_API_KEY not configured - weather data unavailable")
        return None

    # OpenWeatherMap API endpoint
    url = "https://api.openweathermap.org/data/2.5/weather"

    params = {
        "lat": latitude,
        "lon": longitude,
        "appid": api_key,
        "units": "metric"  # Celsius
    }

    # Retry configuration
    max_retries = settings.HTTP_CLIENT_MAX_RETRIES
    retry_delay = settings.HTTP_CLIENT_RETRY_DELAY

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=settings.WEATHER_API_TIMEOUT) as client:
                response = await client.get(url, params=params)

                # Handle API errors gracefully
                if response.status_code == 401:
                    logger.error("OpenWeatherMap API authentication failed - invalid API key")
                    return None
                elif response.status_code == 429:
                    logger.warning("OpenWeatherMap API rate limit exceeded")
                    return None

                response.raise_for_status()
                data = response.json()

                # Extract relevant weather data
                weather_data = {
                    "temperature_c": round(data["main"]["temp"], 1),
                    "condition": data["weather"][0]["main"],
                    "description": data["weather"][0]["description"],
                    "wind_speed_kmh": round(data["wind"]["speed"] * 3.6, 1),  # Convert m/s to km/h
                    "humidity_percent": data["main"]["humidity"],
                    "pressure_hpa": data["main"]["pressure"],
                    "visibility_km": round(data.get("visibility", 10000) / 1000, 1) if "visibility" in data else None,
                    "clouds_percent": data["clouds"]["all"],
                    "feels_like_c": round(data["main"]["feels_like"], 1)
                }

                logger.info(f"Weather data retrieved for ({latitude}, {longitude}): {weather_data['temperature_c']}°C, {weather_data['condition']}")
                return weather_data

        except httpx.TimeoutException:
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                logger.warning(f"Weather API timeout (attempt {attempt + 1}/{max_retries}), retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logger.warning("Weather API request timeout after all retries")
                return None

        except httpx.ConnectError:
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                logger.warning(f"Weather API connection error (attempt {attempt + 1}/{max_retries}), retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logger.warning("Weather API connection error after all retries")
                return None

        except Exception as e:
            logger.error(f"Weather API error: {str(e)}")
            return None

    return None


async def get_weather_along_route(coordinates: list[dict]) -> Optional[dict]:
    """
    Get weather data for the middle point of a route

    Args:
        coordinates: List of {latitude, longitude} dicts representing the route

    Returns:
        Weather data for the route's midpoint, or None if unavailable
    """
    if not coordinates or len(coordinates) == 0:
        return None

    # Get weather for the middle of the route
    mid_index = len(coordinates) // 2
    mid_point = coordinates[mid_index]

    return await get_weather_data(mid_point["latitude"], mid_point["longitude"])
