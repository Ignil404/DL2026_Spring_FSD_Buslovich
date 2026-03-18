"""Leaderboard model for high scores."""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship, validates

from src.database import Base


class LeaderboardEntry(Base):
    """Represents a submitted score in the global leaderboard."""

    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, autoincrement=True)
    round_id = Column(
        String(36),
        ForeignKey("rounds.id"),
        unique=True,
        nullable=False,
    )
    player_name = Column(String(20), nullable=False)
    total_score = Column(
        Integer,
        nullable=False,
        index=True,  # Index for leaderboard queries
    )
    mode = Column(String(20), default="standard", nullable=False, index=True)
    submitted_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True,  # Index for time-based queries
    )

    # Relationship
    round = relationship("Round", back_populates="leaderboard_entry")

    # Ensure round_id is unique (one submission per round)
    __table_args__ = (
        UniqueConstraint('round_id', name='uq_leaderboard_round'),
        Index(
            'idx_leaderboard_score',
            'total_score',
            mysql_length=10,  # Index for ORDER BY score DESC
        ),
    )

    @validates('player_name')
    def validate_player_name(self, key, value):
        if not value or len(value) < 2 or len(value) > 20:
            raise ValueError("Player name must be 2-20 characters")
        if not all(c.isalnum() or c.isspace() for c in value):
            raise ValueError("Player name can only contain letters, numbers, and spaces")
        return value.strip()

    @validates('total_score')
    def validate_score(self, key, value):
        if value < 0:
            raise ValueError("Score cannot be negative")
        return value

    def to_dict(self, rank=None):
        """Convert to dictionary for API responses."""
        result = {
            "player_name": self.player_name,
            "total_score": self.total_score,
            "submitted_at": self.submitted_at.isoformat(),
        }
        if rank is not None:
            result["rank"] = rank
        return result
