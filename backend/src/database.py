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

if __name__ == "__main__":
    sys.modules["src.database"] = sys.modules["__main__"]


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
    """Create all database tables."""

    Base.metadata.create_all(bind=engine)


def reset_db() -> None:
    """Drop and recreate all tables (development only)."""

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    from src.seed_data import seed_questions

    seed_questions()
