"""API routes for Geography Quiz.

SRP: Only handles HTTP request/response.
No business logic - delegates to services.
DIP: Receives services via dependency injection.
"""
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.api.schemas import (
    AnswerRequest,
    AnswerResult,
    LeaderboardEntryResponse,
    LeaderboardResponse,
    QuestionResponse,
    RoundResponse,
    RoundSummary,
    ScoreSubmitRequest,
    ScoreSubmitResponse,
    SuggestedQuestionRequest,
)
from src.database import get_db
from src.logger import get_logger
from src.models.question import Question
from src.models.round import Round
from src.models.suggested_question import SuggestedQuestion
from src.services.game import GameService
from src.services.leaderboard import LeaderboardService
from src.services.scoring import is_correct_answer
from src.utils.validators import validate_player_name

logger = get_logger(__name__)

router = APIRouter()


def get_game_service(db: Session = Depends(get_db)) -> GameService:
    """Dependency injection for GameService."""
    return GameService(db=db)


def get_leaderboard_service(db: Session = Depends(get_db)) -> LeaderboardService:
    """Dependency injection for LeaderboardService."""
    return LeaderboardService(db=db)


@router.get("/questions", response_model=RoundResponse)
def get_question(
    player_name: str = Query(
        ...,
        min_length=2,
        max_length=20,
        description="Player name",
    ),
    round_id: str | None = Query(
        None,
        description="Existing round ID (optional)",
    ),
    mode: str = Query(
        "standard",
        description="Game mode",
    ),
    category: str | None = Query(
        None,
        description="Question category filter (optional)",
    ),
    db: Session = Depends(get_db),
    game_service: GameService = Depends(get_game_service),
) -> RoundResponse:
    """Start a new round or get next question for existing round.

    Args:
        player_name: Player name (required for new rounds)
        round_id: Existing round ID (optional, for continuing rounds)
        mode: Game mode (default: "standard")
        category: Question category filter (optional)
        db: Database session (injected)
        game_service: Game service (injected)

    Returns:
        RoundResponse with round_id and question

    Raises:
        HTTPException: 400 if player name invalid, 404 if round not found,
                      409 if round complete, 400 if no questions available
    """
    log = logger.bind(player_name=player_name)

    # Validate player name
    is_valid, error = validate_player_name(player_name)
    if not is_valid:
        log.warning("Invalid player name", error=error)
        raise HTTPException(status_code=400, detail=error)

    if round_id:
        # Continue existing round
        log.info("Getting next question for existing round")
        round_obj = game_service.get_round_summary(round_id)

        if not round_obj:
            log.warning("Round not found")
            raise HTTPException(status_code=404, detail="Round not found")

        if round_obj.is_complete:
            log.warning("Round already complete")
            raise HTTPException(status_code=409, detail="Round already complete")

        question = game_service.get_next_question(round_obj, category=category)
        if not question:
            log.warning("No more questions available")
            raise HTTPException(status_code=400, detail="No more questions available")

        return RoundResponse(
            round_id=round_obj.id,
            question_number=len(round_obj.answers) + 1,
            total_questions=10,
            question=QuestionResponse.model_validate(question),
            timer_starts_at=datetime.now(UTC),
            mode=round_obj.mode,
            category=round_obj.category,
        )

    # Start new round
    log.info("Starting new round", mode=mode, category=category)
    round_obj, question = game_service.start_round(
        player_name=player_name.strip(),
        mode=mode,
        category=category,
    )

    return RoundResponse(
        round_id=round_obj.id,
        question_number=1,
        total_questions=10,
        question=QuestionResponse.model_validate(question),
        timer_starts_at=datetime.now(UTC),
        mode=mode,
        category=category,
    )


@router.post("/answers", response_model=AnswerResult)
def submit_answer(
    request: AnswerRequest,
    db: Session = Depends(get_db),
    game_service: GameService = Depends(get_game_service),
) -> AnswerResult:
    """Submit an answer for the current question.
    
    Args:
        request: Answer submission request
        db: Database session (injected)
        game_service: Game service (injected)
        
    Returns:
        AnswerResult with distance, score, and feedback
        
    Raises:
        HTTPException: 404 if round/question not found, 409 if round complete
    """
    log = logger.bind(round_id=request.round_id, question_id=request.question_id)
    log.info("Submitting answer")

    # Get round
    round_obj = db.get(Round, request.round_id)
    if not round_obj:
        log.warning("Round not found")
        raise HTTPException(status_code=404, detail="Round not found")

    if round_obj.is_complete:
        log.warning("Round already complete")
        raise HTTPException(status_code=409, detail="Round already complete")

    # Get question
    question = db.get(Question, request.question_id)
    if not question:
        log.warning("Question not found")
        raise HTTPException(status_code=404, detail="Question not found")

    # Submit answer (service handles scoring)
    answer = game_service.submit_answer(
        round_obj=round_obj,
        question=question,
        clicked_lat=request.clicked_lat,
        clicked_lon=request.clicked_lon,
        time_taken=request.time_taken,
    )

    log.info(
        "Answer processed",
        distance_km=answer.distance_km,
        final_score=answer.final_score,
    )

    next_available = len(round_obj.answers) < 10

    return AnswerResult(
        question_id=question.id,
        question_text=question.text,
        correct={
            "latitude": question.latitude,
            "longitude": question.longitude,
            "location_name": question.text,
        },
        your_answer={
            "latitude": answer.clicked_lat,
            "longitude": answer.clicked_lon,
        },
        distance_km=answer.distance_km,
        time_taken=answer.time_taken,
        base_points=answer.base_points,
        speed_multiplier=answer.speed_multiplier,
        final_score=answer.final_score,
        is_correct=is_correct_answer(answer.distance_km, question.difficulty),
        next_question_available=next_available,
    )


@router.get("/rounds/{round_id}", response_model=RoundSummary)
def get_round_summary(
    round_id: str,
    db: Session = Depends(get_db),
    game_service: GameService = Depends(get_game_service),
) -> RoundSummary:
    """Get summary of a round with all answers.
    
    Args:
        round_id: Round ID
        db: Database session (injected)
        game_service: Game service (injected)
        
    Returns:
        RoundSummary with all answer details
        
    Raises:
        HTTPException: 404 if round not found, 500 on error
    """
    log = logger.bind(round_id=round_id)
    log.info("Getting round summary")

    round_obj = game_service.get_round_summary(round_id)

    if not round_obj:
        log.warning("Round not found")
        raise HTTPException(status_code=404, detail="Round not found")

    try:
        # Build answer results
        answer_results = []
        for answer in round_obj.answers:
            question = db.get(Question, answer.question_id)
            if question:
                answer_results.append({
                    "question_id": answer.question_id,
                    "question_text": question.text,
                    "correct": {
                        "latitude": question.latitude,
                        "longitude": question.longitude,
                        "location_name": question.text,
                    },
                    "your_answer": {
                        "latitude": answer.clicked_lat,
                        "longitude": answer.clicked_lon,
                    },
                    "distance_km": answer.distance_km,
                    "time_taken": answer.time_taken,
                    "base_points": answer.base_points,
                    "speed_multiplier": answer.speed_multiplier,
                    "final_score": answer.final_score,
                    "is_correct": is_correct_answer(answer.distance_km, question.difficulty),
                    "next_question_available": len(round_obj.answers) < 10,
                })

        summary_data = {
            "round_id": round_obj.id,
            "player_name": round_obj.player_name,
            "started_at": round_obj.started_at,
            "completed_at": round_obj.completed_at,
            "is_complete": round_obj.is_complete,
            "questions_answered": len(round_obj.answers),
            "total_score": round_obj.total_score,
            "answers": answer_results,
        }

        log.info(
            "Round summary retrieved",
            score=round_obj.total_score,
            answers=len(answer_results),
        )

        return RoundSummary(**summary_data)

    except Exception as e:
        log.exception("Failed to build round summary", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rounds/{round_id}/complete")
def complete_round(
    round_id: str,
    db: Session = Depends(get_db),
    game_service: GameService = Depends(get_game_service),
) -> dict:
    """Mark a round as complete (for timed/endless modes).

    Args:
        round_id: Round ID to complete
        db: Database session (injected)
        game_service: Game service (injected)

    Returns:
        Success message with round_id and total_score

    Raises:
        HTTPException: 404 if round not found
    """
    log = logger.bind(round_id=round_id)
    log.info("Completing round")

    round_obj = db.get(Round, round_id)

    if not round_obj:
        log.warning("Round not found")
        raise HTTPException(status_code=404, detail="Round not found")

    # Mark round as complete
    round_obj.is_complete = True
    round_obj.completed_at = datetime.now(UTC)
    # total_score is already updated via add_answer()

    db.commit()

    log.info(
        "Round completed",
        total_score=round_obj.total_score,
        questions_answered=len(round_obj.answers),
    )

    return {
        "success": True,
        "round_id": round_id,
        "total_score": round_obj.total_score,
    }


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    mode: str = Query(
        "standard",
        description="Game mode to filter by",
    ),
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service),
) -> LeaderboardResponse:
    """Get top 10 leaderboard entries.

    Args:
        mode: Game mode to filter by (default: "standard")
        leaderboard_service: Leaderboard service (injected)

    Returns:
        LeaderboardResponse with top 10 entries
    """
    logger.info("Getting leaderboard", mode=mode)
    entries = leaderboard_service.get_top_10(mode=mode)

    return LeaderboardResponse(
        entries=[
            LeaderboardEntryResponse(
                rank=i + 1,
                player_name=entry.player_name,
                total_score=entry.total_score,
                submitted_at=entry.submitted_at,
            )
            for i, entry in enumerate(entries)
        ]
    )


@router.post("/leaderboard", response_model=ScoreSubmitResponse)
def submit_score(
    request: ScoreSubmitRequest,
    leaderboard_service: LeaderboardService = Depends(get_leaderboard_service),
) -> ScoreSubmitResponse:
    """Submit a completed round's score to the leaderboard.

    Args:
        request: Score submission request
        leaderboard_service: Leaderboard service (injected)

    Returns:
        ScoreSubmitResponse with rank and message

    Raises:
        HTTPException: 400 if round not complete, 409 if already submitted/too low
    """
    log = logger.bind(round_id=request.round_id)
    log.info("Submitting score to leaderboard", mode=request.mode)

    success, rank, message, qualified = leaderboard_service.submit_score(
        request.round_id,
        mode=request.mode,
    )

    if not success:
        status_code = 400 if "not complete" in message else 409
        log.warning("Score submission failed", reason=message)
        raise HTTPException(status_code=status_code, detail=message)

    log.info("Score submitted successfully", rank=rank)

    return ScoreSubmitResponse(
        success=True,
        rank=rank,
        message=message,
        qualified=qualified,
    )


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
) -> list[str]:
    """Get list of available question categories.

    Returns:
        List of distinct category names (excluding null values)
    """
    logger.info("Getting available categories")

    from sqlalchemy import distinct, select

    stmt = (
        select(distinct(Question.category))
        .where(Question.category.isnot(None))
        .order_by(Question.category)
    )
    categories = db.execute(stmt).scalars().all()

    return list(categories)


@router.post("/questions/suggest")
def suggest_question(
    request: SuggestedQuestionRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Submit a question suggestion for review.

    Args:
        request: Suggested question data
        db: Database session (injected)

    Returns:
        Success message
    """
    log = logger.bind(player_name=request.player_name)
    log.info("Received question suggestion")

    suggested_question = SuggestedQuestion(
        player_name=request.player_name,
        question_text=request.question_text,
        latitude=request.latitude,
        longitude=request.longitude,
        hint=request.hint,
        category=request.category,
        status="pending",
    )

    db.add(suggested_question)
    db.commit()

    log.info("Question suggestion saved for review")

    return {"success": True, "message": "Question submitted for review"}
