"""Add OAuth tables for Google authentication

Revision ID: 002
Revises: 001
Create Date: 2025-11-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create oauth_tokens table
    op.create_table(
        'oauth_tokens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('access_token', sa.Text(), nullable=False),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('token_type', sa.String(), nullable=False, server_default='Bearer'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('scope', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'provider', name='uix_user_provider')
    )
    op.create_index(op.f('ix_oauth_tokens_user_provider'), 'oauth_tokens', ['user_id', 'provider'], unique=False)

    # Create oauth_states table
    op.create_table(
        'oauth_states',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('state', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('redirect_uri', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_oauth_states_state'), 'oauth_states', ['state'], unique=True)
    op.create_index(op.f('ix_oauth_states_expires_at'), 'oauth_states', ['expires_at'], unique=False)


def downgrade() -> None:
    # Drop oauth_states table
    op.drop_index(op.f('ix_oauth_states_expires_at'), table_name='oauth_states')
    op.drop_index(op.f('ix_oauth_states_state'), table_name='oauth_states')
    op.drop_table('oauth_states')

    # Drop oauth_tokens table
    op.drop_index(op.f('ix_oauth_tokens_user_provider'), table_name='oauth_tokens')
    op.drop_table('oauth_tokens')
