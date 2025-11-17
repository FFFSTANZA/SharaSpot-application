"""Routing-related database models"""
from pydantic import BaseModel
from typing import List, Optional


class RouteAlternative(BaseModel):
    """Route alternative model for EV routing"""
    id: str
    type: str  # "eco", "balanced", "fastest", "shortest"
    distance_m: int
    duration_s: int
    base_time_s: int  # Without traffic
    polyline: str  # Encoded polyline
    coordinates: List[dict]  # Decoded coordinates
    energy_consumption_kwh: float
    elevation_gain_m: int
    elevation_loss_m: int
    eco_score: float
    reliability_score: float
    summary: dict
