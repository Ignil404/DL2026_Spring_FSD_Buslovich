"""Database initialization and configuration."""
import os
from pathlib import Path
from sqlalchemy import create_engine, Index
from sqlalchemy.orm import sessionmaker, declarative_base

# Get the database URL from environment or use default SQLite
BASE_DIR = Path(__file__).parent.parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/data.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


def get_db():
    """Dependency for FastAPI to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    # Import all models to ensure they're registered with Base
    from src.models import question, round, answer, leaderboard
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully!")


def reset_db():
    """Drop and recreate all tables."""
    from src.models import question, round, answer, leaderboard
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database reset successfully!")


def seed_questions():
    """Seed the database with sample questions."""
    from sqlalchemy.orm import Session
    from src.models.question import Question
    
    sample_questions = [
        Question(
            text="Where is France located?",
            location_type="country",
            latitude=46.603354,
            longitude=1.888334,
            difficulty="easy",
            hint="Western Europe",
            time_limit=60
        ),
        Question(
            text="Find Tokyo, the capital of Japan",
            location_type="city",
            latitude=35.6762,
            longitude=139.6503,
            difficulty="medium",
            hint="Eastern Asia",
            time_limit=45
        ),
        Question(
            text="Where is the Eiffel Tower?",
            location_type="landmark",
            latitude=48.8584,
            longitude=2.2945,
            difficulty="easy",
            hint="Paris, France",
            time_limit=60
        ),
        Question(
            text="Find Brazil on the map",
            location_type="country",
            latitude=-14.2350,
            longitude=-51.9253,
            difficulty="easy",
            hint="South America",
            time_limit=60
        ),
        Question(
            text="Where is New York City?",
            location_type="city",
            latitude=40.7128,
            longitude=-74.0060,
            difficulty="medium",
            hint="East Coast, USA",
            time_limit=45
        ),
        Question(
            text="Find the Great Wall of China",
            location_type="landmark",
            latitude=40.4319,
            longitude=116.5704,
            difficulty="medium",
            hint="Northern China",
            time_limit=45
        ),
        Question(
            text="Where is Australia?",
            location_type="country",
            latitude=-25.2744,
            longitude=133.7751,
            difficulty="easy",
            hint="Southern Hemisphere",
            time_limit=60
        ),
        Question(
            text="Find London, United Kingdom",
            location_type="city",
            latitude=51.5074,
            longitude=-0.1278,
            difficulty="medium",
            hint="Western Europe",
            time_limit=45
        ),
        Question(
            text="Where is the Statue of Liberty?",
            location_type="landmark",
            latitude=40.6892,
            longitude=-74.0445,
            difficulty="easy",
            hint="New York Harbor, USA",
            time_limit=60
        ),
        Question(
            text="Find Egypt on the map",
            location_type="country",
            latitude=26.8206,
            longitude=30.8025,
            difficulty="medium",
            hint="Northeastern Africa",
            time_limit=45
        ),
    ]
    
    db = SessionLocal()
    try:
        if db.query(Question).count() > 0:
            print("Questions already seeded, skipping seeding.")
            return
        else:
            print("Seeding questions...")
            db.add_all(sample_questions)
            db.commit()
            print(f"Seeded {len(sample_questions)} questions successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_questions()
