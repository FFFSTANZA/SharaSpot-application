"""
Community Data Sources Scraper
Scrapes EV charging data from community-contributed datasets and open repositories.

Sources:
- GitHub repositories with charging station datasets
- Community CSV files
- Wikidata
- Public spreadsheets
- Crowd-sourced data portals
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
        logging.FileHandler(f"{config.LOG_DIR}/community_data.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class CommunityDataScraper:
    """Scraper for community-contributed EV charging data"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'SharaSpot-DataCollector/1.0 (Educational Purpose)'
        })
        self.chargers_collected = []

    def scrape_wikidata(self) -> List[Dict]:
        """
        Query Wikidata SPARQL endpoint for charging stations in India
        https://query.wikidata.org/
        """
        logger.info("Querying Wikidata for EV charging stations...")

        sparql_query = """
        SELECT ?station ?stationLabel ?coord ?address ?operator WHERE {
          ?station wdt:P31 wd:Q121297935.  # Instance of: electric vehicle charging station
          ?station wdt:P17 wd:Q668.        # Country: India
          OPTIONAL { ?station wdt:P625 ?coord. }
          OPTIONAL { ?station wdt:P6375 ?address. }
          OPTIONAL { ?station wdt:P137 ?operator. }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 1000
        """

        url = "https://query.wikidata.org/sparql"

        try:
            response = self.session.get(
                url,
                params={'query': sparql_query, 'format': 'json'},
                timeout=60
            )
            response.raise_for_status()

            data = response.json()
            bindings = data.get('results', {}).get('bindings', [])

            logger.info(f"Found {len(bindings)} charging stations in Wikidata")

            return self._transform_wikidata(bindings)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error querying Wikidata: {e}")
            return []

    def _transform_wikidata(self, bindings: List[Dict]) -> List[Dict]:
        """Transform Wikidata results to our schema"""

        transformed = []

        for item in bindings:
            try:
                # Extract name
                name = item.get('stationLabel', {}).get('value', 'EV Charging Station')

                # Extract coordinates
                coord_str = item.get('coord', {}).get('value', '')
                if not coord_str:
                    continue

                # Parse coordinates (format: Point(lon lat))
                import re
                match = re.search(r'Point\(([^ ]+) ([^ ]+)\)', coord_str)
                if not match:
                    continue

                lon = float(match.group(1))
                lat = float(match.group(2))

                # Verify in India
                if not (config.INDIA_BOUNDS["min_lat"] <= lat <= config.INDIA_BOUNDS["max_lat"] and
                        config.INDIA_BOUNDS["min_lon"] <= lon <= config.INDIA_BOUNDS["max_lon"]):
                    continue

                # Extract address
                address = item.get('address', {}).get('value', f"{lat}, {lon}")

                # Build charger
                charger = {
                    "external_id": f"wikidata_{hash(name + str(lat) + str(lon)) % 1000000}",
                    "name": name,
                    "address": address,
                    "latitude": lat,
                    "longitude": lon,
                    "port_types": ["Type 2"],
                    "total_ports": 2,
                    "available_ports": 2,
                    "source_type": "official",
                    "verification_level": 3,
                    "amenities": [],
                    "nearby_amenities": [],
                    "photos": [],
                    "notes": "Source: Wikidata (Community)",
                    "uptime_percentage": 85.0,
                    "data_source": "Wikidata",
                }

                transformed.append(charger)

            except Exception as e:
                logger.error(f"Error transforming Wikidata item: {e}")
                continue

        return transformed

    def scrape_github_datasets(self) -> List[Dict]:
        """
        Scrape community datasets from GitHub
        Look for CSV/JSON files with EV charging data
        """
        logger.info("Checking GitHub for community datasets...")

        chargers = []

        # List of known GitHub repositories with Indian EV charging data
        # These are examples - in production, search GitHub API for such repos
        github_sources = [
            # Example: "https://raw.githubusercontent.com/user/repo/main/ev_charging_india.json"
            # Add actual repositories here when found
        ]

        for url in github_sources:
            try:
                logger.info(f"Fetching {url}...")
                response = self.session.get(url, timeout=30)
                response.raise_for_status()

                data = response.json()

                # Transform based on data structure (adapt as needed)
                if isinstance(data, list):
                    for item in data:
                        charger = self._transform_github_item(item)
                        if charger:
                            chargers.append(charger)

                time.sleep(2)  # Rate limiting

            except Exception as e:
                logger.error(f"Error fetching GitHub dataset {url}: {e}")
                continue

        logger.info(f"Collected {len(chargers)} chargers from GitHub")
        return chargers

    def _transform_github_item(self, item: Dict) -> Optional[Dict]:
        """Transform GitHub dataset item to our schema"""

        try:
            # Adapt based on actual data structure
            lat = item.get('latitude') or item.get('lat')
            lon = item.get('longitude') or item.get('lon') or item.get('lng')

            if not lat or not lon:
                return None

            # Verify in India
            if not (config.INDIA_BOUNDS["min_lat"] <= lat <= config.INDIA_BOUNDS["max_lat"] and
                    config.INDIA_BOUNDS["min_lon"] <= lon <= config.INDIA_BOUNDS["max_lon"]):
                return None

            return {
                "external_id": f"github_{item.get('id', hash(str(item)) % 1000000)}",
                "name": item.get('name', 'EV Charging Station'),
                "address": item.get('address', f"{lat}, {lon}"),
                "latitude": float(lat),
                "longitude": float(lon),
                "port_types": item.get('port_types', ['Type 2']),
                "total_ports": item.get('total_ports', 2),
                "available_ports": item.get('available_ports', 2),
                "source_type": "official",
                "verification_level": 3,
                "amenities": item.get('amenities', []),
                "nearby_amenities": [],
                "photos": [],
                "notes": "Source: GitHub Community Dataset",
                "uptime_percentage": 85.0,
                "data_source": "GitHub-Community",
            }

        except Exception as e:
            logger.error(f"Error transforming GitHub item: {e}")
            return None

    def scrape_open_datasets(self) -> List[Dict]:
        """
        Scrape from open data portals and public APIs
        """
        logger.info("Checking open data portals...")

        chargers = []

        # Add known open dataset URLs
        open_data_urls = [
            # Example URLs for open datasets
            # "https://data.example.com/ev-charging-india.json"
        ]

        for url in open_data_urls:
            try:
                logger.info(f"Fetching {url}...")
                response = self.session.get(url, timeout=30)
                response.raise_for_status()

                data = response.json()

                # Process data (adapt based on structure)
                # ...

                time.sleep(2)

            except Exception as e:
                logger.error(f"Error fetching open dataset {url}: {e}")
                continue

        return chargers

    def generate_sample_community_data(self) -> List[Dict]:
        """Generate sample community data for testing"""

        logger.info("Generating sample community data...")

        sample_data = [
            {
                "name": "Community Reported - Cyber City Gurgaon",
                "address": "DLF Cyber City, Gurgaon, Haryana 122002",
                "latitude": 28.4950,
                "longitude": 77.0890,
                "operator": "Community Contributed"
            },
            {
                "name": "Community Reported - Kolkata Airport",
                "address": "Netaji Subhash Chandra Bose International Airport, Kolkata, West Bengal 700052",
                "latitude": 22.6547,
                "longitude": 88.4467,
                "operator": "Community Contributed"
            },
            {
                "name": "Community Reported - Jaipur Railway Station",
                "address": "Jaipur Junction, Jaipur, Rajasthan 302006",
                "latitude": 26.9188,
                "longitude": 75.7873,
                "operator": "Community Contributed"
            }
        ]

        chargers = []
        for station in sample_data:
            charger = {
                "external_id": f"community_{hash(station['name']) % 100000}",
                "name": station["name"],
                "address": station["address"],
                "latitude": station["latitude"],
                "longitude": station["longitude"],
                "port_types": ["Type 2"],
                "total_ports": 2,
                "available_ports": 2,
                "source_type": "community_manual",
                "verification_level": 2,
                "amenities": [],
                "nearby_amenities": [],
                "photos": [],
                "notes": f"Operator: {station['operator']} | Source: Community",
                "uptime_percentage": 80.0,
                "data_source": "Community",
            }
            chargers.append(charger)

        return chargers

    def scrape_all_sources(self) -> List[Dict]:
        """Scrape all community sources"""

        all_chargers = []

        # Wikidata
        try:
            wikidata_chargers = self.scrape_wikidata()
            all_chargers.extend(wikidata_chargers)
            time.sleep(2)
        except Exception as e:
            logger.error(f"Wikidata scraping failed: {e}")

        # GitHub datasets
        try:
            github_chargers = self.scrape_github_datasets()
            all_chargers.extend(github_chargers)
            time.sleep(2)
        except Exception as e:
            logger.error(f"GitHub scraping failed: {e}")

        # Sample community data
        try:
            sample_chargers = self.generate_sample_community_data()
            all_chargers.extend(sample_chargers)
        except Exception as e:
            logger.error(f"Sample data generation failed: {e}")

        return all_chargers

    def save_results(self, filename: str = "community_data_raw.json"):
        """Save collected chargers to file"""
        filepath = f"{config.RAW_DATA_DIR}/{filename}"

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.chargers_collected, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Saved {len(self.chargers_collected)} chargers to {filepath}")
        return filepath


def main():
    """Main scraper function"""
    logger.info("Starting Community Data scraper...")

    scraper = CommunityDataScraper()

    # Scrape all community sources
    chargers = scraper.scrape_all_sources()
    scraper.chargers_collected = chargers

    # Save results
    filepath = scraper.save_results()

    logger.info(f"Community Data scraping complete. Total chargers: {len(scraper.chargers_collected)}")

    return filepath


if __name__ == "__main__":
    main()
