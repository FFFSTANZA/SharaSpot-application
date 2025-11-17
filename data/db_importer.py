"""
Database Importer
Imports processed charger data into PostgreSQL database.
"""

import json
import logging
import sys
import os
from typing import List, Dict
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

try:
    from app.core.db_models import Base, Charger, User
    from app.core.config import settings
except ImportError:
    # Fallback if import fails
    logger = logging.getLogger(__name__)
    logger.error("Could not import backend modules. Make sure backend dependencies are installed.")
    sys.exit(1)

import config

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(f"{config.LOG_DIR}/db_importer.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class DatabaseImporter:
    """Import chargers into database"""

    def __init__(self, database_url: str = None):
        """Initialize database connection"""

        # Use provided URL or fall back to config
        if database_url:
            self.database_url = database_url
        elif hasattr(settings, 'DATABASE_URL'):
            self.database_url = settings.DATABASE_URL
        else:
            self.database_url = config.DATABASE_URL

        logger.info(f"Connecting to database: {self.database_url.split('@')[1] if '@' in self.database_url else 'local'}")

        try:
            self.engine = create_engine(self.database_url)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()

            logger.info("Database connection established")

        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

        self.imported_count = 0
        self.skipped_count = 0
        self.error_count = 0

    def get_or_create_admin_user(self) -> str:
        """Get or create an admin user for data import"""

        admin_email = "data_import@sharaspot.com"

        try:
            # Check if admin user exists
            admin = self.session.query(User).filter_by(email=admin_email).first()

            if not admin:
                # Create admin user
                from uuid import uuid4

                admin = User(
                    id=str(uuid4()),
                    email=admin_email,
                    name="Data Import Bot",
                    is_guest=False,
                    created_at=datetime.now(timezone.utc)
                )
                self.session.add(admin)
                self.session.commit()
                logger.info(f"Created admin user: {admin_email}")

            return admin.id

        except Exception as e:
            logger.error(f"Error creating admin user: {e}")
            self.session.rollback()
            return None

    def charger_exists(self, external_id: str) -> bool:
        """Check if charger already exists by external_id (in notes)"""

        try:
            # Check by external_id in notes field
            existing = self.session.query(Charger).filter(
                Charger.notes.contains(external_id)
            ).first()

            return existing is not None

        except Exception as e:
            logger.error(f"Error checking charger existence: {e}")
            return False

    def import_charger(self, charger_data: Dict, admin_user_id: str) -> bool:
        """Import a single charger into database"""

        try:
            # Check for duplicates by external_id
            external_id = charger_data.get("external_id")

            if external_id and self.charger_exists(external_id):
                logger.debug(f"Charger already exists: {external_id}")
                self.skipped_count += 1
                return False

            # Prepare notes (include external_id for tracking)
            notes = charger_data.get("notes", "")
            if external_id:
                notes = f"[ID:{external_id}] {notes}"

            # Create Charger object
            charger = Charger(
                name=charger_data["name"],
                address=charger_data["address"],
                latitude=charger_data["latitude"],
                longitude=charger_data["longitude"],
                port_types=charger_data["port_types"],
                available_ports=charger_data.get("available_ports", 1),
                total_ports=charger_data.get("total_ports", 2),
                source_type=charger_data.get("source_type", "official"),
                verification_level=charger_data.get("verification_level", 3),
                added_by=admin_user_id,
                amenities=charger_data.get("amenities", []),
                nearby_amenities=charger_data.get("nearby_amenities", []),
                photos=charger_data.get("photos", []),
                notes=notes,
                uptime_percentage=charger_data.get("uptime_percentage", 85.0),
                verified_by_count=0,
                created_at=datetime.now(timezone.utc)
            )

            # Add to session
            self.session.add(charger)
            self.session.commit()

            self.imported_count += 1
            logger.debug(f"Imported: {charger.name}")

            return True

        except IntegrityError as e:
            self.session.rollback()
            logger.warning(f"Duplicate charger (integrity error): {charger_data.get('name')}")
            self.skipped_count += 1
            return False

        except Exception as e:
            self.session.rollback()
            logger.error(f"Error importing charger {charger_data.get('name')}: {e}")
            self.error_count += 1
            return False

    def import_from_file(self, filepath: str) -> Dict:
        """Import all chargers from a processed JSON file"""

        logger.info(f"Importing chargers from {filepath}...")

        try:
            # Load processed data
            with open(filepath, 'r', encoding='utf-8') as f:
                chargers = json.load(f)

            logger.info(f"Loaded {len(chargers)} chargers from file")

            # Get admin user
            admin_user_id = self.get_or_create_admin_user()

            if not admin_user_id:
                logger.error("Could not create admin user. Aborting import.")
                return {
                    "imported": 0,
                    "skipped": 0,
                    "errors": 1,
                    "total": len(chargers)
                }

            # Import each charger
            for i, charger_data in enumerate(chargers):
                self.import_charger(charger_data, admin_user_id)

                # Log progress
                if (i + 1) % 100 == 0:
                    logger.info(f"Progress: {i+1}/{len(chargers)} chargers processed")

            # Final statistics
            stats = {
                "imported": self.imported_count,
                "skipped": self.skipped_count,
                "errors": self.error_count,
                "total": len(chargers)
            }

            logger.info("Import complete!")
            logger.info(f"  Imported: {stats['imported']}")
            logger.info(f"  Skipped (duplicates): {stats['skipped']}")
            logger.info(f"  Errors: {stats['errors']}")
            logger.info(f"  Total: {stats['total']}")

            return stats

        except Exception as e:
            logger.error(f"Error importing from file: {e}")
            return {
                "imported": self.imported_count,
                "skipped": self.skipped_count,
                "errors": self.error_count + 1,
                "total": 0
            }

    def close(self):
        """Close database connection"""
        if self.session:
            self.session.close()
        if self.engine:
            self.engine.dispose()
        logger.info("Database connection closed")


def main():
    """Main import function"""
    import sys

    logger.info("Starting database import...")

    # Get processed data file
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
    else:
        filepath = f"{config.PROCESSED_DATA_DIR}/processed_chargers.json"

    if not os.path.exists(filepath):
        logger.error(f"File not found: {filepath}")
        logger.info("Usage: python db_importer.py [filepath]")
        return

    # Import data
    importer = DatabaseImporter()

    try:
        stats = importer.import_from_file(filepath)

        # Return exit code based on success
        if stats["errors"] > 0:
            sys.exit(1)
        else:
            sys.exit(0)

    except Exception as e:
        logger.error(f"Import failed: {e}")
        sys.exit(1)

    finally:
        importer.close()


if __name__ == "__main__":
    main()
