"""
TomTom EV Charging Stations API
https://developer.tomtom.com/search-api/documentation/search-service/electric-vehicle-charging-stations

Requires TomTom API key (free tier: 2,500 requests/day)
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
        logging.FileHandler(f"{config.LOG_DIR}/tomtom.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class TomTomScraper:
    """Scraper for TomTom EV Charging Stations API"""

    BASE_URL = "https://api.tomtom.com/search/2/categorySearch/electric%20vehicle%20charging%20station.json"

    def __init__(self, api_key: str = None):
        self.api_key = api_key or config.TOMTOM_API_KEY
        if not self.api_key:
            logger.warning("TomTom API key not configured")
        self.session = requests.Session()
        self.chargers_collected = []

    def search_by_location(self, lat: float, lon: float, radius: int = 50000) -> List[Dict]:
        """Search charging stations by location"""

        if not self.api_key:
            return []

        params = {
            'lat': lat,
            'lon': lon,
            'radius': radius,
            'limit': 100,
            'key': self.api_key
        }

        try:
            logger.debug(f"Searching TomTom near ({lat}, {lon}) radius {radius}m")

            response = self.session.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            results = data.get('results', [])

            logger.debug(f"Found {len(results)} results")

            return results

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching from TomTom: {e}")
            return []

    def scrape_cities(self) -> List[Dict]:
        """Scrape major Indian cities"""

        all_results = []

        for city in config.INDIAN_CITIES:
            logger.info(f"Scraping TomTom for {city['name']}...")

            results = self.search_by_location(
                city['lat'],
                city['lon'],
                radius=city['radius'] * 1000
            )

            all_results.extend(results)
            logger.info(f"Found {len(results)} results in {city['name']}")

            # Rate limiting
            time.sleep(config.RATE_LIMIT_DELAY)

        return all_results

    def transform_data(self, raw_results: List[Dict]) -> List[Dict]:
        """Transform TomTom data to our schema"""

        transformed = []

        for result in raw_results:
            try:
                # Get position
                position = result.get('position', {})
                lat = position.get('lat')
                lon = position.get('lon')

                if not lat or not lon:
                    continue

                # Verify in India
                if not (config.INDIA_BOUNDS["min_lat"] <= lat <= config.INDIA_BOUNDS["max_lat"] and
                        config.INDIA_BOUNDS["min_lon"] <= lon <= config.INDIA_BOUNDS["max_lon"]):
                    continue

                # Get address
                address_obj = result.get('address', {})
                address = address_obj.get('freeformAddress', f"{lat}, {lon}")

                # Get POI info
                poi = result.get('poi', {})
                name = poi.get('name', 'EV Charging Station')

                # Get charging info (if available in data sources)
                charging_park = result.get('chargingPark', {})
                connectors = charging_park.get('connectors', [])

                port_types = []
                total_ports = 0

                for connector in connectors:
                    conn_type = connector.get('connectorType', '')
                    total = connector.get('total', 1)

                    mapped_type = self._map_connector_type(conn_type)
                    if mapped_type and mapped_type not in port_types:
                        port_types.append(mapped_type)

                    total_ports += total

                if not port_types:
                    port_types = ['Type 2']
                if total_ports == 0:
                    total_ports = 2

                # Build charger
                charger = {
                    "external_id": f"tomtom_{result.get('id')}",
                    "name": name,
                    "address": address,
                    "latitude": lat,
                    "longitude": lon,
                    "port_types": port_types,
                    "total_ports": total_ports,
                    "available_ports": total_ports,
                    "source_type": "official",
                    "verification_level": 4,
                    "amenities": [],
                    "nearby_amenities": [],
                    "photos": [],
                    "notes": "Source: TomTom",
                    "uptime_percentage": 90.0,
                    "data_source": "TomTom",
                    "raw_data": result
                }

                transformed.append(charger)

            except Exception as e:
                logger.error(f"Error transforming TomTom result: {e}")
                continue

        return transformed

    def _map_connector_type(self, connector_type: str) -> Optional[str]:
        """Map TomTom connector types to our standard types"""

        connector_map = {
            'IEC62196Type2': 'Type 2',
            'IEC62196Type2CCS': 'CCS',
            'Chademo': 'CHAdeMO',
            'IEC62196Type1': 'Type 1',
            'Tesla': 'Tesla Supercharger'
        }

        return connector_map.get(connector_type)

    def save_results(self, filename: str = "tomtom_raw.json"):
        """Save collected chargers to file"""
        filepath = f"{config.RAW_DATA_DIR}/{filename}"

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.chargers_collected, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Saved {len(self.chargers_collected)} chargers to {filepath}")
        return filepath


def main():
    """Main scraper function"""
    logger.info("Starting TomTom scraper...")

    if not config.TOMTOM_API_KEY:
        logger.warning("TomTom API key not configured. Skipping...")
        return None

    scraper = TomTomScraper()

    # Scrape cities
    logger.info("Scraping cities from TomTom...")
    results = scraper.scrape_cities()

    # Transform
    transformed = scraper.transform_data(results)
    scraper.chargers_collected = transformed

    # Save
    filepath = scraper.save_results()

    logger.info(f"TomTom scraping complete. Total chargers: {len(scraper.chargers_collected)}")

    return filepath


if __name__ == "__main__":
    main()
