"""Game service for managing rounds and question flow.

SRP: Only handles game flow (starting rounds, getting questions, submitting answers).
DIP: Depends on ScoringStrategy abstraction, not concrete implementation.
"""
import random
from datetime import UTC, datetime
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from src.logger import get_logger
from src.models.answer import Answer
from src.models.question import Question
from src.models.round import Round
from src.services.scoring import (
    ScoreResult,
    ScoringStrategy,
    default_scorer,
    haversine_distance,
)
from src.utils.validators import validate_coordinates

logger = get_logger(__name__)


class ScoringServiceProtocol(Protocol):
    """Protocol for scoring service dependency injection."""

    def calculate_score(
        self,
        distance_km: float,
        time_taken: float,
        time_limit: int,
    ) -> ScoreResult:
        """Calculate score from distance and time."""
        ...


class GameService:
    """Service for managing game rounds and question flow.
    
    Dependencies:
        db: Database session
        scoring_strategy: Strategy for score calculation (default: TieredScoringStrategy)
    """

    QUESTIONS_PER_ROUND: int = 10

    def __init__(
        self,
        db: Session,
        scoring_strategy: ScoringStrategy | None = None,
    ):
        self.db = db
        self.scorer = scoring_strategy or default_scorer

    def start_round(
        self,
        player_name: str,
        mode: str = "standard",
        category: str | None = None,
    ) -> tuple[Round, Question]:
        """Start a new round with the first question.

        Args:
            player_name: Name of the player
            mode: Game mode (default: "standard")
            category: Optional category filter

        Returns:
            Tuple of (created Round, first Question)
        """
        log = logger.bind(player_name=player_name)
        log.info("Starting new round", mode=mode, category=category)

        # Create round
        round_obj = Round(
            player_name=player_name.strip(),
            mode=mode,
            category=category,
        )
        self.db.add(round_obj)
        self.db.commit()
        self.db.refresh(round_obj)

        log = log.bind(round_id=round_obj.id)

        # Get first question
        question = self._get_random_question(exclude_ids=[], category=category)
        log.info(
            "Round started",
            question_id=question.id,
            difficulty=question.difficulty,
        )

        return round_obj, question

    def get_next_question(
        self,
        round_obj: Round,
        category: str | None = None,
    ) -> Question | None:
        """Get the next question for an existing round.

        Args:
            round_obj: The current round
            category: Optional category filter

        Returns:
            Next Question or None if round is complete
        """
        log = logger.bind(round_id=round_obj.id)

        if round_obj.is_complete:
            log.info("Cannot get next question - round already complete")
            return None

        # Reload round with answers
        stmt = (
            select(Round)
            .options(joinedload(Round.answers))
            .where(Round.id == round_obj.id)
        )
        round_with_answers = self.db.execute(stmt).scalars().first()

        if not round_with_answers:
            log.error("Round not found")
            return None

        # Get used question IDs
        used_ids = [a.question_id for a in round_with_answers.answers]
        log.debug("Questions answered", count=len(used_ids), ids=used_ids)

        # Only limit to 10 questions for standard mode
        # Non-standard modes (timed, endless) have unlimited questions
        is_standard_mode = round_obj.mode == "standard" or round_obj.mode is None

        if is_standard_mode and len(used_ids) >= self.QUESTIONS_PER_ROUND:
            round_obj.is_complete = True
            round_obj.completed_at = datetime.now(UTC)
            self.db.commit()
            log.info("Round completed (standard mode) - all questions answered")
            return None

        # Get next question
        question = self._get_random_question(exclude_ids=used_ids, category=category)
        log.info(
            "Next question retrieved",
            question_id=question.id,
            question_number=len(used_ids) + 1,
        )

        return question

    def submit_answer(
        self,
        round_obj: Round,
        question: Question,
        clicked_lat: float,
        clicked_lon: float,
        time_taken: float,
    ) -> Answer:
        """Submit an answer and calculate score.
        
        Args:
            round_obj: The current round
            question: The question being answered
            clicked_lat: User's clicked latitude
            clicked_lon: User's clicked longitude
            time_taken: Time taken in seconds
            
        Returns:
            Answer object with calculated scores
        """
        log = logger.bind(
            round_id=round_obj.id,
            question_id=question.id,
        )

        # Validate coordinates
        is_valid, error = validate_coordinates(clicked_lat, clicked_lon)
        if not is_valid:
            log.error("Invalid coordinates", error=error)
            raise ValueError(error)

        # Calculate distance
        distance = haversine_distance(
            clicked_lat, clicked_lon,
            question.latitude, question.longitude,
        )
        log.debug("Distance calculated", distance_km=distance)

        # Calculate score
        score_result = self.scorer.calculate_score(
            distance_km=distance,
            time_taken=time_taken,
            time_limit=question.time_limit,
        )
        log.debug(
            "Score calculated",
            base_points=score_result.base_points,
            speed_multiplier=score_result.speed_multiplier,
            final_score=score_result.final_score,
        )

        # Create answer
        answer = Answer(
            round_id=round_obj.id,
            question_id=question.id,
            clicked_lat=clicked_lat,
            clicked_lon=clicked_lon,
            distance_km=distance,
            time_taken=time_taken,
            base_points=score_result.base_points,
            speed_multiplier=score_result.speed_multiplier,
            final_score=score_result.final_score,
        )

        # Add to round
        round_obj.add_answer(answer)
        self.db.add(answer)
        self.db.commit()
        self.db.refresh(answer)

        log.info(
            "Answer submitted",
            distance_km=distance,
            final_score=score_result.final_score,
            answers_count=len(round_obj.answers),
        )

        return answer

    def _get_random_question(
        self,
        exclude_ids: list[int],
        category: str | None = None,
    ) -> Question:
        """Get a random question excluding specified IDs.

        Args:
            exclude_ids: List of question IDs to exclude
            category: Optional category filter

        Returns:
            Random Question

        Raises:
            ValueError: If no questions available
        """
        logger.info("Getting random question", category=category, exclude_ids=exclude_ids)
        
        from sqlalchemy import func

        query = select(Question)
        if exclude_ids:
            query = query.where(~Question.id.in_(exclude_ids))
        if category:
            query = query.where(func.lower(Question.category) == category.lower())

        questions = self.db.execute(query).scalars().all()
        
        # Log available questions count
        logger.info("Available questions for category", count=len(questions), category=category)

        # Fallback: if category filter returns no results, try without category
        if not questions and category:
            logger.warning(
                "No questions found for category, falling back to all",
                category=category,
            )
            query = select(Question)
            if exclude_ids:
                query = query.where(~Question.id.in_(exclude_ids))
            questions = self.db.execute(query).scalars().all()

        if not questions:
            raise ValueError("No questions available in database")

        return random.choice(questions)

    def get_round_summary(self, round_id: str) -> Round | None:
        """Get a round with all answers loaded.
        
        Args:
            round_id: Round ID
            
        Returns:
            Round with answers or None if not found
        """
        log = logger.bind(round_id=round_id)

        stmt = (
            select(Round)
            .options(joinedload(Round.answers))
            .where(Round.id == round_id)
        )
        round_obj = self.db.execute(stmt).scalars().first()

        if round_obj:
            log.debug("Round summary retrieved", answers=len(round_obj.answers))

        return round_obj
