"""SuggestedQuestion model for user-submitted questions."""
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from src.database import Base


class SuggestedQuestion(Base):
    """Represents a user-submitted question suggestion."""

    __tablename__ = "suggested_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_name = Column(String(20), nullable=False)
    question_text = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    hint = Column(String(200), nullable=True)
    category = Column(String(50), nullable=True)
    status = Column(String(20), default="pending")
    submitted_at = Column(DateTime, default=lambda: datetime.now(UTC))
