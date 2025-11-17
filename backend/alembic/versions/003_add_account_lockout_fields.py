"""Add account lockout security fields

Revision ID: 003
Revises: 002
Create Date: 2025-11-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add security fields to users table for account lockout
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('account_locked_until', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('last_failed_login', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove security fields from users table
    op.drop_column('users', 'last_failed_login')
    op.drop_column('users', 'account_locked_until')
    op.drop_column('users', 'failed_login_attempts')
