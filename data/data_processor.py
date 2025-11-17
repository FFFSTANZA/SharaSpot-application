"""
Data Processor
Validates, cleans, deduplicates, and merges charger data from multiple sources.
"""

import json
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import math
import hashlib
import config

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(f"{config.LOG_DIR}/data_processor.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class DataProcessor:
    """Process and validate charger data"""

    def __init__(self):
        self.validated_chargers = []
        self.duplicates_removed = 0
        self.invalid_removed = 0

    def load_raw_data(self, filepath: str) -> List[Dict]:
        """Load raw data from JSON file"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            logger.info(f"Loaded {len(data)} records from {filepath}")
            return data
        except Exception as e:
            logger.error(f"Error loading {filepath}: {e}")
            return []

    def validate_charger(self, charger: Dict) -> Tuple[bool, Optional[str]]:
        """Validate a single charger record"""

        # Required fields
        required_fields = ["name", "address", "latitude", "longitude", "port_types"]

        for field in required_fields:
            if field not in charger or charger[field] is None:
                return False, f"Missing required field: {field}"

        # Validate latitude/longitude
        try:
            lat = float(charger["latitude"])
            lon = float(charger["longitude"])

            if not (-90 <= lat <= 90):
                return False, f"Invalid latitude: {lat}"

            if not (-180 <= lon <= 180):
                return False, f"Invalid longitude: {lon}"

            # Check if in India
            if not (config.INDIA_BOUNDS["min_lat"] <= lat <= config.INDIA_BOUNDS["max_lat"] and
                    config.INDIA_BOUNDS["min_lon"] <= lon <= config.INDIA_BOUNDS["max_lon"]):
                return False, f"Location outside India: ({lat}, {lon})"

        except (ValueError, TypeError) as e:
            return False, f"Invalid coordinates: {e}"

        # Validate port_types
        if not isinstance(charger["port_types"], list) or len(charger["port_types"]) == 0:
            return False, "port_types must be a non-empty list"

        # Validate total_ports
        total_ports = charger.get("total_ports", 1)
        if not isinstance(total_ports, int) or total_ports < 1:
            return False, f"Invalid total_ports: {total_ports}"

        # Validate available_ports
        available_ports = charger.get("available_ports", 1)
        if not isinstance(available_ports, int) or available_ports < 0:
            return False, f"Invalid available_ports: {available_ports}"

        return True, None

    def clean_charger(self, charger: Dict) -> Dict:
        """Clean and normalize charger data"""

        cleaned = charger.copy()

        # Normalize name
        cleaned["name"] = cleaned["name"].strip()

        # Normalize address
        cleaned["address"] = cleaned["address"].strip()

        # Ensure numeric types
        cleaned["latitude"] = float(cleaned["latitude"])
        cleaned["longitude"] = float(cleaned["longitude"])
        cleaned["total_ports"] = int(cleaned.get("total_ports", 2))
        cleaned["available_ports"] = int(cleaned.get("available_ports", cleaned["total_ports"]))

        # Ensure lists
        if not isinstance(cleaned.get("port_types"), list):
            cleaned["port_types"] = ["Type 2"]

        if not isinstance(cleaned.get("amenities"), list):
            cleaned["amenities"] = []

        if not isinstance(cleaned.get("nearby_amenities"), list):
            cleaned["nearby_amenities"] = []

        if not isinstance(cleaned.get("photos"), list):
            cleaned["photos"] = []

        # Set defaults
        cleaned.setdefault("source_type", "official")
        cleaned.setdefault("verification_level", 3)
        cleaned.setdefault("uptime_percentage", 85.0)
        cleaned.setdefault("notes", "")

        # Remove raw_data field (too large for DB)
        if "raw_data" in cleaned:
            del cleaned["raw_data"]

        return cleaned

    def calculate_distance(self, lat1: float, lon1: float,
                          lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates in meters (Haversine formula)"""

        R = 6371000  # Earth's radius in meters

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)

        a = (math.sin(dlat/2) * math.sin(dlat/2) +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(dlon/2) * math.sin(dlon/2))

        c = 2 * math.asin(math.sqrt(a))

        return R * c

    def are_duplicates(self, charger1: Dict, charger2: Dict,
                      distance_threshold: float = 50) -> bool:
        """
        Check if two chargers are duplicates
        - Within 50 meters of each other
        - Similar names or addresses
        """

        # Calculate distance
        distance = self.calculate_distance(
            charger1["latitude"], charger1["longitude"],
            charger2["latitude"], charger2["longitude"]
        )

        if distance > distance_threshold:
            return False

        # Check name similarity (simple approach)
        name1 = charger1["name"].lower()
        name2 = charger2["name"].lower()

        # If names share significant words, likely duplicate
        words1 = set(name1.split())
        words2 = set(name2.split())

        # Remove common words
        common_words = {"the", "a", "an", "in", "at", "charging", "station", "ev", "electric", "vehicle"}
        words1 -= common_words
        words2 -= common_words

        if words1 and words2:
            overlap = len(words1 & words2) / max(len(words1), len(words2))
            if overlap > 0.5:  # 50% word overlap
                return True

        # Check address similarity
        addr1 = charger1["address"].lower()
        addr2 = charger2["address"].lower()

        if addr1 == addr2:
            return True

        return False

    def merge_chargers(self, charger1: Dict, charger2: Dict) -> Dict:
        """
        Merge two duplicate chargers, keeping the best data from each
        """

        merged = charger1.copy()

        # Prefer higher verification level
        if charger2.get("verification_level", 0) > charger1.get("verification_level", 0):
            merged["verification_level"] = charger2["verification_level"]
            merged["source_type"] = charger2["source_type"]

        # Merge port types (union)
        port_types = list(set(charger1.get("port_types", []) + charger2.get("port_types", [])))
        merged["port_types"] = port_types

        # Take max ports
        merged["total_ports"] = max(
            charger1.get("total_ports", 0),
            charger2.get("total_ports", 0)
        )

        # Merge amenities (union)
        amenities = list(set(charger1.get("amenities", []) + charger2.get("amenities", [])))
        merged["amenities"] = amenities

        # Merge photos
        photos = list(set(charger1.get("photos", []) + charger2.get("photos", [])))
        merged["photos"] = photos[:10]  # Limit to 10 photos

        # Merge notes
        notes = []
        if charger1.get("notes"):
            notes.append(charger1["notes"])
        if charger2.get("notes") and charger2["notes"] not in notes:
            notes.append(charger2["notes"])
        merged["notes"] = " | ".join(notes)

        # Track data sources
        sources = []
        if charger1.get("data_source"):
            sources.append(charger1["data_source"])
        if charger2.get("data_source") and charger2["data_source"] not in sources:
            sources.append(charger2["data_source"])
        merged["data_source"] = "+".join(sources)

        return merged

    def deduplicate(self, chargers: List[Dict]) -> List[Dict]:
        """Remove duplicate chargers"""

        logger.info(f"Deduplicating {len(chargers)} chargers...")

        deduplicated = []
        skip_indices = set()

        for i, charger1 in enumerate(chargers):
            if i in skip_indices:
                continue

            # Check against remaining chargers
            merged = charger1
            for j in range(i + 1, len(chargers)):
                if j in skip_indices:
                    continue

                charger2 = chargers[j]

                if self.are_duplicates(merged, charger2):
                    # Merge and mark as processed
                    merged = self.merge_chargers(merged, charger2)
                    skip_indices.add(j)
                    self.duplicates_removed += 1

            deduplicated.append(merged)

        logger.info(f"Removed {self.duplicates_removed} duplicates. Remaining: {len(deduplicated)}")

        return deduplicated

    def process_all(self, raw_files: List[str]) -> List[Dict]:
        """Process all raw data files"""

        logger.info("Starting data processing...")

        # Load all raw data
        all_chargers = []
        for filepath in raw_files:
            chargers = self.load_raw_data(filepath)
            all_chargers.extend(chargers)

        logger.info(f"Loaded {len(all_chargers)} total chargers from {len(raw_files)} sources")

        # Validate and clean
        valid_chargers = []
        for charger in all_chargers:
            is_valid, error = self.validate_charger(charger)

            if is_valid:
                cleaned = self.clean_charger(charger)
                valid_chargers.append(cleaned)
            else:
                logger.debug(f"Invalid charger: {error}")
                self.invalid_removed += 1

        logger.info(f"Validated: {len(valid_chargers)} valid, {self.invalid_removed} invalid")

        # Deduplicate
        deduplicated = self.deduplicate(valid_chargers)

        self.validated_chargers = deduplicated

        logger.info(f"Processing complete. Final count: {len(self.validated_chargers)}")

        return self.validated_chargers

    def save_processed_data(self, filename: str = "processed_chargers.json"):
        """Save processed data"""
        filepath = f"{config.PROCESSED_DATA_DIR}/{filename}"

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.validated_chargers, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Saved {len(self.validated_chargers)} processed chargers to {filepath}")
        return filepath

    def get_statistics(self) -> Dict:
        """Get processing statistics"""
        return {
            "total_processed": len(self.validated_chargers),
            "duplicates_removed": self.duplicates_removed,
            "invalid_removed": self.invalid_removed,
            "data_sources": list(set(c.get("data_source", "Unknown") for c in self.validated_chargers)),
            "cities_covered": len(set(c.get("address", "").split(",")[-2].strip() for c in self.validated_chargers if c.get("address"))),
            "total_ports": sum(c.get("total_ports", 0) for c in self.validated_chargers),
        }


def main():
    """Main processing function"""
    import glob

    logger.info("Starting data processing...")

    processor = DataProcessor()

    # Find all raw data files
    raw_files = glob.glob(f"{config.RAW_DATA_DIR}/*_raw.json")

    if not raw_files:
        logger.warning("No raw data files found!")
        return None

    # Process all data
    processed = processor.process_all(raw_files)

    # Save processed data
    filepath = processor.save_processed_data()

    # Print statistics
    stats = processor.get_statistics()
    logger.info("Processing Statistics:")
    logger.info(f"  Total Chargers: {stats['total_processed']}")
    logger.info(f"  Duplicates Removed: {stats['duplicates_removed']}")
    logger.info(f"  Invalid Removed: {stats['invalid_removed']}")
    logger.info(f"  Data Sources: {', '.join(stats['data_sources'])}")
    logger.info(f"  Total Ports: {stats['total_ports']}")

    return filepath


if __name__ == "__main__":
    main()
