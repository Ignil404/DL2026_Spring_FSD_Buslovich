"""Round model for game sessions."""
from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship, validates
from datetime import datetime
import uuid
from src.database import Base


def generate_uuid():
    """Generate a UUID string for round IDs."""
    return str(uuid.uuid4())


class Round(Base):
    """Represents a complete game session (10 questions)."""
    
    __tablename__ = "rounds"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    player_name = Column(String(20), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_score = Column(Integer, default=0)
    is_complete = Column(Boolean, default=False)
    
    # Relationships
    answers = relationship("Answer", back_populates="round", cascade="all, delete-orphan")
    leaderboard_entry = relationship("LeaderboardEntry", back_populates="round", uselist=False)
    
    @validates('player_name')
    def validate_player_name(self, key, value):
        if not value or len(value) < 2 or len(value) > 20:
            raise ValueError("Player name must be 2-20 characters")
        # Allow alphanumeric and spaces only
        if not all(c.isalnum() or c.isspace() for c in value):
            raise ValueError("Player name can only contain letters, numbers, and spaces")
        return value.strip()
    
    def add_answer(self, answer):
        """Add an answer to the round and update total score."""
        self.answers.append(answer)
        self.total_score += answer.final_score
        
        # Mark complete if 10 answers
        if len(self.answers) >= 10:
            self.is_complete = True
            self.completed_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "player_name": self.player_name,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "is_complete": self.is_complete,
            "questions_answered": len(self.answers),
            "total_score": self.total_score,
            "answers": [answer.to_dict() for answer in self.answers]
        }
