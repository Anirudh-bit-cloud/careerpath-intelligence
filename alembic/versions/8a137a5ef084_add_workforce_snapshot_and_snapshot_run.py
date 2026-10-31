"""add_workforce_snapshot_and_snapshot_run

Revision ID: 8a137a5ef084
Revises: 1f291da7c595
Create Date: 2026-10-31 17:09:39.259693

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a137a5ef084'
down_revision: Union[str, Sequence[str], None] = '1f291da7c595'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to include workforce_snapshots and snapshot_runs."""
    op.create_table(
        'workforce_snapshots',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.String(length=64), nullable=False),
        sa.Column('snapshot_date', sa.String(length=10), nullable=False),
        sa.Column('employee_id', sa.String(length=64), nullable=False),
        sa.Column('rri', sa.Float(), nullable=False),
        sa.Column('rri_tier', sa.String(length=32), nullable=False),
        sa.Column('ml_probability', sa.Float(), nullable=True),
        sa.Column('cluster_id', sa.Integer(), nullable=True),
        sa.Column('job_level', sa.Integer(), nullable=True),
        sa.Column('department', sa.String(length=128), nullable=True),
        sa.Column('promotion_gap_years', sa.Float(), nullable=True),
        sa.Column('satisfaction', sa.Float(), nullable=True),
        sa.Column('is_synthetic', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workforce_snapshots_workspace_id'), 'workforce_snapshots', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_workforce_snapshots_snapshot_date'), 'workforce_snapshots', ['snapshot_date'], unique=False)
    op.create_index(op.f('ix_workforce_snapshots_employee_id'), 'workforce_snapshots', ['employee_id'], unique=False)

    op.create_table(
        'snapshot_runs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.String(length=64), nullable=False),
        sa.Column('snapshot_date', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('created_by', sa.String(length=128), nullable=False),
        sa.Column('trigger_type', sa.String(length=64), server_default='manual', nullable=False),
        sa.Column('row_count', sa.Integer(), nullable=False),
        sa.Column('model_version', sa.String(length=64), nullable=True),
        sa.Column('policy_version', sa.Integer(), nullable=True),
        sa.Column('is_synthetic', sa.Boolean(), server_default='0', nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_snapshot_runs_workspace_id'), 'snapshot_runs', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_snapshot_runs_snapshot_date'), 'snapshot_runs', ['snapshot_date'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_snapshot_runs_snapshot_date'), table_name='snapshot_runs')
    op.drop_index(op.f('ix_snapshot_runs_workspace_id'), table_name='snapshot_runs')
    op.drop_table('snapshot_runs')
    op.drop_index(op.f('ix_workforce_snapshots_employee_id'), table_name='workforce_snapshots')
    op.drop_index(op.f('ix_workforce_snapshots_snapshot_date'), table_name='workforce_snapshots')
    op.drop_index(op.f('ix_workforce_snapshots_workspace_id'), table_name='workforce_snapshots')
    op.drop_table('workforce_snapshots')
