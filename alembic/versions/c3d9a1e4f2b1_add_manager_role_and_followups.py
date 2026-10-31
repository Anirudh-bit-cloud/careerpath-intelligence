"""add_manager_role_and_followups

Revision ID: c3d9a1e4f2b1
Revises: 8a137a5ef084
Create Date: 2026-10-31 17:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d9a1e4f2b1'
down_revision: Union[str, Sequence[str], None] = '8a137a5ef084'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to include employee_id on users and manager_followups table."""
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('employee_id', sa.String(length=64), nullable=True))
        batch_op.create_index('ix_users_employee_id', ['employee_id'], unique=False)

    op.create_table(
        'manager_followups',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.String(length=64), server_default='default', nullable=False),
        sa.Column('manager_id', sa.String(length=64), nullable=False),
        sa.Column('employee_id', sa.String(length=64), nullable=False),
        sa.Column('planned_date', sa.String(length=10), nullable=False),
        sa.Column('topic', sa.String(length=256), nullable=False),
        sa.Column('talking_points_discussed', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=32), server_default='Planned', nullable=False),
        sa.Column('baseline_rri', sa.Float(), nullable=True),
        sa.Column('followup_rri', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_manager_followups_workspace_id'), 'manager_followups', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_manager_followups_manager_id'), 'manager_followups', ['manager_id'], unique=False)
    op.create_index(op.f('ix_manager_followups_employee_id'), 'manager_followups', ['employee_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_manager_followups_employee_id'), table_name='manager_followups')
    op.drop_index(op.f('ix_manager_followups_manager_id'), table_name='manager_followups')
    op.drop_index(op.f('ix_manager_followups_workspace_id'), table_name='manager_followups')
    op.drop_table('manager_followups')

    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_index('ix_users_employee_id')
        batch_op.drop_column('employee_id')
