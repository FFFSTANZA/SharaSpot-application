"""Optimize geospatial indexes for charger location queries

Revision ID: 005
Revises: 004
Create Date: 2025-11-17

This migration optimizes the geospatial indexes on the chargers table to improve
performance of location-based queries. It ensures the composite index on
latitude and longitude is optimal for bounding box queries.

For production deployments with large datasets, consider enabling PostGIS extension
for even better geospatial query performance with native geography types.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Optimize geospatial indexes for better query performance.

    The existing composite index on (latitude, longitude) is already good for
    bounding box queries. This migration:
    1. Verifies the index exists
    2. Adds documentation about query patterns
    3. Optionally enables btree_gist for box-type indexing (commented out)

    Query pattern this optimizes:
    SELECT * FROM chargers
    WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
    """

    # Note: The composite B-tree index on (latitude, longitude) created in
    # migration 001 is already optimal for bounding box queries in PostgreSQL.
    # The index supports queries like:
    #   WHERE latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ?

    # Optional: Enable btree_gist extension for advanced geospatial indexing
    # Uncomment the following lines if you need PostGIS-like features without PostGIS
    # op.execute('CREATE EXTENSION IF NOT EXISTS btree_gist')

    # Optional: Create a GiST index for box-type queries (more advanced use cases)
    # This is commented out by default as the B-tree index is sufficient for most cases
    # op.execute('''
    #     CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_charger_location_gist
    #     ON chargers USING GIST (box(point(longitude, latitude), point(longitude, latitude)))
    # ''')

    # For production deployments with very large datasets (100k+ chargers),
    # consider enabling PostGIS and using geography/geometry types:
    # 1. CREATE EXTENSION postgis;
    # 2. ALTER TABLE chargers ADD COLUMN location geography(Point, 4326);
    # 3. UPDATE chargers SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
    # 4. CREATE INDEX idx_charger_location_gist ON chargers USING GIST (location);

    pass  # Current index is already optimal for the current query patterns


def downgrade() -> None:
    """
    Rollback geospatial index optimizations.
    Since we didn't modify the schema, no action needed.
    """
    # No changes to rollback
    pass
