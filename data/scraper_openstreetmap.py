"""
OpenStreetMap Overpass API Scraper
https://wiki.openstreetmap.org/wiki/Overpass_API

Free and open geographic database. Excellent for charging stations.
No API key required. Rate limit: reasonable use.
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
        logging.FileHandler(f"{config.LOG_DIR}/openstreetmap.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class OpenStreetMapScraper:
    """Scraper for OpenStreetMap via Overpass API"""

    OVERPASS_URL = "https://overpass-api.de/api/interpreter"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'SharaSpot-DataCollector/1.0 (Educational Purpose)'
        })
        self.chargers_collected = []

    def build_overpass_query(self, bounds: Dict) -> str:
        """Build Overpass QL query for charging stations"""

        # Bounding box: south, west, north, east
        bbox = f"{bounds['min_lat']},{bounds['min_lon']},{bounds['max_lat']},{bounds['max_lon']}"

        query = f"""
        [out:json][timeout:60];
        (
          // Nodes tagged as charging stations
          node["amenity"="charging_station"]({bbox});
          // Ways (areas) tagged as charging stations
          way["amenity"="charging_station"]({bbox});
          // Relations
          relation["amenity"="charging_station"]({bbox});
        );
        out body center;
        >;
        out skel qt;
        """

        return query

    def scrape_region(self, bounds: Dict) -> List[Dict]:
        """Scrape a specific region"""

        query = self.build_overpass_query(bounds)

        try:
            logger.info(f"Querying OSM for bounds: ({bounds['min_lat']},{bounds['min_lon']}) to ({bounds['max_lat']},{bounds['max_lon']})")

            response = self.session.post(
                self.OVERPASS_URL,
                data={'data': query},
                timeout=120
            )
            response.raise_for_status()

            data = response.json()
            elements = data.get('elements', [])

            logger.info(f"Found {len(elements)} OSM elements")

            return self._transform_data(elements)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error querying Overpass API: {e}")
            return []

    def scrape_india(self) -> List[Dict]:
        """Scrape all of India in chunks to avoid timeout"""

        all_chargers = []

        # Divide India into regions to avoid overpass timeout
        # Using smaller grid for comprehensive coverage
        grid_size = 2.0  # degrees

        min_lat = config.INDIA_BOUNDS["min_lat"]
        max_lat = config.INDIA_BOUNDS["max_lat"]
        min_lon = config.INDIA_BOUNDS["min_lon"]
        max_lon = config.INDIA_BOUNDS["max_lon"]

        lat = min_lat
        chunk_count = 0

        while lat < max_lat:
            lon = min_lon
            while lon < max_lon:
                chunk_count += 1

                bounds = {
                    'min_lat': lat,
                    'max_lat': min(lat + grid_size, max_lat),
                    'min_lon': lon,
                    'max_lon': min(lon + grid_size, max_lon)
                }

                logger.info(f"Processing chunk {chunk_count}...")
                chargers = self.scrape_region(bounds)
                all_chargers.extend(chargers)

                # Respectful rate limiting (Overpass has usage policy)
                time.sleep(3)

                lon += grid_size
            lat += grid_size

        logger.info(f"Processed {chunk_count} chunks, found {len(all_chargers)} chargers")
        return all_chargers

    def scrape_cities(self) -> List[Dict]:
        """Scrape major cities with smaller bounds for faster results"""

        all_chargers = []

        for city in config.INDIAN_CITIES:
            logger.info(f"Scraping OSM data for {city['name']}...")

            # Create bounding box around city (radius in degrees, approx)
            radius_deg = city['radius'] / 111.0  # 1 degree ≈ 111 km

            bounds = {
                'min_lat': city['lat'] - radius_deg,
                'max_lat': city['lat'] + radius_deg,
                'min_lon': city['lon'] - radius_deg,
                'max_lon': city['lon'] + radius_deg
            }

            chargers = self.scrape_region(bounds)
            all_chargers.extend(chargers)

            logger.info(f"Found {len(chargers)} chargers in {city['name']}")

            # Rate limiting
            time.sleep(2)

        return all_chargers

    def _transform_data(self, elements: List[Dict]) -> List[Dict]:
        """Transform OSM data to our schema"""

        transformed = []

        for element in elements:
            try:
                # Get tags
                tags = element.get('tags', {})

                # Skip if not a charging station
                if tags.get('amenity') != 'charging_station':
                    continue

                # Get coordinates
                if element['type'] == 'node':
                    lat = element.get('lat')
                    lon = element.get('lon')
                elif element['type'] in ['way', 'relation']:
                    # Use center coordinates
                    center = element.get('center', {})
                    lat = center.get('lat')
                    lon = center.get('lon')
                else:
                    continue

                if not lat or not lon:
                    continue

                # Verify in India
                if not (config.INDIA_BOUNDS["min_lat"] <= lat <= config.INDIA_BOUNDS["max_lat"] and
                        config.INDIA_BOUNDS["min_lon"] <= lon <= config.INDIA_BOUNDS["max_lon"]):
                    continue

                # Extract name
                name = tags.get('name') or tags.get('operator') or "EV Charging Station"

                # Extract address
                address_parts = []
                if tags.get('addr:street'):
                    address_parts.append(tags['addr:street'])
                if tags.get('addr:city'):
                    address_parts.append(tags['addr:city'])
                if tags.get('addr:state'):
                    address_parts.append(tags['addr:state'])
                if tags.get('addr:postcode'):
                    address_parts.append(tags['addr:postcode'])

                address = ', '.join(address_parts) if address_parts else f"{lat}, {lon}"

                # Extract port information
                port_types = self._extract_port_types(tags)

                # Extract capacity (number of ports)
                capacity = self._extract_capacity(tags)

                # Extract operator
                operator = tags.get('operator', 'Unknown')

                # Extract amenities
                amenities = []
                if tags.get('parking') or tags.get('parking:fee'):
                    amenities.append('parking')
                if tags.get('covered') == 'yes':
                    amenities.append('covered')
                if tags.get('opening_hours'):
                    if tags['opening_hours'] == '24/7':
                        amenities.append('24/7')

                # Build notes
                notes = [f"Operator: {operator}"]

                if tags.get('access'):
                    notes.append(f"Access: {tags['access']}")
                if tags.get('fee'):
                    notes.append(f"Fee: {tags['fee']}")
                if tags.get('opening_hours'):
                    notes.append(f"Hours: {tags['opening_hours']}")
                if tags.get('payment:*'):
                    payment_methods = [k.replace('payment:', '') for k in tags.keys() if k.startswith('payment:') and tags[k] == 'yes']
                    if payment_methods:
                        notes.append(f"Payment: {', '.join(payment_methods)}")

                # Determine verification level based on data completeness
                verification_level = 3  # Default
                if tags.get('name') and tags.get('operator'):
                    verification_level = 4
                if tags.get('survey:date') or tags.get('check_date'):
                    verification_level = 5

                # Build charger object
                charger = {
                    "external_id": f"osm_{element['type']}_{element['id']}",
                    "name": name,
                    "address": address,
                    "latitude": lat,
                    "longitude": lon,
                    "port_types": port_types,
                    "total_ports": capacity,
                    "available_ports": capacity,
                    "source_type": "official",
                    "verification_level": verification_level,
                    "amenities": amenities,
                    "nearby_amenities": [],
                    "photos": [],
                    "notes": " | ".join(notes),
                    "uptime_percentage": 90.0,
                    "data_source": "OpenStreetMap",
                    "raw_data": {"type": element['type'], "id": element['id'], "tags": tags}
                }

                transformed.append(charger)

            except Exception as e:
                logger.error(f"Error transforming OSM element {element.get('id')}: {e}")
                continue

        return transformed

    def _extract_port_types(self, tags: Dict) -> List[str]:
        """Extract charging port types from OSM tags"""

        port_types = []

        # Check socket tags
        for key, value in tags.items():
            if key.startswith('socket:'):
                socket_type = key.replace('socket:', '').split(':')[0]

                # Map OSM socket types to our types
                if socket_type in ['type2', 'type_2']:
                    if 'Type 2' not in port_types:
                        port_types.append('Type 2')
                elif socket_type in ['type2_combo', 'ccs', 'type2_cable']:
                    if 'CCS' not in port_types:
                        port_types.append('CCS')
                elif socket_type in ['chademo']:
                    if 'CHAdeMO' not in port_types:
                        port_types.append('CHAdeMO')
                elif socket_type in ['type1', 'type_1']:
                    if 'Type 1' not in port_types:
                        port_types.append('Type 1')
                elif socket_type in ['tesla_supercharger', 'tesla']:
                    if 'Tesla Supercharger' not in port_types:
                        port_types.append('Tesla Supercharger')

        # Default if no socket info
        if not port_types:
            port_types = ['Type 2']

        return port_types

    def _extract_capacity(self, tags: Dict) -> int:
        """Extract charging capacity (number of ports)"""

        # Try capacity tag
        if tags.get('capacity'):
            try:
                return int(tags['capacity'])
            except ValueError:
                pass

        # Try counting sockets
        total_sockets = 0
        for key, value in tags.items():
            if key.startswith('socket:') and key.endswith(':output'):
                try:
                    count = int(value)
                    total_sockets += count
                except ValueError:
                    pass

        if total_sockets > 0:
            return total_sockets

        # Default
        return 2

    def save_results(self, filename: str = "openstreetmap_raw.json"):
        """Save collected chargers to file"""
        filepath = f"{config.RAW_DATA_DIR}/{filename}"

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.chargers_collected, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Saved {len(self.chargers_collected)} chargers to {filepath}")
        return filepath


def main():
    """Main scraper function"""
    logger.info("Starting OpenStreetMap scraper...")

    scraper = OpenStreetMapScraper()

    # Scrape by cities (faster)
    logger.info("Scraping major cities from OSM...")
    chargers = scraper.scrape_cities()

    scraper.chargers_collected = chargers

    # Save results
    filepath = scraper.save_results()

    logger.info(f"OpenStreetMap scraping complete. Total chargers: {len(scraper.chargers_collected)}")

    return filepath


if __name__ == "__main__":
    main()
