"""add_phase5_sso_scim_hris_tables

Revision ID: a1b2c3d4e5f6
Revises: f6a1b2c3d4e5
Create Date: 2026-10-31 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f6a1b2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. oidc_configs
    op.create_table(
        'oidc_configs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.String(length=64), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('issuer_url', sa.String(length=512), nullable=False),
        sa.Column('client_id', sa.String(length=256), nullable=False),
        sa.Column('client_secret_enc', sa.Text(), nullable=True),
        sa.Column('allowed_email_domains', sa.Text(), nullable=True),
        sa.Column('role_mapping_json', sa.Text(), nullable=True),
        sa.Column('jit_default_role', sa.String(length=32), nullable=True, server_default='hrbp'),
        sa.Column('pkce_required', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=128), nullable=True, server_default='system'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_oidc_configs_workspace_id'), 'oidc_configs', ['workspace_id'], unique=True)

    # 2. scim_tokens
    op.create_table(
        'scim_tokens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.String(length=64), nullable=False),
        sa.Column('token_hash', sa.String(length=128), nullable=False),
        sa.Column('label', sa.String(length=128), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('revoked', sa.Boolean(), nullable=True, server_default='0'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_scim_tokens_workspace_id'), 'scim_tokens', ['workspace_id'], unique=False)

    # 3. hris_connector_configs
    op.create_table(
        'hris_connector_configs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.String(length=64), nullable=False),
        sa.Column('connector_type', sa.String(length=64), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('config_enc', sa.Text(), nullable=True),
        sa.Column('field_mapping_json', sa.Text(), nullable=True),
        sa.Column('sync_schedule', sa.String(length=64), nullable=True, server_default='manual'),
        sa.Column('last_sync_at', sa.DateTime(), nullable=True),
        sa.Column('last_sync_status', sa.String(length=32), nullable=True),
        sa.Column('last_sync_rows', sa.Integer(), nullable=True),
        sa.Column('last_sync_error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=128), nullable=True, server_default='system'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hris_connector_configs_workspace_id'), 'hris_connector_configs', ['workspace_id'], unique=False)

    # 4. hris_sync_logs
    op.create_table(
        'hris_sync_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('workspace_id', sa.String(length=64), nullable=False),
        sa.Column('connector_type', sa.String(length=64), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=True, server_default='running'),
        sa.Column('rows_fetched', sa.Integer(), nullable=True),
        sa.Column('rows_matched', sa.Integer(), nullable=True),
        sa.Column('rows_skipped', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('dry_run', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('triggered_by', sa.String(length=128), nullable=True, server_default='system'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hris_sync_logs_workspace_id'), 'hris_sync_logs', ['workspace_id'], unique=False)


def downgrade() -> None:
    op.drop_table('hris_sync_logs')
    op.drop_table('hris_connector_configs')
    op.drop_table('scim_tokens')
    op.drop_table('oidc_configs')
