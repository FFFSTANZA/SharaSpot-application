"""Utility functions"""
from math import radians, sin, cos, sqrt, atan2


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two points in km using Haversine formula
    """
    R = 6371  # Earth radius in km

    lat1, lon1 = radians(lat1), radians(lng1)
    lat2, lon2 = radians(lat2), radians(lng2)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))

    return R * c
