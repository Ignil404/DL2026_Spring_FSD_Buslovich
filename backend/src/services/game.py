"""Game service: Manages rounds and question flow."""
import random
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from src.models.round import Round
from src.models.question import Question
from src.models.answer import Answer
from src.services.scoring import haversine_distance, calculate_score


class GameService:
    """Service for managing game rounds."""
    
    QUESTIONS_PER_ROUND = 10
    
    def __init__(self, db: Session):
        self.db = db
    
    def start_round(self, player_name: str) -> tuple[Round, Question]:
        """
        Start a new round and return the first question.
        
        Args:
            player_name: Name of the player
        
        Returns:
            Tuple of (Round, first Question)
        """
        # Create new round
        round = Round(player_name=player_name)
        self.db.add(round)
        self.db.commit()
        self.db.refresh(round)
        
        # Get random question
        question = self._get_random_question(exclude_ids=[])
        
        return round, question
    
    def get_next_question(self, round: Round) -> Question | None:
        """
        Get the next question for a round.

        Args:
            round: The current round

        Returns:
            Next question or None if round is complete
        """
        if round.is_complete:
            return None

        # Get IDs of already answered questions in this round
        # Ensure we have the answers loaded by querying with joinedload
        round_with_answers = self.db.query(Round).options(
            joinedload(Round.answers)
        ).filter(Round.id == round.id).first()
        
        if not round_with_answers:
            return None
        
        # Get list of question IDs already used in this round
        used_question_ids = [answer.question_id for answer in round_with_answers.answers]
        print(f"[DEBUG] get_next_question: {len(used_question_ids)} questions already used in round {round.id}")
        print(f"[DEBUG] Used question IDs: {used_question_ids}")

        if len(used_question_ids) >= self.QUESTIONS_PER_ROUND:
            round.is_complete = True
            round.completed_at = datetime.utcnow()
            self.db.commit()
            return None

        # Get next question excluding already used ones
        return self._get_random_question(exclude_ids=used_question_ids)
    
    def submit_answer(
        self,
        round: Round,
        question: Question,
        clicked_lat: float,
        clicked_lon: float,
        time_taken: float
    ) -> Answer:
        """
        Submit an answer and calculate score.
        
        Args:
            round: The current round
            question: The question being answered
            clicked_lat: User's clicked latitude
            clicked_lon: User's clicked longitude
            time_taken: Time taken to answer in seconds
        
        Returns:
            Answer object with calculated scores
        """
        # Calculate distance
        distance = haversine_distance(
            clicked_lat, clicked_lon,
            question.latitude, question.longitude
        )
        
        # Calculate score
        base_points, speed_multiplier, final_score = calculate_score(
            distance,
            time_taken,
            question.time_limit
        )
        
        # Create answer
        answer = Answer(
            round_id=round.id,
            question_id=question.id,
            clicked_lat=clicked_lat,
            clicked_lon=clicked_lon,
            distance_km=distance,
            time_taken=time_taken,
            base_points=base_points,
            speed_multiplier=speed_multiplier,
            final_score=final_score
        )
        
        # Add to round
        round.add_answer(answer)
        self.db.add(answer)
        self.db.commit()
        self.db.refresh(answer)
        
        return answer
    
    def _get_random_question(self, exclude_ids: list[int]) -> Question:
        """Get a random question excluding already answered ones."""
        query = self.db.query(Question)
        if exclude_ids:
            query = query.filter(~Question.id.in_(exclude_ids))
        
        questions = query.all()
        if not questions:
            raise ValueError("No questions available in database")
        
        return random.choice(questions)
    
    def get_round_summary(self, round_id: str) -> Round | None:
        """Get a round with all answers."""
        return self.db.query(Round).filter(Round.id == round_id).first()
