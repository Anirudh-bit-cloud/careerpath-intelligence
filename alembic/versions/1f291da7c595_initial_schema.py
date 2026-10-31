"""initial_schema

Revision ID: 1f291da7c595
Revises: 
Create Date: 2026-10-30 03:53:01.191696

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f291da7c595'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema (baseline already created in database)."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
