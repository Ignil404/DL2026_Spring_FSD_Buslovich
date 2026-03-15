"""API routes for Geography Quiz."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import Annotated

from src.database import get_db
from src.api.schemas import (
    RoundStartRequest,
    RoundResponse,
    RoundSummary,
    AnswerRequest,
    AnswerResult,
    LeaderboardResponse,
    LeaderboardEntryResponse,
    ScoreSubmitRequest,
    ScoreSubmitResponse,
    QuestionResponse,
)
from src.services.game import GameService
from src.services.leaderboard import LeaderboardService
from src.models.round import Round

router = APIRouter()


# Add CORS middleware (configured in main app)
def setup_cors(app):
    """Setup CORS middleware for frontend access."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Dev URLs
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@router.get("/questions", response_model=RoundResponse)
def get_question(
    db: Annotated[Session, Depends(get_db)],
    player_name: str = Query(..., min_length=2, max_length=20, description="Player name"),
    round_id: str = Query(None, description="Existing round ID (optional)")
):
    """
    Start a new round or get next question.

    If round_id is provided, returns the next question for that round.
    If no round_id, starts a new round with the player name.
    """
    # Validate player name format
    if not all(c.isalnum() or c.isspace() for c in player_name):
        raise HTTPException(
            status_code=400,
            detail="Player name can only contain letters, numbers, and spaces"
        )

    game_service = GameService(db)

    # If round_id provided, get next question for existing round
    if round_id:
        # Use joinedload to ensure answers are loaded
        round = db.query(Round).options(
            joinedload(Round.answers)
        ).filter(Round.id == round_id).first()
        if not round:
            raise HTTPException(status_code=404, detail="Round not found")
        if round.is_complete:
            raise HTTPException(status_code=409, detail="Round already complete")

        question = game_service.get_next_question(round)
        if not question:
            raise HTTPException(status_code=400, detail="No more questions available")

        return RoundResponse(
            round_id=round.id,
            question_number=len(round.answers) + 1,
            total_questions=10,
            question=QuestionResponse.model_validate(question),
            timer_starts_at=datetime.utcnow()
        )

    # Otherwise start a new round
    round, question = game_service.start_round(player_name.strip())

    return RoundResponse(
        round_id=round.id,
        question_number=1,
        total_questions=10,
        question=QuestionResponse.model_validate(question),
        timer_starts_at=datetime.utcnow()
    )


@router.post("/answers", response_model=AnswerResult)
def submit_answer(
    request: AnswerRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Submit an answer for the current question.
    
    Calculates distance and score, returns feedback.
    """
    game_service = GameService(db)
    
    # Get the round
    round = db.query(Round).filter(Round.id == request.round_id).first()
    if not round:
        raise HTTPException(status_code=404, detail="Round not found")
    
    if round.is_complete:
        raise HTTPException(
            status_code=409,
            detail="Round already complete"
        )
    
    # Get the question
    from src.models.question import Question
    question = db.query(Question).filter(Question.id == request.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Calculate time taken (from round start for simplicity)
    # In production, track per-question timer server-side
    time_taken = 30.0  # Placeholder - should come from client
    
    # Submit answer
    answer = game_service.submit_answer(
        round=round,
        question=question,
        clicked_lat=request.clicked_lat,
        clicked_lon=request.clicked_lon,
        time_taken=time_taken
    )
    
    # Get next question availability
    next_available = len(round.answers) < 10
    
    return AnswerResult(
        question_id=question.id,
        question_text=question.text,
        correct={
            "latitude": question.latitude,
            "longitude": question.longitude,
            "location_name": question.text
        },
        your_answer={
            "latitude": answer.clicked_lat,
            "longitude": answer.clicked_lon
        },
        distance_km=answer.distance_km,
        time_taken=answer.time_taken,
        base_points=answer.base_points,
        speed_multiplier=answer.speed_multiplier,
        final_score=answer.final_score,
        is_correct=answer.distance_km < 500,  # Within 500km
        next_question_available=next_available
    )


@router.get("/rounds/{round_id}", response_model=RoundSummary)
def get_round_summary(
    round_id: str,
    db: Annotated[Session, Depends(get_db)]
):
    """Get summary of a round."""
    print(f"[DEBUG] Getting round summary for round_id: {round_id}")
    
    try:
        # Get the round
        round = db.query(Round).filter(Round.id == round_id).first()
        print(f"[DEBUG] Round found: {round is not None}")
        
        if not round:
            print(f"[DEBUG] Round not found: {round_id}")
            raise HTTPException(status_code=404, detail="Round not found")

        # Build answer results manually
        from src.models.question import Question
        answer_results = []
        for answer in round.answers:
            question = db.query(Question).filter(Question.id == answer.question_id).first()
            if question:
                answer_results.append({
                    "question_id": answer.question_id,
                    "question_text": question.text,
                    "correct": {
                        "latitude": question.latitude,
                        "longitude": question.longitude,
                        "location_name": question.text
                    },
                    "your_answer": {
                        "latitude": answer.clicked_lat,
                        "longitude": answer.clicked_lon
                    },
                    "distance_km": answer.distance_km,
                    "time_taken": answer.time_taken,
                    "base_points": answer.base_points,
                    "speed_multiplier": answer.speed_multiplier,
                    "final_score": answer.final_score,
                    "is_correct": answer.distance_km < 500,
                    "next_question_available": len(round.answers) < 10
                })
        
        print(f"[DEBUG] Built {len(answer_results)} answer results")
        
        # Build the summary dict
        summary_data = {
            "round_id": round.id,
            "player_name": round.player_name,
            "started_at": round.started_at,
            "completed_at": round.completed_at,
            "is_complete": round.is_complete,
            "questions_answered": len(round.answers),
            "total_score": round.total_score,
            "answers": answer_results
        }
        
        print(f"[DEBUG] Returning summary: {summary_data}")
        return RoundSummary(**summary_data)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to get round summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(db: Annotated[Session, Depends(get_db)]):
    """Get top 10 leaderboard entries."""
    leaderboard_service = LeaderboardService(db)
    entries = leaderboard_service.get_top_10()
    
    return LeaderboardResponse(
        entries=[
            LeaderboardEntryResponse(
                rank=i + 1,
                player_name=entry.player_name,
                total_score=entry.total_score,
                submitted_at=entry.submitted_at
            )
            for i, entry in enumerate(entries)
        ]
    )


@router.post("/leaderboard", response_model=ScoreSubmitResponse)
def submit_score(
    request: ScoreSubmitRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """Submit a completed round's score to the leaderboard."""
    leaderboard_service = LeaderboardService(db)
    
    success, rank, message, qualified = leaderboard_service.submit_score(
        request.round_id
    )
    
    if not success:
        status_code = 400 if "not complete" in message else 409
        raise HTTPException(status_code=status_code, detail=message)
    
    return ScoreSubmitResponse(
        success=True,
        rank=rank,
        message=message,
        qualified=qualified
    )
