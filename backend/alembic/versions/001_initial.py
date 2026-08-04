"""initial_migration

Revision ID: 001_initial
Revises: 
Create Date: 2026-08-04 23:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Table: users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('supabase_uid', sa.String(length=255), nullable=False),
        sa.Column('auth_provider', sa.String(length=50), server_default='google', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_supabase_uid'), 'users', ['supabase_uid'], unique=True)

    # Table: study_sessions
    op.create_table(
        'study_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='active', nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('source_url', sa.String(length=500), nullable=True),
        sa.Column('source_type', sa.String(length=50), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('paused_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_duration_seconds', sa.Integer(), nullable=True),
        sa.Column('active_duration_seconds', sa.Integer(), nullable=True),
        sa.Column('pause_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('avg_focus_score', sa.Float(), nullable=True),
        sa.Column('min_focus_score', sa.Float(), nullable=True),
        sa.Column('max_focus_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_study_sessions_user_id'), 'study_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_study_sessions_status'), 'study_sessions', ['status'], unique=False)
    op.create_index(op.f('ix_study_sessions_started_at'), 'study_sessions', ['started_at'], unique=False)

    # Table: focus_logs
    op.create_table(
        'focus_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('focus_score', sa.Float(), nullable=False),
        sa.Column('face_detected', sa.Boolean(), nullable=False),
        sa.Column('face_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('head_yaw', sa.Float(), nullable=True),
        sa.Column('head_pitch', sa.Float(), nullable=True),
        sa.Column('head_roll', sa.Float(), nullable=True),
        sa.Column('head_direction', sa.String(length=10), nullable=True),
        sa.Column('focus_level', sa.String(length=10), nullable=False),
        sa.Column('is_distracted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('face_missing_duration_ms', sa.Integer(), server_default='0', nullable=False),
        sa.Column('raw_landmarks', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['study_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_focus_logs_session_id'), 'focus_logs', ['session_id'], unique=False)
    op.create_index(op.f('ix_focus_logs_user_id'), 'focus_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_focus_logs_recorded_at'), 'focus_logs', ['recorded_at'], unique=False)

    # Table: reports
    op.create_table(
        'reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_duration_seconds', sa.Integer(), nullable=False),
        sa.Column('active_duration_seconds', sa.Integer(), nullable=False),
        sa.Column('avg_focus_score', sa.Float(), nullable=False),
        sa.Column('median_focus_score', sa.Float(), nullable=True),
        sa.Column('max_focus_score', sa.Float(), nullable=False),
        sa.Column('min_focus_score', sa.Float(), nullable=False),
        sa.Column('total_distractions', sa.Integer(), server_default='0', nullable=False),
        sa.Column('total_face_missing_events', sa.Integer(), server_default='0', nullable=False),
        sa.Column('longest_focus_streak_seconds', sa.Integer(), nullable=True),
        sa.Column('longest_distraction_seconds', sa.Integer(), nullable=True),
        sa.Column('focus_time_percentage', sa.Float(), nullable=True),
        sa.Column('focus_timeline', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('focus_distribution', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('head_direction_summary', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('summary_text', sa.Text(), nullable=True),
        sa.Column('recommendations', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['study_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id')
    )
    op.create_index(op.f('ix_reports_session_id'), 'reports', ['session_id'], unique=True)
    op.create_index(op.f('ix_reports_user_id'), 'reports', ['user_id'], unique=False)
    op.create_index(op.f('ix_reports_generated_at'), 'reports', ['generated_at'], unique=False)


def downgrade() -> None:
    op.drop_table('reports')
    op.drop_table('focus_logs')
    op.drop_table('study_sessions')
    op.drop_table('users')
