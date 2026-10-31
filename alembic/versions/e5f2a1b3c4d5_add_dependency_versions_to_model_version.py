"""add_dependency_versions_to_model_version

Revision ID: e5f2a1b3c4d5
Revises: d4e1f2a3b4c5
Create Date: 2026-10-31 18:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f2a1b3c4d5'
down_revision: Union[str, Sequence[str], None] = 'd4e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add dependency_versions_json to model_versions."""
    with op.batch_alter_table('model_versions') as batch_op:
        batch_op.add_column(sa.Column('dependency_versions_json', sa.Text(), nullable=True))


def downgrade() -> None:
    """Drop dependency_versions_json from model_versions."""
    with op.batch_alter_table('model_versions') as batch_op:
        batch_op.drop_column('dependency_versions_json')
