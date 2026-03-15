"""Leaderboard service: Manages high scores."""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from src.models.leaderboard import LeaderboardEntry
from src.models.round import Round


class LeaderboardService:
    """Service for managing leaderboard."""
    
    TOP_N = 10
    
    def __init__(self, db: Session):
        self.db = db
    
    def submit_score(self, round_id: str) -> tuple[bool, int | None, str, bool]:
        """
        Submit a completed round's score to the leaderboard.
        
        Args:
            round_id: ID of the completed round
        
        Returns:
            Tuple of (success, rank, message, qualified)
        """
        # Get the round
        round = self.db.query(Round).filter(Round.id == round_id).first()
        if not round:
            return False, None, "Round not found", False
        
        if not round.is_complete:
            return False, None, "Round not complete", False
        
        # Check if already submitted
        existing = self.db.query(LeaderboardEntry).filter(
            LeaderboardEntry.round_id == round_id
        ).first()
        if existing:
            return False, None, "Score already submitted", False
        
        # Get current 10th place score (if exists)
        tenth_place = self.db.query(LeaderboardEntry).order_by(
            desc(LeaderboardEntry.total_score)
        ).offset(self.TOP_N - 1).first()
        
        # Check if score qualifies
        if tenth_place and round.total_score <= tenth_place.total_score:
            # Check tie-breaker (submission time)
            if round.total_score < tenth_place.total_score:
                return False, None, "Score too low for top 10", False
        
        # Create leaderboard entry
        entry = LeaderboardEntry(
            round_id=round_id,
            player_name=round.player_name,
            total_score=round.total_score
        )
        self.db.add(entry)
        
        # Remove lowest score if we have more than 10
        count = self.db.query(LeaderboardEntry).count()
        if count > self.TOP_N:
            lowest = self.db.query(LeaderboardEntry).order_by(
                LeaderboardEntry.total_score.asc(),
                LeaderboardEntry.submitted_at.asc()
            ).first()
            if lowest:
                self.db.delete(lowest)
        
        self.db.commit()
        self.db.refresh(entry)
        
        # Calculate rank
        rank = self.db.query(LeaderboardEntry).filter(
            LeaderboardEntry.total_score > entry.total_score
        ).count() + 1
        
        return True, rank, f"New personal best! Ranked #{rank}", True
    
    def get_top_10(self) -> list[LeaderboardEntry]:
        """Get top 10 leaderboard entries."""
        entries = self.db.query(LeaderboardEntry).order_by(
            desc(LeaderboardEntry.total_score),
            LeaderboardEntry.submitted_at.asc()
        ).limit(self.TOP_N).all()
        
        return entries
    
    def get_entry_rank(self, entry: LeaderboardEntry) -> int:
        """Calculate the rank of an entry."""
        higher_scores = self.db.query(LeaderboardEntry).filter(
            LeaderboardEntry.total_score > entry.total_score
        ).count()
        return higher_scores + 1
