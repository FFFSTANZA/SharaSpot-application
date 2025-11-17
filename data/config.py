"""Configuration for data scrapers"""
import os
from typing import List

# API Keys (Set these in environment variables or .env file)
OPEN_CHARGE_MAP_API_KEY = os.getenv("OPEN_CHARGE_MAP_API_KEY", "")
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")

# Database connection (from backend config)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/sharaspot")

# Scraping configuration
INDIA_BOUNDS = {
    "min_lat": 8.0,
    "max_lat": 37.0,
    "min_lon": 68.0,
    "max_lon": 97.5
}

# Grid search configuration (for comprehensive coverage)
GRID_SIZE = 0.5  # degrees (~55km at equator)

# Major Indian cities for focused scraping
INDIAN_CITIES: List[dict] = [
    {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777, "radius": 50},
    {"name": "Delhi", "lat": 28.7041, "lon": 77.1025, "radius": 50},
    {"name": "Bangalore", "lat": 12.9716, "lon": 77.5946, "radius": 50},
    {"name": "Hyderabad", "lat": 17.3850, "lon": 78.4867, "radius": 50},
    {"name": "Ahmedabad", "lat": 23.0225, "lon": 72.5714, "radius": 40},
    {"name": "Chennai", "lat": 13.0827, "lon": 80.2707, "radius": 50},
    {"name": "Kolkata", "lat": 22.5726, "lon": 88.3639, "radius": 40},
    {"name": "Pune", "lat": 18.5204, "lon": 73.8567, "radius": 40},
    {"name": "Surat", "lat": 21.1702, "lon": 72.8311, "radius": 30},
    {"name": "Jaipur", "lat": 26.9124, "lon": 75.7873, "radius": 30},
    {"name": "Lucknow", "lat": 26.8467, "lon": 80.9462, "radius": 30},
    {"name": "Kanpur", "lat": 26.4499, "lon": 80.3319, "radius": 30},
    {"name": "Nagpur", "lat": 21.1458, "lon": 79.0882, "radius": 30},
    {"name": "Indore", "lat": 22.7196, "lon": 75.8577, "radius": 30},
    {"name": "Thane", "lat": 19.2183, "lon": 72.9781, "radius": 25},
    {"name": "Bhopal", "lat": 23.2599, "lon": 77.4126, "radius": 25},
    {"name": "Visakhapatnam", "lat": 17.6868, "lon": 83.2185, "radius": 25},
    {"name": "Pimpri-Chinchwad", "lat": 18.6298, "lon": 73.7997, "radius": 20},
    {"name": "Patna", "lat": 25.5941, "lon": 85.1376, "radius": 25},
    {"name": "Vadodara", "lat": 22.3072, "lon": 73.1812, "radius": 25},
    {"name": "Ghaziabad", "lat": 28.6692, "lon": 77.4538, "radius": 20},
    {"name": "Ludhiana", "lat": 30.9010, "lon": 75.8573, "radius": 20},
    {"name": "Agra", "lat": 27.1767, "lon": 78.0081, "radius": 20},
    {"name": "Nashik", "lat": 19.9975, "lon": 73.7898, "radius": 20},
    {"name": "Faridabad", "lat": 28.4089, "lon": 77.3178, "radius": 20},
    {"name": "Meerut", "lat": 28.9845, "lon": 77.7064, "radius": 20},
    {"name": "Rajkot", "lat": 22.3039, "lon": 70.8022, "radius": 20},
    {"name": "Kalyan-Dombivli", "lat": 19.2403, "lon": 73.1305, "radius": 15},
    {"name": "Vasai-Virar", "lat": 19.4612, "lon": 72.7985, "radius": 15},
    {"name": "Varanasi", "lat": 25.3176, "lon": 82.9739, "radius": 20},
    {"name": "Srinagar", "lat": 34.0837, "lon": 74.7973, "radius": 15},
    {"name": "Aurangabad", "lat": 19.8762, "lon": 75.3433, "radius": 15},
    {"name": "Dhanbad", "lat": 23.7957, "lon": 86.4304, "radius": 15},
    {"name": "Amritsar", "lat": 31.6340, "lon": 74.8723, "radius": 15},
    {"name": "Navi Mumbai", "lat": 19.0330, "lon": 73.0297, "radius": 20},
    {"name": "Allahabad", "lat": 25.4358, "lon": 81.8463, "radius": 20},
    {"name": "Howrah", "lat": 22.5958, "lon": 88.2636, "radius": 15},
    {"name": "Ranchi", "lat": 23.3441, "lon": 85.3096, "radius": 20},
    {"name": "Gwalior", "lat": 26.2183, "lon": 78.1828, "radius": 15},
    {"name": "Jabalpur", "lat": 23.1815, "lon": 79.9864, "radius": 15},
    {"name": "Coimbatore", "lat": 11.0168, "lon": 76.9558, "radius": 20},
    {"name": "Vijayawada", "lat": 16.5062, "lon": 80.6480, "radius": 15},
    {"name": "Jodhpur", "lat": 26.2389, "lon": 73.0243, "radius": 15},
    {"name": "Madurai", "lat": 9.9252, "lon": 78.1198, "radius": 15},
    {"name": "Raipur", "lat": 21.2514, "lon": 81.6296, "radius": 15},
    {"name": "Kota", "lat": 25.2138, "lon": 75.8648, "radius": 15},
    {"name": "Chandigarh", "lat": 30.7333, "lon": 76.7794, "radius": 15},
    {"name": "Guwahati", "lat": 26.1445, "lon": 91.7362, "radius": 15},
    {"name": "Mysore", "lat": 12.2958, "lon": 76.6394, "radius": 15},
    {"name": "Bareilly", "lat": 28.3670, "lon": 79.4304, "radius": 15},
]

# Major highways for route-based scraping
MAJOR_HIGHWAYS = [
    {"name": "NH 1 (GT Road)", "waypoints": [(28.7041, 77.1025), (30.7333, 76.7794), (31.6340, 74.8723)]},
    {"name": "NH 2 (Delhi-Kolkata)", "waypoints": [(28.7041, 77.1025), (27.1767, 78.0081), (25.4358, 81.8463), (22.5726, 88.3639)]},
    {"name": "NH 3 (Agra-Mumbai)", "waypoints": [(27.1767, 78.0081), (22.7196, 75.8577), (23.0225, 72.5714), (19.0760, 72.8777)]},
    {"name": "NH 4 (Mumbai-Chennai)", "waypoints": [(19.0760, 72.8777), (18.5204, 73.8567), (12.9716, 77.5946), (13.0827, 80.2707)]},
    {"name": "NH 5 (Kolkata-Chennai)", "waypoints": [(22.5726, 88.3639), (20.9517, 85.0985), (17.6868, 83.2185), (13.0827, 80.2707)]},
    {"name": "NH 6 (Kolkata-Mumbai)", "waypoints": [(22.5726, 88.3639), (21.1458, 79.0882), (21.1702, 72.8311), (19.0760, 72.8777)]},
    {"name": "NH 7 (Varanasi-Kanyakumari)", "waypoints": [(25.3176, 82.9739), (21.2514, 81.6296), (17.3850, 78.4867), (13.0827, 80.2707)]},
    {"name": "NH 8 (Delhi-Mumbai)", "waypoints": [(28.7041, 77.1025), (26.9124, 75.7873), (23.0225, 72.5714), (19.0760, 72.8777)]},
]

# Charging network operators in India
CHARGING_OPERATORS = [
    "Tata Power",
    "Ather Grid",
    "BPCL",
    "IOCL",
    "Reliance BP",
    "Fortum",
    "Magenta Power",
    "Kazam EV",
    "Charge Zone",
    "ChargePoint",
    "PlugShare",
    "Statiq",
    "Exicom",
    "Delta Electronics",
]

# Port types mapping
PORT_TYPE_MAPPING = {
    "Type 2": "Type 2",
    "Type2": "Type 2",
    "IEC 62196 Type 2": "Type 2",
    "CCS": "CCS",
    "CCS2": "CCS",
    "Combined Charging System": "CCS",
    "CHAdeMO": "CHAdeMO",
    "Type 1": "Type 1",
    "J1772": "Type 1",
    "Tesla": "Tesla Supercharger",
    "AC": "Type 2",
    "DC": "CCS",
}

# Rate limiting
RATE_LIMIT_DELAY = 1.0  # seconds between API calls
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

# Output settings
RAW_DATA_DIR = "data/raw"
PROCESSED_DATA_DIR = "data/processed"
LOG_DIR = "data/logs"

# Logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
