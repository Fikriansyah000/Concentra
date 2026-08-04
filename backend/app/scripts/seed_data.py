import asyncio
from datetime import datetime, timedelta
import uuid

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.study_session import StudySession
from app.models.focus_log import FocusLog
from app.models.report import Report

async def seed_data():
    print("🌱 Starting database seeding...")
    async with AsyncSessionLocal() as session:
        # Check if demo user exists
        stmt = select(User).where(User.email == "dev@concentra.local")
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                id=uuid.uuid4(),
                email="dev@concentra.local",
                full_name="Demo Developer User",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=ConcentraDev",
                supabase_uid="dev_user_001",
                auth_provider="dev",
                is_active=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"✅ Created demo user: {user.email} (ID: {user.id})")
        else:
            print(f"ℹ️ Demo user already exists: {user.email}")

        # Check if demo session exists
        stmt = select(StudySession).where(StudySession.user_id == user.id)
        result = await session.execute(stmt)
        existing_sessions = result.scalars().all()

        if not existing_sessions:
            # Create a sample completed session
            started_at = datetime.utcnow() - timedelta(hours=2)
            ended_at = started_at + timedelta(minutes=45)

            sample_session = StudySession(
                id=uuid.uuid4(),
                user_id=user.id,
                status="completed",
                title="Belajar Calculus & Differential Equations",
                source_url="https://www.youtube.com/watch?v=demo",
                source_type="youtube",
                started_at=started_at,
                ended_at=ended_at,
                total_duration_seconds=2700,
                active_duration_seconds=2700,
                pause_count=0,
                avg_focus_score=84.5,
                min_focus_score=62.0,
                max_focus_score=96.0
            )
            session.add(sample_session)
            await session.commit()
            await session.refresh(sample_session)
            print(f"✅ Created demo session: {sample_session.title}")

            # Create sample report
            sample_report = Report(
                id=uuid.uuid4(),
                session_id=sample_session.id,
                user_id=user.id,
                total_duration_seconds=2700,
                active_duration_seconds=2700,
                avg_focus_score=84.5,
                median_focus_score=86.0,
                max_focus_score=96.0,
                min_focus_score=62.0,
                total_distractions=4,
                total_face_missing_events=1,
                longest_focus_streak_seconds=720,
                longest_distraction_seconds=30,
                focus_time_percentage=82.5,
                focus_timeline=[
                    {"time": started_at.isoformat(), "score": 88.0},
                    {"time": (started_at + timedelta(minutes=15)).isoformat(), "score": 92.0},
                    {"time": (started_at + timedelta(minutes=30)).isoformat(), "score": 65.0},
                    {"time": ended_at.isoformat(), "score": 90.0}
                ],
                focus_distribution={"high": 60.0, "medium": 30.0, "low": 10.0, "critical": 0.0},
                head_direction_summary={"front": 85.0, "left": 8.0, "right": 5.0, "down": 2.0},
                summary_text="Sesi belajar sangat produktif dengan tingkat fokus rata-rata 84.5%.",
                recommendations=[
                    "Pertahankan posisi belajar di 30 menit pertama.",
                    "Lakukan stretching singkat saat menit ke-30 untuk menghindari kelelahan."
                ]
            )
            session.add(sample_report)
            await session.commit()
            print("✅ Created demo report!")
        else:
            print("ℹ️ Sample session and report already exist.")

    print("🎉 Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
