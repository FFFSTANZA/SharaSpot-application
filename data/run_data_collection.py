#!/usr/bin/env python3
"""
Main Data Collection Orchestrator
Runs all scrapers, processes data, and imports into database.

Usage:
    python run_data_collection.py [--scrape-only] [--process-only] [--import-only]
"""

import sys
import os
import logging
import argparse
from datetime import datetime
import json

import config

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(f"{config.LOG_DIR}/data_collection_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def run_scrapers():
    """Run all data scrapers"""
    logger.info("=" * 80)
    logger.info("PHASE 1: DATA SCRAPING")
    logger.info("=" * 80)

    scraped_files = []

    # 1. Open Charge Map
    try:
        logger.info("\n--- Running Open Charge Map Scraper ---")
        import scraper_open_charge_map
        filepath = scraper_open_charge_map.main()
        if filepath:
            scraped_files.append(filepath)
    except Exception as e:
        logger.error(f"Open Charge Map scraper failed: {e}")

    # 2. Google Places
    try:
        logger.info("\n--- Running Google Places Scraper ---")
        if config.GOOGLE_PLACES_API_KEY:
            import scraper_google_places
            filepath = scraper_google_places.main()
            if filepath:
                scraped_files.append(filepath)
        else:
            logger.warning("Google Places API key not configured. Skipping...")
    except Exception as e:
        logger.error(f"Google Places scraper failed: {e}")

    # 3. Public Data
    try:
        logger.info("\n--- Running Public Data Scraper ---")
        import scraper_public_data
        filepath = scraper_public_data.main()
        if filepath:
            scraped_files.append(filepath)
    except Exception as e:
        logger.error(f"Public Data scraper failed: {e}")

    logger.info(f"\nScraping complete. Collected data from {len(scraped_files)} sources")

    return scraped_files


def process_data():
    """Process and validate scraped data"""
    logger.info("\n" + "=" * 80)
    logger.info("PHASE 2: DATA PROCESSING")
    logger.info("=" * 80)

    try:
        import data_processor
        filepath = data_processor.main()

        if filepath:
            logger.info(f"Processing complete. Output: {filepath}")
            return filepath
        else:
            logger.error("Processing failed")
            return None

    except Exception as e:
        logger.error(f"Data processing failed: {e}")
        return None


def import_to_database(processed_file: str):
    """Import processed data into database"""
    logger.info("\n" + "=" * 80)
    logger.info("PHASE 3: DATABASE IMPORT")
    logger.info("=" * 80)

    try:
        import db_importer

        importer = db_importer.DatabaseImporter()
        stats = importer.import_from_file(processed_file)
        importer.close()

        logger.info("Import complete!")
        return stats

    except Exception as e:
        logger.error(f"Database import failed: {e}")
        return None


def generate_report(stats: dict):
    """Generate summary report"""
    logger.info("\n" + "=" * 80)
    logger.info("DATA COLLECTION SUMMARY REPORT")
    logger.info("=" * 80)

    report = {
        "timestamp": datetime.now().isoformat(),
        "stats": stats
    }

    # Save report
    report_file = f"{config.LOG_DIR}/report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)

    logger.info(f"\nReport saved to: {report_file}")

    # Print summary
    logger.info("\n--- SUMMARY ---")
    logger.info(f"Total Chargers Imported: {stats.get('imported', 0)}")
    logger.info(f"Duplicates Skipped: {stats.get('skipped', 0)}")
    logger.info(f"Errors: {stats.get('errors', 0)}")
    logger.info(f"Total Processed: {stats.get('total', 0)}")

    return report_file


def main():
    """Main orchestration function"""

    parser = argparse.ArgumentParser(description="SharaSpot Data Collection System")
    parser.add_argument("--scrape-only", action="store_true", help="Only run scrapers")
    parser.add_argument("--process-only", action="store_true", help="Only process existing raw data")
    parser.add_argument("--import-only", action="store_true", help="Only import existing processed data")
    parser.add_argument("--skip-import", action="store_true", help="Skip database import")

    args = parser.parse_args()

    logger.info("=" * 80)
    logger.info("SHARASPOT DATA COLLECTION SYSTEM")
    logger.info("=" * 80)
    logger.info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("")

    try:
        # Full pipeline or specific phases
        if args.import_only:
            # Just import
            processed_file = f"{config.PROCESSED_DATA_DIR}/processed_chargers.json"
            if not os.path.exists(processed_file):
                logger.error(f"Processed file not found: {processed_file}")
                sys.exit(1)

            stats = import_to_database(processed_file)
            if stats:
                generate_report(stats)
            sys.exit(0 if stats and stats.get("errors", 0) == 0 else 1)

        elif args.process_only:
            # Just process
            processed_file = process_data()
            if not processed_file:
                sys.exit(1)

            if not args.skip_import:
                stats = import_to_database(processed_file)
                if stats:
                    generate_report(stats)
                sys.exit(0 if stats and stats.get("errors", 0) == 0 else 1)

        elif args.scrape_only:
            # Just scrape
            run_scrapers()
            sys.exit(0)

        else:
            # Full pipeline
            logger.info("Running full data collection pipeline...\n")

            # Phase 1: Scrape
            scraped_files = run_scrapers()

            if not scraped_files:
                logger.error("No data was scraped. Exiting.")
                sys.exit(1)

            # Phase 2: Process
            processed_file = process_data()

            if not processed_file:
                logger.error("Data processing failed. Exiting.")
                sys.exit(1)

            # Phase 3: Import
            if not args.skip_import:
                stats = import_to_database(processed_file)

                if stats:
                    generate_report(stats)

                    # Exit with appropriate code
                    if stats.get("errors", 0) > 0:
                        sys.exit(1)
                    else:
                        logger.info("\n✓ Data collection complete!")
                        sys.exit(0)
                else:
                    logger.error("Import failed")
                    sys.exit(1)
            else:
                logger.info("\n✓ Data collection complete (import skipped)")
                sys.exit(0)

    except KeyboardInterrupt:
        logger.warning("\nData collection interrupted by user")
        sys.exit(130)

    except Exception as e:
        logger.error(f"\nFatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
