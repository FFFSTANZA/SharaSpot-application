"""Routing request/response schemas"""
from pydantic import BaseModel
from typing import List, Optional


class HERERouteRequest(BaseModel):
    """Schema for HERE API route calculation request"""
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    battery_capacity_kwh: float = 60.0
    current_battery_percent: float = 80.0
    vehicle_type: str = "sedan"
    port_type: str = "Type 2"


class HERERouteResponse(BaseModel):
    """Schema for HERE API route calculation response"""
    routes: List[dict]  # List of RouteAlternative models
    chargers_along_route: List[dict]
    weather_data: Optional[dict] = None
    traffic_incidents: List[dict] = []
