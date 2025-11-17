"""Initial migration - Create all tables

Revision ID: 001
Revises:
Create Date: 2025-11-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('picture', sa.String(), nullable=True),
        sa.Column('port_type', sa.String(), nullable=True),
        sa.Column('vehicle_type', sa.String(), nullable=True),
        sa.Column('distance_unit', sa.String(), nullable=False, server_default='km'),
        sa.Column('is_guest', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('shara_coins', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('verifications_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('chargers_added', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('photos_uploaded', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reports_submitted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('coins_redeemed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('trust_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('theme', sa.String(), nullable=False, server_default='light'),
        sa.Column('notifications_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create user_sessions table
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('session_token', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_sessions_user_id'), 'user_sessions', ['user_id'])
    op.create_index(op.f('ix_user_sessions_session_token'), 'user_sessions', ['session_token'], unique=True)
    op.create_index(op.f('ix_user_sessions_expires_at'), 'user_sessions', ['expires_at'])

    # Create chargers table
    op.create_table(
        'chargers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('port_types', postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column('available_ports', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('total_ports', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('source_type', sa.String(), nullable=False, server_default='official'),
        sa.Column('verification_level', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('added_by', sa.String(), nullable=True),
        sa.Column('amenities', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('nearby_amenities', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('photos', postgresql.ARRAY(sa.Text()), nullable=False, server_default='{}'),
        sa.Column('last_verified', sa.DateTime(timezone=True), nullable=True),
        sa.Column('uptime_percentage', sa.Float(), nullable=False, server_default='95.0'),
        sa.Column('verified_by_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['added_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chargers_added_by'), 'chargers', ['added_by'])
    op.create_index('idx_charger_location', 'chargers', ['latitude', 'longitude'])
    op.create_index('idx_charger_verification_level', 'chargers', ['verification_level'])

    # Create verification_actions table
    op.create_table(
        'verification_actions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('charger_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('wait_time', sa.Integer(), nullable=True),
        sa.Column('port_type_used', sa.String(), nullable=True),
        sa.Column('ports_available', sa.Integer(), nullable=True),
        sa.Column('charging_success', sa.Boolean(), nullable=True),
        sa.Column('payment_method', sa.String(), nullable=True),
        sa.Column('station_lighting', sa.String(), nullable=True),
        sa.Column('cleanliness_rating', sa.Integer(), nullable=True),
        sa.Column('charging_speed_rating', sa.Integer(), nullable=True),
        sa.Column('amenities_rating', sa.Integer(), nullable=True),
        sa.Column('would_recommend', sa.Boolean(), nullable=True),
        sa.Column('photo_url', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['charger_id'], ['chargers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_verification_actions_charger_id'), 'verification_actions', ['charger_id'])
    op.create_index(op.f('ix_verification_actions_user_id'), 'verification_actions', ['user_id'])
    op.create_index('idx_verification_charger_timestamp', 'verification_actions', ['charger_id', 'timestamp'])
    op.create_index('idx_verification_user_timestamp', 'verification_actions', ['user_id', 'timestamp'])

    # Create coin_transactions table
    op.create_table(
        'coin_transactions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_coin_transactions_user_id'), 'coin_transactions', ['user_id'])
    op.create_index('idx_coin_transaction_user_timestamp', 'coin_transactions', ['user_id', 'timestamp'])


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_table('coin_transactions')
    op.drop_table('verification_actions')
    op.drop_table('chargers')
    op.drop_table('user_sessions')
    op.drop_table('users')
