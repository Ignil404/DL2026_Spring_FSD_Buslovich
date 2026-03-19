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
    location_type: str | None = Field(None, pattern="^(country|city|landmark)$")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    difficulty: str | None = Field(None, pattern="^(easy|medium|hard)$")
    hint: str | None = Field(None, max_length=200)
    time_limit: int = Field(..., ge=30, le=60)
    category: str | None = None


class QuestionCreateSchema(BaseModel):
    """Schema for creating a new question (auto-calculates difficulty and location_type)."""
    text: str = Field(..., min_length=1, max_length=500)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    hint: str | None = Field(None, max_length=200)
    time_limit: int = Field(..., ge=30, le=60)
    category: str = Field(..., description="Category determines location_type automatically")


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
    mode: str = "standard"
    category: str | None = None


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
    time_taken: float = Field(..., ge=0, description="Time taken to answer in seconds")


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
    mode: str = "standard"


class ScoreSubmitResponse(BaseModel):
    """Response after score submission."""
    success: bool
    rank: int | None = None
    message: str
    qualified: bool


# ============= Suggested Question Schemas =============

class SuggestedQuestionRequest(BaseModel):
    """Request to suggest a new question."""
    player_name: str
    question_text: str
    latitude: float
    longitude: float
    hint: str | None = None
    category: str | None = None


class SuggestedQuestionResponse(BaseModel):
    """Suggested question data for admin review."""
    id: int
    player_name: str
    question_text: str
    latitude: float
    longitude: float
    hint: str | None = None
    category: str | None = None
    status: str
    submitted_at: datetime

    class Config:
        from_attributes = True


class QuestionApprovalSchema(BaseModel):
    """Schema for approving a suggested question."""
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    location_type: str = Field(..., pattern="^(country|city|landmark)$")
    time_limit: int = Field(..., ge=30, le=60)
    category: str | None = None


class QuestionUpdateSchema(BaseModel):
    """Schema for updating an existing question."""
    text: str | None = Field(None, min_length=1, max_length=500)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    difficulty: str | None = Field(None, pattern="^(easy|medium|hard)$")
    location_type: str | None = Field(None, pattern="^(country|city|landmark)$")
    time_limit: int | None = Field(None, ge=30, le=60)
    category: str | None = None
    hint: str | None = Field(None, max_length=200)


class QuestionAdminResponse(BaseModel):
    """Question data for admin panel (includes coordinates)."""
    id: int
    text: str
    location_type: str
    latitude: float
    longitude: float
    difficulty: str
    hint: str | None = None
    time_limit: int
    category: str | None = None

    class Config:
        from_attributes = True


# ============= Error Schemas =============

class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    code: str | None = None
    field_errors: list[dict] | None = None
