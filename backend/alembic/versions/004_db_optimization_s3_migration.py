"""Database optimization and S3 migration preparation

Revision ID: 004
Revises: 003
Create Date: 2025-11-17

Changes:
- Add indexes on verification_actions.timestamp for performance
- Add composite index on chargers (latitude, longitude) for spatial queries
- Add index on verification_actions.charger_id for faster lookups
- Add index on chargers.verification_level for filtering
- Note: Photos column migration to S3 URLs will be handled in data migration script
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add performance indexes"""

    # Add index on verification_actions.timestamp for time-based queries
    op.create_index(
        'ix_verification_actions_timestamp',
        'verification_actions',
        ['timestamp'],
        unique=False
    )

    # Add composite index on chargers (latitude, longitude) for spatial queries
    # This significantly improves bounding box queries in routing
    op.create_index(
        'ix_chargers_location',
        'chargers',
        ['latitude', 'longitude'],
        unique=False
    )

    # Add index on verification_actions.charger_id for faster lookups
    op.create_index(
        'ix_verification_actions_charger_id',
        'verification_actions',
        ['charger_id'],
        unique=False
    )

    # Add index on chargers.verification_level for filtering
    op.create_index(
        'ix_chargers_verification_level',
        'chargers',
        ['verification_level'],
        unique=False
    )

    # Add composite index on verification_actions (user_id, timestamp) for spam detection
    op.create_index(
        'ix_verification_actions_user_timestamp',
        'verification_actions',
        ['user_id', 'timestamp'],
        unique=False
    )

    # Add index on chargers.created_at for pagination ordering
    op.create_index(
        'ix_chargers_created_at',
        'chargers',
        ['created_at'],
        unique=False
    )


def downgrade() -> None:
    """Remove performance indexes"""

    op.drop_index('ix_chargers_created_at', table_name='chargers')
    op.drop_index('ix_verification_actions_user_timestamp', table_name='verification_actions')
    op.drop_index('ix_chargers_verification_level', table_name='chargers')
    op.drop_index('ix_verification_actions_charger_id', table_name='verification_actions')
    op.drop_index('ix_chargers_location', table_name='chargers')
    op.drop_index('ix_verification_actions_timestamp', table_name='verification_actions')
