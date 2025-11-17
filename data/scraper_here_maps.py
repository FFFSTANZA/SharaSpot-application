"""
HERE Maps EV Charging Stations API
https://developer.here.com/documentation/charging-stations/

Requires HERE API key (free tier available: 250k requests/month)
"""

import requests
import json
import time
import logging
from typing import List, Dict, Optional
import config

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(f"{config.LOG_DIR}/here_maps.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class HEREMapsScraper:
    """Scraper for HERE Maps EV Charging Stations API"""

    BASE_URL = "https://ev-v2.cc.api.here.com/ev/stations.json"

    def __init__(self, api_key: str = None):
        self.api_key = api_key or config.HERE_MAPS_API_KEY
        if not self.api_key:
            logger.warning("HERE Maps API key not configured")
        self.session = requests.Session()
        self.chargers_collected = []

    def search_by_location(self, lat: float, lon: float, radius: int = 50000) -> List[Dict]:
        """Search charging stations by location"""

        if not self.api_key:
            return []

        params = {
            'prox': f"{lat},{lon},{radius}",
            'apiKey': self.api_key
        }

        try:
            logger.debug(f"Searching HERE Maps near ({lat}, {lon}) radius {radius}m")

            response = self.session.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            stations = data.get('evStations', [])

            logger.debug(f"Found {len(stations)} stations")

            return stations

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching from HERE Maps: {e}")
            return []

    def scrape_cities(self) -> List[Dict]:
        """Scrape major Indian cities"""

        all_stations = []

        for city in config.INDIAN_CITIES:
            logger.info(f"Scraping HERE Maps for {city['name']}...")

            stations = self.search_by_location(
                city['lat'],
                city['lon'],
                radius=city['radius'] * 1000
            )

            all_stations.extend(stations)
            logger.info(f"Found {len(stations)} stations in {city['name']}")

            # Rate limiting
            time.sleep(config.RATE_LIMIT_DELAY)

        return all_stations

    def transform_data(self, raw_stations: List[Dict]) -> List[Dict]:
        """Transform HERE Maps data to our schema"""

        transformed = []

        for station in raw_stations:
            try:
                # Get position
                position = station.get('position', {})
                lat = position.get('lat')
                lon = position.get('lng')

                if not lat or not lon:
                    continue

                # Verify in India
                if not (config.INDIA_BOUNDS["min_lat"] <= lat <= config.INDIA_BOUNDS["max_lat"] and
                        config.INDIA_BOUNDS["min_lon"] <= lon <= config.INDIA_BOUNDS["max_lon"]):
                    continue

                # Get address
                address_obj = station.get('address', {})
                address_parts = []
                if address_obj.get('street'):
                    address_parts.append(address_obj['street'])
                if address_obj.get('city'):
                    address_parts.append(address_obj['city'])
                if address_obj.get('state'):
                    address_parts.append(address_obj['state'])
                if address_obj.get('postalCode'):
                    address_parts.append(address_obj['postalCode'])

                address = ', '.join(address_parts) if address_parts else f"{lat}, {lon}"

                # Get connectors
                connectors = station.get('connectors', [])
                port_types = []
                total_ports = 0

                for connector in connectors:
                    conn_type = connector.get('connectorType', '')
                    total = connector.get('total', 1)

                    # Map connector types
                    mapped_type = self._map_connector_type(conn_type)
                    if mapped_type and mapped_type not in port_types:
                        port_types.append(mapped_type)

                    total_ports += total

                if not port_types:
                    port_types = ['Type 2']
                if total_ports == 0:
                    total_ports = 2

                # Get operator
                operator = station.get('operatorName', 'Unknown')

                # Build charger
                charger = {
                    "external_id": f"here_{station.get('id')}",
                    "name": station.get('name') or f"{operator} Charging Station",
                    "address": address,
                    "latitude": lat,
                    "longitude": lon,
                    "port_types": port_types,
                    "total_ports": total_ports,
                    "available_ports": total_ports,
                    "source_type": "official",
                    "verification_level": 4,
                    "amenities": self._extract_amenities(station),
                    "nearby_amenities": [],
                    "photos": [],
                    "notes": f"Operator: {operator} | Source: HERE Maps",
                    "uptime_percentage": 90.0,
                    "data_source": "HEREMaps",
                    "raw_data": station
                }

                transformed.append(charger)

            except Exception as e:
                logger.error(f"Error transforming HERE station: {e}")
                continue

        return transformed

    def _map_connector_type(self, connector_type: str) -> Optional[str]:
        """Map HERE connector types to our standard types"""

        connector_map = {
            'IEC62196Type2Outlet': 'Type 2',
            'IEC62196Type2CableAttached': 'Type 2',
            'IEC62196Type2Combo': 'CCS',
            'Chademo': 'CHAdeMO',
            'IEC62196Type1': 'Type 1',
            'Tesla': 'Tesla Supercharger'
        }

        return connector_map.get(connector_type)

    def _extract_amenities(self, station: Dict) -> List[str]:
        """Extract amenities from station data"""

        amenities = []

        if station.get('hasParking'):
            amenities.append('parking')

        # Check facilities
        facilities = station.get('facilities', [])
        if 'Restaurant' in facilities:
            amenities.append('cafe')
        if 'Restroom' in facilities:
            amenities.append('restroom')

        return amenities

    def save_results(self, filename: str = "here_maps_raw.json"):
        """Save collected chargers to file"""
        filepath = f"{config.RAW_DATA_DIR}/{filename}"

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.chargers_collected, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Saved {len(self.chargers_collected)} chargers to {filepath}")
        return filepath


def main():
    """Main scraper function"""
    logger.info("Starting HERE Maps scraper...")

    if not config.HERE_MAPS_API_KEY:
        logger.warning("HERE Maps API key not configured. Skipping...")
        return None

    scraper = HEREMapsScraper()

    # Scrape cities
    logger.info("Scraping cities from HERE Maps...")
    stations = scraper.scrape_cities()

    # Transform
    transformed = scraper.transform_data(stations)
    scraper.chargers_collected = transformed

    # Save
    filepath = scraper.save_results()

    logger.info(f"HERE Maps scraping complete. Total chargers: {len(scraper.chargers_collected)}")

    return filepath


if __name__ == "__main__":
    main()
