"""Database connection and session management.

SRP: Only handles database connection and session lifecycle.
No business logic, no model imports.
"""

import os
import sys
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# Database configuration
BASE_DIR = Path(__file__).parent.parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/data.db")

# Engine configuration
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite specific
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session,
)

# Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency injection for database session.

    Yields:
        Database session that closes automatically after request.

    Usage:
        @router.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all database tables.

    Imports all models first to ensure they are registered with Base.
    """
    # Import all models to ensure they are registered with Base
    from src.logger import get_logger
    from src.models.answer import Answer  # noqa: F401
    from src.models.leaderboard import LeaderboardEntry  # noqa: F401
    from src.models.question import Question  # noqa: F401
    from src.models.round import Round  # noqa: F401
    from src.models.suggested_question import SuggestedQuestion  # noqa: F401

    logger = get_logger(__name__)

    Base.metadata.create_all(bind=engine)
    logger.info("database_initialized")


def reset_db() -> None:
    """Drop and recreate all tables (development only)."""

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    sys.modules["src.database"] = sys.modules["__main__"]
    from src.logger import get_logger
    from src.seed_data import seed_questions

    logger = get_logger(__name__)

    logger.info("initializing_database")
    init_db()
    logger.info("database_initialized")
    seed_questions()
    logger.info("database_seed_complete")
