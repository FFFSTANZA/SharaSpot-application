"""
Open Charge Map API Scraper
https://openchargemap.org/site/develop/api

Free and open database of EV charging stations worldwide.
No API key required for basic usage (3000 requests/day).
"""

import requests
import json
import time
import logging
from typing import List, Dict, Optional
from datetime import datetime
import config

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(f"{config.LOG_DIR}/open_charge_map.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class OpenChargeMapScraper:
    """Scraper for Open Charge Map API"""

    BASE_URL = "https://api.openchargemap.io/v3/poi/"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.session = requests.Session()
        self.chargers_collected = []

    def scrape_by_bounding_box(self, min_lat: float, max_lat: float,
                                min_lon: float, max_lon: float,
                                max_results: int = 5000) -> List[Dict]:
        """Scrape chargers within a bounding box"""

        params = {
            "output": "json",
            "countrycode": "IN",  # India
            "latitude": (min_lat + max_lat) / 2,
            "longitude": (min_lon + max_lon) / 2,
            "distance": 200,  # km radius
            "maxresults": max_results,
            "compact": "false",
            "verbose": "true"
        }

        if self.api_key:
            headers = {"X-API-Key": self.api_key}
        else:
            headers = {}

        try:
            logger.info(f"Fetching chargers for bounds: ({min_lat},{min_lon}) to ({max_lat},{max_lon})")
            response = self.session.get(self.BASE_URL, params=params, headers=headers, timeout=30)
            response.raise_for_status()

            data = response.json()
            logger.info(f"Found {len(data)} chargers in this area")

            return self._transform_data(data)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data: {e}")
            return []

    def scrape_by_cities(self) -> List[Dict]:
        """Scrape chargers in major Indian cities"""
        all_chargers = []

        for city in config.INDIAN_CITIES:
            logger.info(f"Scraping {city['name']}...")

            params = {
                "output": "json",
                "countrycode": "IN",
                "latitude": city["lat"],
                "longitude": city["lon"],
                "distance": city["radius"],
                "maxresults": 500,
                "compact": "false",
                "verbose": "true"
            }

            if self.api_key:
                headers = {"X-API-Key": self.api_key}
            else:
                headers = {}

            try:
                response = self.session.get(self.BASE_URL, params=params, headers=headers, timeout=30)
                response.raise_for_status()

                data = response.json()
                chargers = self._transform_data(data)
                all_chargers.extend(chargers)

                logger.info(f"Found {len(chargers)} chargers in {city['name']}")

                # Rate limiting
                time.sleep(config.RATE_LIMIT_DELAY)

            except requests.exceptions.RequestException as e:
                logger.error(f"Error fetching data for {city['name']}: {e}")
                continue

        return all_chargers

    def scrape_grid(self) -> List[Dict]:
        """Scrape entire India using grid search"""
        all_chargers = []

        min_lat, max_lat = config.INDIA_BOUNDS["min_lat"], config.INDIA_BOUNDS["max_lat"]
        min_lon, max_lon = config.INDIA_BOUNDS["min_lon"], config.INDIA_BOUNDS["max_lon"]

        lat = min_lat
        while lat < max_lat:
            lon = min_lon
            while lon < max_lon:
                # Define grid cell
                cell_min_lat = lat
                cell_max_lat = min(lat + config.GRID_SIZE, max_lat)
                cell_min_lon = lon
                cell_max_lon = min(lon + config.GRID_SIZE, max_lon)

                # Scrape this cell
                chargers = self.scrape_by_bounding_box(
                    cell_min_lat, cell_max_lat,
                    cell_min_lon, cell_max_lon
                )
                all_chargers.extend(chargers)

                # Rate limiting
                time.sleep(config.RATE_LIMIT_DELAY)

                lon += config.GRID_SIZE
            lat += config.GRID_SIZE

        return all_chargers

    def _transform_data(self, raw_data: List[Dict]) -> List[Dict]:
        """Transform Open Charge Map data to our schema"""
        transformed = []

        for station in raw_data:
            try:
                # Extract address info
                address_info = station.get("AddressInfo", {})

                # Extract connection info (ports)
                connections = station.get("Connections", [])
                port_types = []
                total_ports = 0

                for conn in connections:
                    # Get port type
                    conn_type = conn.get("ConnectionType", {})
                    port_name = conn_type.get("Title", "Unknown")

                    # Map to our port types
                    mapped_port = self._map_port_type(port_name)
                    if mapped_port and mapped_port not in port_types:
                        port_types.append(mapped_port)

                    # Count ports
                    quantity = conn.get("Quantity", 1)
                    total_ports += quantity

                if not port_types:
                    port_types = ["Type 2"]  # Default

                if total_ports == 0:
                    total_ports = len(connections) or 1

                # Extract operator info
                operator_info = station.get("OperatorInfo", {})
                operator_name = operator_info.get("Title", "Unknown")

                # Status and availability
                status_type = station.get("StatusType", {})
                is_operational = status_type.get("IsOperational", True)

                # Extract amenities
                amenities = []
                if address_info.get("AccessComments"):
                    if "parking" in address_info.get("AccessComments", "").lower():
                        amenities.append("parking")
                    if "restaurant" in address_info.get("AccessComments", "").lower() or "food" in address_info.get("AccessComments", "").lower():
                        amenities.append("cafe")
                    if "restroom" in address_info.get("AccessComments", "").lower() or "toilet" in address_info.get("AccessComments", "").lower():
                        amenities.append("restroom")

                # Build our charger object
                charger = {
                    "external_id": f"ocm_{station.get('ID')}",
                    "name": address_info.get("Title") or f"{operator_name} Charging Station",
                    "address": self._build_address(address_info),
                    "latitude": address_info.get("Latitude"),
                    "longitude": address_info.get("Longitude"),
                    "port_types": port_types,
                    "total_ports": total_ports,
                    "available_ports": total_ports if is_operational else 0,
                    "source_type": "official",
                    "verification_level": 4 if is_operational else 2,
                    "amenities": amenities,
                    "nearby_amenities": [],
                    "photos": [],
                    "notes": self._build_notes(station, operator_name),
                    "uptime_percentage": 90.0 if is_operational else 50.0,
                    "data_source": "OpenChargeMap",
                    "raw_data": station  # Keep for reference
                }

                # Only include if we have valid coordinates
                if charger["latitude"] and charger["longitude"]:
                    # Verify it's in India
                    if (config.INDIA_BOUNDS["min_lat"] <= charger["latitude"] <= config.INDIA_BOUNDS["max_lat"] and
                        config.INDIA_BOUNDS["min_lon"] <= charger["longitude"] <= config.INDIA_BOUNDS["max_lon"]):
                        transformed.append(charger)

            except Exception as e:
                logger.error(f"Error transforming station {station.get('ID')}: {e}")
                continue

        return transformed

    def _map_port_type(self, port_name: str) -> Optional[str]:
        """Map Open Charge Map port type to our standard types"""
        port_name_lower = port_name.lower()

        for key, value in config.PORT_TYPE_MAPPING.items():
            if key.lower() in port_name_lower:
                return value

        # Try to infer from common patterns
        if "type 2" in port_name_lower or "type2" in port_name_lower:
            return "Type 2"
        elif "type 1" in port_name_lower or "type1" in port_name_lower:
            return "Type 1"
        elif "ccs" in port_name_lower or "combo" in port_name_lower:
            return "CCS"
        elif "chademo" in port_name_lower:
            return "CHAdeMO"
        elif "tesla" in port_name_lower:
            return "Tesla Supercharger"

        return None

    def _build_address(self, address_info: Dict) -> str:
        """Build formatted address from address info"""
        parts = []

        if address_info.get("AddressLine1"):
            parts.append(address_info["AddressLine1"])
        if address_info.get("AddressLine2"):
            parts.append(address_info["AddressLine2"])
        if address_info.get("Town"):
            parts.append(address_info["Town"])
        if address_info.get("StateOrProvince"):
            parts.append(address_info["StateOrProvince"])
        if address_info.get("Postcode"):
            parts.append(address_info["Postcode"])

        return ", ".join(parts) if parts else "Address not available"

    def _build_notes(self, station: Dict, operator_name: str) -> str:
        """Build notes from station info"""
        notes = []

        notes.append(f"Operator: {operator_name}")

        usage_type = station.get("UsageType", {})
        if usage_type.get("Title"):
            notes.append(f"Access: {usage_type['Title']}")

        address_info = station.get("AddressInfo", {})
        if address_info.get("AccessComments"):
            notes.append(f"Access Info: {address_info['AccessComments']}")

        return " | ".join(notes)

    def save_results(self, filename: str = "open_charge_map_raw.json"):
        """Save collected chargers to file"""
        filepath = f"{config.RAW_DATA_DIR}/{filename}"

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.chargers_collected, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Saved {len(self.chargers_collected)} chargers to {filepath}")
        return filepath


def main():
    """Main scraper function"""
    logger.info("Starting Open Charge Map scraper...")

    scraper = OpenChargeMapScraper(api_key=config.OPEN_CHARGE_MAP_API_KEY)

    # Scrape by cities (faster and more targeted)
    logger.info("Scraping major cities...")
    city_chargers = scraper.scrape_by_cities()
    logger.info(f"Collected {len(city_chargers)} chargers from cities")

    scraper.chargers_collected = city_chargers

    # Save results
    filepath = scraper.save_results()

    logger.info(f"Open Charge Map scraping complete. Total chargers: {len(scraper.chargers_collected)}")

    return filepath


if __name__ == "__main__":
    main()
