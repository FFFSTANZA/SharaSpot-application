"""
Google Places API Scraper
Requires Google Places API key with Places API enabled.

Search for EV charging stations using Google Places API.
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
        logging.FileHandler(f"{config.LOG_DIR}/google_places.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class GooglePlacesScraper:
    """Scraper for Google Places API"""

    BASE_URL = "https://maps.googleapis.com/maps/api/place"

    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Google Places API key is required")
        self.api_key = api_key
        self.session = requests.Session()
        self.chargers_collected = []

    def search_nearby(self, lat: float, lon: float, radius: int = 50000,
                      keyword: str = "EV charging station") -> List[Dict]:
        """Search for charging stations near a location"""

        url = f"{self.BASE_URL}/nearbysearch/json"

        params = {
            "location": f"{lat},{lon}",
            "radius": radius,
            "keyword": keyword,
            "type": "charging_station",
            "key": self.api_key
        }

        all_results = []

        try:
            while True:
                logger.debug(f"Searching near ({lat}, {lon}) with radius {radius}m")
                response = self.session.get(url, params=params, timeout=30)
                response.raise_for_status()

                data = response.json()

                if data.get("status") == "OK":
                    results = data.get("results", [])
                    all_results.extend(results)
                    logger.debug(f"Found {len(results)} results in this page")

                    # Check for next page
                    next_page_token = data.get("next_page_token")
                    if next_page_token:
                        # Need to wait a bit before requesting next page
                        time.sleep(2)
                        params = {
                            "pagetoken": next_page_token,
                            "key": self.api_key
                        }
                    else:
                        break
                else:
                    logger.warning(f"API returned status: {data.get('status')}")
                    break

        except requests.exceptions.RequestException as e:
            logger.error(f"Error searching near ({lat}, {lon}): {e}")

        return all_results

    def get_place_details(self, place_id: str) -> Optional[Dict]:
        """Get detailed information about a place"""

        url = f"{self.BASE_URL}/details/json"

        params = {
            "place_id": place_id,
            "fields": "name,formatted_address,geometry,types,photos,rating,user_ratings_total,opening_hours,website,formatted_phone_number",
            "key": self.api_key
        }

        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            if data.get("status") == "OK":
                return data.get("result")
            else:
                logger.warning(f"Failed to get details for {place_id}: {data.get('status')}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting details for {place_id}: {e}")
            return None

    def scrape_by_cities(self) -> List[Dict]:
        """Scrape charging stations in major Indian cities"""
        all_chargers = []

        for city in config.INDIAN_CITIES:
            logger.info(f"Scraping {city['name']}...")

            # Search with multiple keywords to get comprehensive results
            keywords = [
                "EV charging station",
                "electric vehicle charging",
                "car charging station",
                "Tata Power charging",
                "Ather Grid",
            ]

            city_results = set()  # Use set to avoid duplicates

            for keyword in keywords:
                results = self.search_nearby(
                    city["lat"],
                    city["lon"],
                    radius=city["radius"] * 1000,  # Convert km to meters
                    keyword=keyword
                )

                for result in results:
                    place_id = result.get("place_id")
                    if place_id and place_id not in city_results:
                        city_results.add(place_id)
                        all_chargers.append(result)

                # Rate limiting
                time.sleep(config.RATE_LIMIT_DELAY)

            logger.info(f"Found {len(city_results)} unique chargers in {city['name']}")

        return all_chargers

    def enrich_with_details(self, basic_results: List[Dict]) -> List[Dict]:
        """Enrich basic search results with detailed information"""
        enriched = []

        for i, result in enumerate(basic_results):
            place_id = result.get("place_id")

            if not place_id:
                continue

            logger.debug(f"Getting details for place {i+1}/{len(basic_results)}")

            details = self.get_place_details(place_id)

            if details:
                # Merge basic and detailed info
                result.update(details)

            enriched.append(result)

            # Rate limiting
            time.sleep(0.2)

            # Log progress every 100 places
            if (i + 1) % 100 == 0:
                logger.info(f"Enriched {i+1}/{len(basic_results)} places")

        return enriched

    def transform_data(self, raw_data: List[Dict]) -> List[Dict]:
        """Transform Google Places data to our schema"""
        transformed = []

        for place in raw_data:
            try:
                # Extract geometry
                geometry = place.get("geometry", {})
                location = geometry.get("location", {})

                lat = location.get("lat")
                lon = location.get("lng")

                if not lat or not lon:
                    continue

                # Verify it's in India
                if not (config.INDIA_BOUNDS["min_lat"] <= lat <= config.INDIA_BOUNDS["max_lat"] and
                        config.INDIA_BOUNDS["min_lon"] <= lon <= config.INDIA_BOUNDS["max_lon"]):
                    continue

                # Extract name and address
                name = place.get("name", "Charging Station")
                address = place.get("formatted_address") or place.get("vicinity", "Address not available")

                # Infer port types from name/description
                port_types = self._infer_port_types(name, address)

                # Extract amenities from types
                amenities = []
                place_types = place.get("types", [])

                if "parking" in place_types:
                    amenities.append("parking")
                if "restaurant" in place_types or "cafe" in place_types or "food" in place_types:
                    amenities.append("cafe")
                if "gas_station" in place_types:
                    amenities.append("convenience_store")

                # Build notes
                notes = [f"Source: Google Places"]

                if place.get("rating"):
                    notes.append(f"Google Rating: {place['rating']}/5 ({place.get('user_ratings_total', 0)} reviews)")

                if place.get("website"):
                    notes.append(f"Website: {place['website']}")

                if place.get("formatted_phone_number"):
                    notes.append(f"Phone: {place['formatted_phone_number']}")

                # Estimate ports (Google doesn't provide this)
                total_ports = 2  # Default assumption

                # Build charger object
                charger = {
                    "external_id": f"gplaces_{place.get('place_id')}",
                    "name": name,
                    "address": address,
                    "latitude": lat,
                    "longitude": lon,
                    "port_types": port_types,
                    "total_ports": total_ports,
                    "available_ports": total_ports,
                    "source_type": "official",
                    "verification_level": 3,  # Medium confidence from Google
                    "amenities": amenities,
                    "nearby_amenities": [],
                    "photos": self._extract_photo_references(place.get("photos", [])),
                    "notes": " | ".join(notes),
                    "uptime_percentage": 85.0,
                    "data_source": "GooglePlaces",
                    "raw_data": place
                }

                transformed.append(charger)

            except Exception as e:
                logger.error(f"Error transforming place {place.get('place_id')}: {e}")
                continue

        return transformed

    def _infer_port_types(self, name: str, address: str) -> List[str]:
        """Infer port types from name and address"""
        text = (name + " " + address).lower()

        port_types = []

        # Check for specific port types mentioned
        if "ccs" in text or "combo" in text:
            port_types.append("CCS")
        if "chademo" in text:
            port_types.append("CHAdeMO")
        if "type 2" in text or "type2" in text:
            port_types.append("Type 2")
        if "type 1" in text or "type1" in text:
            port_types.append("Type 1")
        if "tesla" in text:
            port_types.append("Tesla Supercharger")

        # Default to Type 2 if nothing specific found (most common in India)
        if not port_types:
            port_types = ["Type 2"]

        return port_types

    def _extract_photo_references(self, photos: List[Dict]) -> List[str]:
        """Extract photo references (not downloading actual images)"""
        photo_refs = []

        for photo in photos[:3]:  # Limit to 3 photos
            photo_ref = photo.get("photo_reference")
            if photo_ref:
                # Store reference, actual download can be done later if needed
                photo_refs.append(f"gplaces_photo:{photo_ref}")

        return photo_refs

    def save_results(self, filename: str = "google_places_raw.json"):
        """Save collected chargers to file"""
        filepath = f"{config.RAW_DATA_DIR}/{filename}"

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.chargers_collected, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Saved {len(self.chargers_collected)} chargers to {filepath}")
        return filepath


def main():
    """Main scraper function"""
    logger.info("Starting Google Places scraper...")

    if not config.GOOGLE_PLACES_API_KEY:
        logger.error("Google Places API key not configured. Skipping...")
        return None

    scraper = GooglePlacesScraper(api_key=config.GOOGLE_PLACES_API_KEY)

    # Scrape by cities
    logger.info("Scraping major cities...")
    basic_results = scraper.scrape_by_cities()
    logger.info(f"Found {len(basic_results)} basic results")

    # Enrich with details (optional, costs more API credits)
    # logger.info("Enriching with detailed information...")
    # enriched_results = scraper.enrich_with_details(basic_results)

    # Transform data
    logger.info("Transforming data...")
    transformed = scraper.transform_data(basic_results)

    scraper.chargers_collected = transformed

    # Save results
    filepath = scraper.save_results()

    logger.info(f"Google Places scraping complete. Total chargers: {len(scraper.chargers_collected)}")

    return filepath


if __name__ == "__main__":
    main()
