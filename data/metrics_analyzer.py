"""
Metrics Analyzer for Scraping Preview
Generates comprehensive statistics and insights from scraped charging station data
"""

import json
from collections import defaultdict, Counter
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path
import re


class ScrapingMetricsAnalyzer:
    """Analyzes scraped data and generates comprehensive metrics"""

    # Indian states mapping (city to state)
    CITY_TO_STATE = {
        'Mumbai': 'Maharashtra', 'Pune': 'Maharashtra', 'Nagpur': 'Maharashtra',
        'Nashik': 'Maharashtra', 'Aurangabad': 'Maharashtra', 'Thane': 'Maharashtra',
        'Delhi': 'Delhi', 'New Delhi': 'Delhi',
        'Bangalore': 'Karnataka', 'Bengaluru': 'Karnataka', 'Mysore': 'Karnataka',
        'Mangalore': 'Karnataka', 'Hubli': 'Karnataka',
        'Chennai': 'Tamil Nadu', 'Coimbatore': 'Tamil Nadu', 'Madurai': 'Tamil Nadu',
        'Tiruchirappalli': 'Tamil Nadu', 'Salem': 'Tamil Nadu',
        'Hyderabad': 'Telangana', 'Warangal': 'Telangana', 'Nizamabad': 'Telangana',
        'Kolkata': 'West Bengal', 'Howrah': 'West Bengal', 'Durgapur': 'West Bengal',
        'Ahmedabad': 'Gujarat', 'Surat': 'Gujarat', 'Vadodara': 'Gujarat',
        'Rajkot': 'Gujarat', 'Gandhinagar': 'Gujarat',
        'Jaipur': 'Rajasthan', 'Jodhpur': 'Rajasthan', 'Udaipur': 'Rajasthan',
        'Kota': 'Rajasthan',
        'Lucknow': 'Uttar Pradesh', 'Kanpur': 'Uttar Pradesh', 'Agra': 'Uttar Pradesh',
        'Varanasi': 'Uttar Pradesh', 'Noida': 'Uttar Pradesh', 'Ghaziabad': 'Uttar Pradesh',
        'Chandigarh': 'Chandigarh', 'Panchkula': 'Haryana', 'Mohali': 'Punjab',
        'Bhopal': 'Madhya Pradesh', 'Indore': 'Madhya Pradesh', 'Gwalior': 'Madhya Pradesh',
        'Kochi': 'Kerala', 'Thiruvananthapuram': 'Kerala', 'Kozhikode': 'Kerala',
        'Bhubaneswar': 'Odisha', 'Cuttack': 'Odisha',
        'Guwahati': 'Assam', 'Dispur': 'Assam',
        'Patna': 'Bihar', 'Gaya': 'Bihar',
        'Raipur': 'Chhattisgarh',
        'Panaji': 'Goa', 'Margao': 'Goa',
        'Ranchi': 'Jharkhand', 'Jamshedpur': 'Jharkhand',
        'Shimla': 'Himachal Pradesh', 'Dharamshala': 'Himachal Pradesh',
        'Srinagar': 'Jammu and Kashmir', 'Jammu': 'Jammu and Kashmir',
        'Imphal': 'Manipur',
        'Shillong': 'Meghalaya',
        'Aizawl': 'Mizoram',
        'Kohima': 'Nagaland',
        'Puducherry': 'Puducherry',
        'Amritsar': 'Punjab', 'Ludhiana': 'Punjab', 'Jalandhar': 'Punjab',
        'Dehradun': 'Uttarakhand', 'Haridwar': 'Uttarakhand',
        'Visakhapatnam': 'Andhra Pradesh', 'Vijayawada': 'Andhra Pradesh',
        'Guntur': 'Andhra Pradesh', 'Tirupati': 'Andhra Pradesh',
    }

    def __init__(self, processed_data_path: Optional[str] = None):
        """
        Initialize the metrics analyzer

        Args:
            processed_data_path: Path to processed chargers JSON file
        """
        self.processed_data_path = processed_data_path or "processed/processed_chargers.json"
        self.data: List[Dict[str, Any]] = []
        self.metrics: Dict[str, Any] = {}

    def load_data(self) -> bool:
        """Load processed data from JSON file"""
        try:
            data_file = Path(self.processed_data_path)
            if not data_file.exists():
                print(f"❌ Data file not found: {self.processed_data_path}")
                return False

            with open(data_file, 'r', encoding='utf-8') as f:
                self.data = json.load(f)

            print(f"✅ Loaded {len(self.data)} charging stations")
            return True
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False

    def _extract_state_from_address(self, address: str) -> str:
        """Extract state from address string"""
        if not address:
            return "Unknown"

        # Try to find city name in address
        for city, state in self.CITY_TO_STATE.items():
            if city.lower() in address.lower():
                return state

        # Try to find state name directly
        states = set(self.CITY_TO_STATE.values())
        for state in states:
            if state.lower() in address.lower():
                return state

        # Check for common state abbreviations
        address_upper = address.upper()
        state_patterns = {
            r'\bMH\b': 'Maharashtra',
            r'\bDL\b': 'Delhi',
            r'\bKA\b': 'Karnataka',
            r'\bTN\b': 'Tamil Nadu',
            r'\bTS\b': 'Telangana',
            r'\bWB\b': 'West Bengal',
            r'\bGJ\b': 'Gujarat',
            r'\bRJ\b': 'Rajasthan',
            r'\bUP\b': 'Uttar Pradesh',
            r'\bKL\b': 'Kerala',
            r'\bAP\b': 'Andhra Pradesh',
            r'\bPB\b': 'Punjab',
            r'\bHR\b': 'Haryana',
        }

        for pattern, state in state_patterns.items():
            if re.search(pattern, address_upper):
                return state

        return "Unknown"

    def analyze(self) -> Dict[str, Any]:
        """Generate comprehensive metrics from scraped data"""
        if not self.data:
            print("⚠️ No data to analyze")
            return {}

        print("\n📊 Analyzing scraped data...")

        # Initialize counters
        state_counts = defaultdict(int)
        city_counts = defaultdict(int)
        source_counts = defaultdict(int)
        port_type_counts = defaultdict(int)
        amenity_counts = defaultdict(int)
        operator_counts = defaultdict(int)
        verification_levels = defaultdict(int)

        total_ports = 0
        total_available_ports = 0
        stations_with_photos = 0
        stations_with_amenities = 0
        high_uptime_stations = 0
        verified_stations = 0

        duplicate_sources = defaultdict(int)
        port_combinations = Counter()

        # Analyze each charging station
        for station in self.data:
            # Extract state from address
            state = self._extract_state_from_address(station.get('address', ''))
            state_counts[state] += 1

            # Count by data source
            source = station.get('data_source', 'Unknown')
            source_counts[source] += 1

            # Port types analysis
            port_types = station.get('port_types', [])
            for port_type in port_types:
                port_type_counts[port_type] += 1

            # Port combination analysis
            if port_types:
                port_combo = ', '.join(sorted(port_types))
                port_combinations[port_combo] += 1

            # Ports count
            total_ports += station.get('total_ports', 0)
            total_available_ports += station.get('available_ports', 0)

            # Amenities analysis
            amenities = station.get('amenities', []) + station.get('nearby_amenities', [])
            if amenities:
                stations_with_amenities += 1
                for amenity in amenities:
                    amenity_counts[amenity] += 1

            # Photos
            photos = station.get('photos', [])
            if photos:
                stations_with_photos += 1

            # Verification level
            verification_level = station.get('verification_level', 0)
            verification_levels[verification_level] += 1

            if verification_level >= 4:
                verified_stations += 1

            # Uptime
            uptime = station.get('uptime_percentage', 0)
            if uptime >= 90:
                high_uptime_stations += 1

            # Extract operator from notes
            notes = station.get('notes', '')
            if 'Operator:' in notes:
                operator_match = re.search(r'Operator:\s*([^|]+)', notes)
                if operator_match:
                    operator = operator_match.group(1).strip()
                    operator_counts[operator] += 1

        # Calculate summary statistics
        total_stations = len(self.data)

        self.metrics = {
            'summary': {
                'total_stations': total_stations,
                'total_ports': total_ports,
                'total_available_ports': total_available_ports,
                'average_ports_per_station': round(total_ports / total_stations, 2) if total_stations > 0 else 0,
                'stations_with_photos': stations_with_photos,
                'stations_with_amenities': stations_with_amenities,
                'high_uptime_stations': high_uptime_stations,
                'verified_stations': verified_stations,
                'coverage_percentage': {
                    'with_photos': round(stations_with_photos / total_stations * 100, 2) if total_stations > 0 else 0,
                    'with_amenities': round(stations_with_amenities / total_stations * 100, 2) if total_stations > 0 else 0,
                    'high_uptime': round(high_uptime_stations / total_stations * 100, 2) if total_stations > 0 else 0,
                    'verified': round(verified_stations / total_stations * 100, 2) if total_stations > 0 else 0,
                }
            },
            'by_state': dict(sorted(state_counts.items(), key=lambda x: x[1], reverse=True)),
            'by_source': dict(sorted(source_counts.items(), key=lambda x: x[1], reverse=True)),
            'port_types': dict(sorted(port_type_counts.items(), key=lambda x: x[1], reverse=True)),
            'port_combinations': dict(port_combinations.most_common(10)),
            'amenities': dict(sorted(amenity_counts.items(), key=lambda x: x[1], reverse=True)),
            'operators': dict(sorted(operator_counts.items(), key=lambda x: x[1], reverse=True)),
            'verification_distribution': dict(verification_levels),
            'data_quality': {
                'complete_stations': sum(1 for s in self.data if all([
                    s.get('name'),
                    s.get('address'),
                    s.get('latitude'),
                    s.get('longitude'),
                    s.get('port_types')
                ])),
                'stations_with_contact': sum(1 for s in self.data if 'phone' in s.get('notes', '').lower()),
                'stations_with_website': sum(1 for s in self.data if 'website' in s.get('notes', '').lower()),
            },
            'top_states': list(sorted(state_counts.items(), key=lambda x: x[1], reverse=True))[:10],
            'top_operators': list(sorted(operator_counts.items(), key=lambda x: x[1], reverse=True))[:10],
            'analysis_timestamp': datetime.now().isoformat(),
        }

        print("✅ Metrics analysis complete!")
        return self.metrics

    def print_summary(self):
        """Print a formatted summary of the metrics"""
        if not self.metrics:
            print("⚠️ No metrics available. Run analyze() first.")
            return

        print("\n" + "="*80)
        print("📊 SCRAPING METRICS SUMMARY")
        print("="*80)

        summary = self.metrics['summary']
        print(f"\n🎯 Overall Statistics:")
        print(f"   Total Charging Stations: {summary['total_stations']:,}")
        print(f"   Total Charging Ports: {summary['total_ports']:,}")
        print(f"   Available Ports: {summary['total_available_ports']:,}")
        print(f"   Average Ports/Station: {summary['average_ports_per_station']}")

        print(f"\n📸 Data Richness:")
        print(f"   Stations with Photos: {summary['stations_with_photos']:,} ({summary['coverage_percentage']['with_photos']}%)")
        print(f"   Stations with Amenities: {summary['stations_with_amenities']:,} ({summary['coverage_percentage']['with_amenities']}%)")
        print(f"   High Uptime Stations (>90%): {summary['high_uptime_stations']:,} ({summary['coverage_percentage']['high_uptime']}%)")
        print(f"   Verified Stations: {summary['verified_stations']:,} ({summary['coverage_percentage']['verified']}%)")

        print(f"\n🗺️ Top 10 States by Station Count:")
        for i, (state, count) in enumerate(self.metrics['top_states'], 1):
            percentage = (count / summary['total_stations'] * 100) if summary['total_stations'] > 0 else 0
            print(f"   {i:2d}. {state:20s}: {count:5,} stations ({percentage:5.2f}%)")

        print(f"\n📡 Data Sources:")
        for source, count in self.metrics['by_source'].items():
            percentage = (count / summary['total_stations'] * 100) if summary['total_stations'] > 0 else 0
            print(f"   {source:25s}: {count:5,} stations ({percentage:5.2f}%)")

        print(f"\n🔌 Port Types Distribution:")
        for port_type, count in self.metrics['port_types'].items():
            print(f"   {port_type:15s}: {count:5,} instances")

        print(f"\n🏢 Top 10 Operators:")
        for i, (operator, count) in enumerate(self.metrics['top_operators'], 1):
            print(f"   {i:2d}. {operator:30s}: {count:4,} stations")

        print(f"\n🎁 Top Amenities:")
        top_amenities = sorted(self.metrics['amenities'].items(), key=lambda x: x[1], reverse=True)[:10]
        for amenity, count in top_amenities:
            print(f"   {amenity:20s}: {count:4,} stations")

        print(f"\n✅ Data Quality:")
        quality = self.metrics['data_quality']
        print(f"   Complete Stations: {quality['complete_stations']:,}")
        print(f"   With Contact Info: {quality['stations_with_contact']:,}")
        print(f"   With Website: {quality['stations_with_website']:,}")

        print("\n" + "="*80)

    def save_metrics(self, output_path: str = "processed/metrics.json"):
        """Save metrics to JSON file"""
        try:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)

            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(self.metrics, f, indent=2, ensure_ascii=False)

            print(f"✅ Metrics saved to {output_path}")
            return True
        except Exception as e:
            print(f"❌ Error saving metrics: {e}")
            return False

    def get_metrics(self) -> Dict[str, Any]:
        """Return the metrics dictionary"""
        return self.metrics


def main():
    """Main function for standalone execution"""
    import sys

    # Check for command line argument
    data_path = sys.argv[1] if len(sys.argv) > 1 else "processed/processed_chargers.json"

    # Create analyzer
    analyzer = ScrapingMetricsAnalyzer(data_path)

    # Load data
    if not analyzer.load_data():
        return

    # Analyze
    analyzer.analyze()

    # Print summary
    analyzer.print_summary()

    # Save metrics
    analyzer.save_metrics()


if __name__ == "__main__":
    main()
