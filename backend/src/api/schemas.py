"""Pydantic schemas for API request/response validation."""
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

# ============= Question Schemas =============

class QuestionResponse(BaseModel):
    """Question data sent to client (excludes coordinates)."""
    id: int
    text: str
    location_type: str
    hint: str | None = None
    time_limit: int
    difficulty: str

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    """Schema for creating a question (admin only)."""
    text: str = Field(..., min_length=1, max_length=500)
    location_type: str = Field(..., pattern="^(country|city|landmark)$")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    hint: str | None = Field(None, max_length=200)
    time_limit: int = Field(..., ge=30, le=60)


# ============= Round Schemas =============

class RoundStartRequest(BaseModel):
    """Request to start a new round."""
    player_name: str = Field(..., min_length=2, max_length=20)

    @field_validator('player_name')
    @classmethod
    def validate_player_name(cls, v):
        if not all(c.isalnum() or c.isspace() for c in v):
            raise ValueError("Player name can only contain letters, numbers, and spaces")
        return v.strip()


class RoundResponse(BaseModel):
    """Round data with question."""
    round_id: str
    question_number: int
    total_questions: int = 10
    question: QuestionResponse
    timer_starts_at: datetime


class RoundSummary(BaseModel):
    """Complete round summary."""
    round_id: str
    player_name: str
    started_at: datetime
    completed_at: datetime | None = None
    is_complete: bool
    questions_answered: int
    total_score: int
    answers: list["AnswerResult"]


# ============= Answer Schemas =============

class AnswerRequest(BaseModel):
    """Submit an answer."""
    round_id: str
    question_id: int
    clicked_lat: float = Field(..., ge=-90, le=90)
    clicked_lon: float = Field(..., ge=-180, le=180)


class AnswerResult(BaseModel):
    """Result of an answer submission."""
    question_id: int
    question_text: str
    correct: dict  # {latitude, longitude, location_name}
    your_answer: dict  # {latitude, longitude}
    distance_km: float
    time_taken: float
    base_points: int
    speed_multiplier: float
    final_score: int
    is_correct: bool  # True if within acceptable distance
    next_question_available: bool


# ============= Leaderboard Schemas =============

class LeaderboardEntryResponse(BaseModel):
    """Leaderboard entry."""
    rank: int
    player_name: str
    total_score: int
    submitted_at: datetime


class LeaderboardResponse(BaseModel):
    """Leaderboard with top entries."""
    entries: list[LeaderboardEntryResponse]


class ScoreSubmitRequest(BaseModel):
    """Request to submit score to leaderboard."""
    round_id: str


class ScoreSubmitResponse(BaseModel):
    """Response after score submission."""
    success: bool
    rank: int | None = None
    message: str
    qualified: bool


# ============= Error Schemas =============

class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    code: str | None = None
    field_errors: list[dict] | None = None
