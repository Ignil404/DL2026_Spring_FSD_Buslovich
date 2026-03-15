"""Scoring service with Haversine distance calculation.

SRP: Only handles scoring calculations.
OCP: Extensible via ScoringStrategy interface for new scoring algorithms.
KISS: Simple tier-based scoring, no over-engineering.
"""
import math
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Final

from src.logger import get_logger

logger = get_logger(__name__)


# Constants
EARTH_RADIUS_KM: Final = 6371.0


@dataclass(frozen=True)
class ScoreResult:
    """Immutable score calculation result."""
    base_points: int
    speed_multiplier: float
    final_score: int
    distance_km: float


class ScoringStrategy(ABC):
    """Abstract base for scoring strategies (OCP).
    
    Extend this class to implement new scoring algorithms
    without modifying existing code.
    """

    @abstractmethod
    def calculate_score(
        self,
        distance_km: float,
        time_taken: float,
        time_limit: int,
    ) -> ScoreResult:
        """Calculate score based on distance and time.
        
        Args:
            distance_km: Distance from correct answer in km
            time_taken: Time taken to answer in seconds
            time_limit: Maximum time allowed in seconds
            
        Returns:
            ScoreResult with all scoring details
        """
        pass


class TieredScoringStrategy(ScoringStrategy):
    """Default tier-based scoring strategy.
    
    Accuracy tiers:
    - < 100 km:  1000 points
    - < 500 km:  500 points
    - < 1000 km: 250 points
    - < 5000 km: 100 points
    - >= 5000 km: 0 points
    
    Speed multiplier: time_remaining / time_limit (0.0 to 1.0)
    """

    # Tier thresholds in km
    TIER_1000: Final = 100
    TIER_500: Final = 500
    TIER_250: Final = 1000
    TIER_100: Final = 5000

    def calculate_score(
        self,
        distance_km: float,
        time_taken: float,
        time_limit: int,
    ) -> ScoreResult:
        """Calculate score using tiered accuracy + speed multiplier."""
        # Calculate base points from accuracy tier
        base_points = self._get_accuracy_tier(distance_km)

        # Calculate speed multiplier (0.0 to 1.0)
        speed_multiplier = self._calculate_speed_multiplier(time_taken, time_limit)

        # Calculate final score
        final_score = round(base_points * speed_multiplier)

        return ScoreResult(
            base_points=base_points,
            speed_multiplier=speed_multiplier,
            final_score=final_score,
            distance_km=distance_km,
        )

    def _get_accuracy_tier(self, distance_km: float) -> int:
        """Get base points from accuracy tier."""
        if distance_km < self.TIER_1000:
            return 1000
        elif distance_km < self.TIER_500:
            return 500
        elif distance_km < self.TIER_250:
            return 250
        elif distance_km < self.TIER_100:
            return 100
        else:
            return 0

    def _calculate_speed_multiplier(
        self,
        time_taken: float,
        time_limit: int,
    ) -> float:
        """Calculate speed multiplier from time remaining."""
        if time_limit <= 0:
            return 0.0

        time_remaining = max(0.0, time_limit - time_taken)
        return time_remaining / time_limit


# Default instance for use throughout the app
default_scorer = TieredScoringStrategy()


def haversine_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """Calculate great-circle distance between two points using Haversine formula.
    
    Args:
        lat1, lon1: Coordinates of point 1 (degrees)
        lat2, lon2: Coordinates of point 2 (degrees)
        
    Returns:
        Distance in kilometers
    """
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    # Haversine formula
    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_KM * c


def calculate_score(
    distance_km: float,
    time_taken: float,
    time_limit: int,
    strategy: ScoringStrategy | None = None,
) -> ScoreResult:
    """Calculate score using specified or default strategy.
    
    Args:
        distance_km: Distance from correct answer
        time_taken: Time taken to answer
        time_limit: Maximum time allowed
        strategy: Scoring strategy (uses default if None)
        
    Returns:
        ScoreResult with scoring details
    """
    scorer = strategy or default_scorer
    return scorer.calculate_score(distance_km, time_taken, time_limit)


def is_correct_answer(distance_km: float, difficulty: str) -> bool:
    """Determine if answer is correct based on difficulty threshold.
    
    Args:
        distance_km: Distance from correct answer
        difficulty: Difficulty level (easy/medium/hard)
        
    Returns:
        True if within threshold for difficulty
    """
    thresholds = {
        "easy": 500,
        "medium": 300,
        "hard": 150,
    }
    threshold = thresholds.get(difficulty, 300)
    return distance_km <= threshold
