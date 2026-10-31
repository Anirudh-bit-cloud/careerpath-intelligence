"""add_historical_exits_table

Revision ID: f6a1b2c3d4e5
Revises: e5f2a1b3c4d5
Create Date: 2026-10-31 19:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6a1b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = 'e5f2a1b3c4d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'historical_exits',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.String(length=64), nullable=False, server_default='default'),
        sa.Column('employee_id', sa.String(length=64), nullable=False),
        sa.Column('exit_date', sa.String(length=10), nullable=False),
        sa.Column('exit_reason', sa.String(length=128), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=128), nullable=False, server_default='system'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_historical_exits_workspace_id'), 'historical_exits', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_historical_exits_employee_id'), 'historical_exits', ['employee_id'], unique=False)
    op.create_index(op.f('ix_historical_exits_exit_date'), 'historical_exits', ['exit_date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_historical_exits_exit_date'), table_name='historical_exits')
    op.drop_index(op.f('ix_historical_exits_employee_id'), table_name='historical_exits')
    op.drop_index(op.f('ix_historical_exits_workspace_id'), table_name='historical_exits')
    op.drop_table('historical_exits')
