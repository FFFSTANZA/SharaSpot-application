"""Add analytics tables for Business Intelligence

Revision ID: 006
Revises: 005
Create Date: 2025-11-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create analytics_snapshots table
    op.create_table(
        'analytics_snapshots',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('snapshot_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('metric_type', sa.String(), nullable=False),
        sa.Column('metrics', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('snapshot_date', 'metric_type', name='uix_snapshot_date_type')
    )
    op.create_index('idx_analytics_snapshot_date_type', 'analytics_snapshots', ['snapshot_date', 'metric_type'], unique=False)
    op.create_index(op.f('ix_analytics_snapshots_snapshot_date'), 'analytics_snapshots', ['snapshot_date'], unique=False)
    op.create_index(op.f('ix_analytics_snapshots_metric_type'), 'analytics_snapshots', ['metric_type'], unique=False)

    # Create user_activity_events table
    op.create_table(
        'user_activity_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('event_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('platform', sa.String(), nullable=True),
        sa.Column('app_version', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_user_activity_event_user_timestamp', 'user_activity_events', ['user_id', 'timestamp'], unique=False)
    op.create_index('idx_user_activity_event_type_timestamp', 'user_activity_events', ['event_type', 'timestamp'], unique=False)
    op.create_index(op.f('ix_user_activity_events_user_id'), 'user_activity_events', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_activity_events_event_type'), 'user_activity_events', ['event_type'], unique=False)
    op.create_index(op.f('ix_user_activity_events_timestamp'), 'user_activity_events', ['timestamp'], unique=False)


def downgrade() -> None:
    # Drop user_activity_events table
    op.drop_index(op.f('ix_user_activity_events_timestamp'), table_name='user_activity_events')
    op.drop_index(op.f('ix_user_activity_events_event_type'), table_name='user_activity_events')
    op.drop_index(op.f('ix_user_activity_events_user_id'), table_name='user_activity_events')
    op.drop_index('idx_user_activity_event_type_timestamp', table_name='user_activity_events')
    op.drop_index('idx_user_activity_event_user_timestamp', table_name='user_activity_events')
    op.drop_table('user_activity_events')

    # Drop analytics_snapshots table
    op.drop_index(op.f('ix_analytics_snapshots_metric_type'), table_name='analytics_snapshots')
    op.drop_index(op.f('ix_analytics_snapshots_snapshot_date'), table_name='analytics_snapshots')
    op.drop_index('idx_analytics_snapshot_date_type', table_name='analytics_snapshots')
    op.drop_table('analytics_snapshots')
