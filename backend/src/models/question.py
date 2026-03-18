"""Question model for geography challenges."""
from datetime import datetime

from sqlalchemy import CheckConstraint, Column, DateTime, Float, Integer, String
from sqlalchemy.orm import validates

from src.database import Base


class Question(Base):
    """Represents a geography challenge in the game."""

    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    text = Column(String(500), nullable=False)
    location_type = Column(String(20), nullable=False)  # country, city, landmark
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    difficulty = Column(String(20), nullable=False)  # easy, medium, hard
    hint = Column(String(200), nullable=True)
    time_limit = Column(Integer, nullable=False)  # 30, 45, or 60 seconds
    category = Column(String(50), nullable=True, index=True)  # countries, cities, landmarks
    created_at = Column(DateTime, default=datetime.utcnow)

    # Validation constraints
    __table_args__ = (
        CheckConstraint('latitude >= -90 AND latitude <= 90', name='check_latitude'),
        CheckConstraint('longitude >= -180 AND longitude <= 180', name='check_longitude'),
        CheckConstraint('time_limit IN (30, 45, 60)', name='check_time_limit'),
        CheckConstraint(
            "location_type IN ('country', 'city', 'landmark')",
            name='check_location_type'
        ),
        CheckConstraint(
            "difficulty IN ('easy', 'medium', 'hard')",
            name='check_difficulty'
        ),
    )

    @validates('text')
    def validate_text(self, key, value):
        if not value or len(value) > 500:
            raise ValueError("Question text must be 1-500 characters")
        return value

    @validates('hint')
    def validate_hint(self, key, value):
        if value and len(value) > 200:
            raise ValueError("Hint must be 200 characters or less")
        return value

    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "text": self.text,
            "location_type": self.location_type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "difficulty": self.difficulty,
            "hint": self.hint,
            "time_limit": self.time_limit,
            "category": self.category,
        }
