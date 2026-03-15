"""Leaderboard service for managing high scores.

SRP: Only handles leaderboard operations (submit scores, get top N).
"""

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from src.logger import get_logger
from src.models.leaderboard import LeaderboardEntry
from src.models.round import Round

logger = get_logger(__name__)


class LeaderboardService:
    """Service for managing leaderboard operations.
    
    Dependencies:
        db: Database session
    """

    TOP_N: int = 10

    def __init__(self, db: Session):
        self.db = db

    def submit_score(
        self,
        round_id: str,
    ) -> tuple[bool, int | None, str, bool]:
        """Submit a completed round's score to the leaderboard.
        
        Args:
            round_id: ID of the completed round
            
        Returns:
            Tuple of (success, rank, message, qualified)
        """
        log = logger.bind(round_id=round_id)
        log.info("Attempting to submit score to leaderboard")

        # Get the round
        round_obj = self.db.get(Round, round_id)

        if not round_obj:
            log.warning("Round not found for leaderboard submission")
            return False, None, "Round not found", False

        if not round_obj.is_complete:
            log.warning("Round not complete", answers=len(round_obj.answers))
            return False, None, "Round not complete", False

        # Check if already submitted
        existing = self.db.get(LeaderboardEntry, round_id)
        if existing:
            log.info("Score already submitted")
            return False, None, "Score already submitted", False

        # Get current 10th place score
        stmt = (
            select(LeaderboardEntry)
            .order_by(desc(LeaderboardEntry.total_score))
            .offset(self.TOP_N - 1)
            .limit(1)
        )
        tenth_place = self.db.execute(stmt).scalars().first()

        # Check if score qualifies
        if tenth_place and round_obj.total_score <= tenth_place.total_score:
            if round_obj.total_score < tenth_place.total_score:
                log.info(
                    "Score too low for leaderboard",
                    score=round_obj.total_score,
                    cutoff=tenth_place.total_score,
                )
                return False, None, "Score too low for top 10", False

        # Create leaderboard entry
        entry = LeaderboardEntry(
            round_id=round_id,
            player_name=round_obj.player_name,
            total_score=round_obj.total_score,
        )
        self.db.add(entry)
        log.debug("Leaderboard entry created", score=round_obj.total_score)

        # Remove lowest score if over limit
        count = self.db.query(LeaderboardEntry).count()
        if count > self.TOP_N:
            lowest_stmt = (
                select(LeaderboardEntry)
                .order_by(
                    LeaderboardEntry.total_score.asc(),
                    LeaderboardEntry.submitted_at.asc(),
                )
                .limit(1)
            )
            lowest = self.db.execute(lowest_stmt).scalars().first()
            if lowest:
                self.db.delete(lowest)
                log.debug("Removed lowest score from leaderboard")

        self.db.commit()
        self.db.refresh(entry)

        # Calculate rank
        rank_stmt = (
            select(LeaderboardEntry)
            .where(LeaderboardEntry.total_score > entry.total_score)
        )
        rank = self.db.execute(rank_stmt).scalars().count() + 1

        log.info(
            "Score submitted to leaderboard",
            rank=rank,
            score=entry.total_score,
            player=entry.player_name,
        )

        return True, rank, f"New personal best! Ranked #{rank}", True

    def get_top_10(self) -> list[LeaderboardEntry]:
        """Get top 10 leaderboard entries sorted by score.
        
        Returns:
            List of LeaderboardEntry ordered by score DESC, then submitted_at ASC
        """
        log = logger.bind()
        log.debug("Fetching top 10 leaderboard entries")

        stmt = (
            select(LeaderboardEntry)
            .order_by(
                desc(LeaderboardEntry.total_score),
                LeaderboardEntry.submitted_at.asc(),
            )
            .limit(self.TOP_N)
        )
        entries = self.db.execute(stmt).scalars().all()

        log.info("Retrieved leaderboard entries", count=len(entries))
        return entries

    def get_entry_rank(self, entry: LeaderboardEntry) -> int:
        """Calculate the rank of a leaderboard entry.
        
        Args:
            entry: The leaderboard entry
            
        Returns:
            Rank (1-based)
        """
        stmt = select(LeaderboardEntry).where(
            LeaderboardEntry.total_score > entry.total_score
        )
        higher_scores = self.db.execute(stmt).scalars().count()
        return higher_scores + 1
