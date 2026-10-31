"""add_model_version_table

Revision ID: d4e1f2a3b4c5
Revises: c3d9a1e4f2b1
Create Date: 2026-10-31 18:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e1f2a3b4c5'
down_revision: Union[str, Sequence[str], None] = 'c3d9a1e4f2b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to include model_versions table."""
    op.create_table(
        'model_versions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.String(length=64), server_default='default', nullable=False),
        sa.Column('model_type', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('created_by', sa.String(length=128), server_default='system', nullable=False),
        sa.Column('training_data_hash', sa.String(length=64), nullable=False),
        sa.Column('row_count', sa.Integer(), nullable=False),
        sa.Column('feature_list_json', sa.Text(), nullable=False),
        sa.Column('hyperparameters_json', sa.Text(), nullable=False),
        sa.Column('metrics_json', sa.Text(), nullable=False),
        sa.Column('artifact_path', sa.String(length=256), nullable=False),
        sa.Column('status', sa.String(length=32), server_default='candidate', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_model_versions_workspace_id'), 'model_versions', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_model_versions_status'), 'model_versions', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_model_versions_status'), table_name='model_versions')
    op.drop_index(op.f('ix_model_versions_workspace_id'), table_name='model_versions')
    op.drop_table('model_versions')
