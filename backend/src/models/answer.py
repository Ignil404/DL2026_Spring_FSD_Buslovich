"""Answer model for user responses."""
from datetime import datetime

from sqlalchemy import CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from src.database import Base


class Answer(Base):
    """Represents a user's response to a single question."""

    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    round_id = Column(
        String(36),
        ForeignKey("rounds.id"),
        nullable=False,
        index=True,  # Index for round lookups
    )
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    clicked_lat = Column(Float, nullable=False)
    clicked_lon = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    time_taken = Column(Float, nullable=False)  # seconds
    base_points = Column(Integer, nullable=False)
    speed_multiplier = Column(Float, nullable=False)
    final_score = Column(Integer, nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    round = relationship("Round", back_populates="answers")
    question = relationship("Question")

    __table_args__ = (
        # Validate coordinates
        CheckConstraint('clicked_lat >= -90 AND clicked_lat <= 90', name='check_clicked_lat'),
        CheckConstraint('clicked_lon >= -180 AND clicked_lon <= 180', name='check_clicked_lon'),
        # Validate distance and time
        CheckConstraint('distance_km >= 0', name='check_distance'),
        CheckConstraint('time_taken >= 0', name='check_time_taken'),
        # Validate scores
        CheckConstraint(
            'base_points >= 0',
            name='check_base_points',
        ),
        CheckConstraint(
            'speed_multiplier >= 0 AND speed_multiplier <= 1',
            name='check_speed_multiplier',
        ),
        CheckConstraint('final_score >= 0', name='check_final_score'),
        Index('idx_answers_round', 'round_id'),  # Index for round answer lookups
    )

    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            "question_id": self.question_id,
            "clicked_lat": self.clicked_lat,
            "clicked_lon": self.clicked_lon,
            "distance_km": round(self.distance_km, 2),
            "time_taken": round(self.time_taken, 2),
            "base_points": self.base_points,
            "speed_multiplier": round(self.speed_multiplier, 2),
            "final_score": self.final_score,
        }
