"""Scoring service: Haversine distance and points calculation."""
import math
from typing import Tuple


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth
    using the Haversine formula.
    
    Args:
        lat1, lon1: Coordinates of point 1 (in degrees)
        lat2, lon2: Coordinates of point 2 (in degrees)
    
    Returns:
        Distance in kilometers
    """
    # Earth's radius in kilometers
    R = 6371.0
    
    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = (
        math.sin(delta_lat / 2) ** 2 +
        math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def calculate_base_points(distance_km: float) -> int:
    """
    Calculate base points from accuracy tiers.
    
    Tiers:
    - < 100 km: 1000 points
    - < 500 km: 500 points
    - < 1000 km: 250 points
    - < 5000 km: 100 points
    - >= 5000 km: 0 points
    
    Args:
        distance_km: Distance from correct answer in kilometers
    
    Returns:
        Base points (0, 100, 250, 500, or 1000)
    """
    if distance_km < 100:
        return 1000
    elif distance_km < 500:
        return 500
    elif distance_km < 1000:
        return 250
    elif distance_km < 5000:
        return 100
    else:
        return 0


def calculate_score(
    distance_km: float,
    time_taken: float,
    time_limit: int
) -> Tuple[int, float, int]:
    """
    Calculate final score based on accuracy and speed.
    
    Args:
        distance_km: Distance from correct answer in kilometers
        time_taken: Time taken to answer in seconds
        time_limit: Total time limit for the question in seconds
    
    Returns:
        Tuple of (base_points, speed_multiplier, final_score)
    """
    # Calculate base points from accuracy
    base_points = calculate_base_points(distance_km)
    
    # Calculate speed multiplier (0.0 to 1.0)
    if time_limit <= 0:
        speed_multiplier = 0.0
    else:
        time_remaining = max(0, time_limit - time_taken)
        speed_multiplier = time_remaining / time_limit
    
    # Calculate final score
    final_score = round(base_points * speed_multiplier)
    
    return base_points, speed_multiplier, final_score


def is_correct_answer(distance_km: float, difficulty: str) -> bool:
    """
    Determine if an answer is considered "correct" based on difficulty.
    
    Args:
        distance_km: Distance from correct answer
        difficulty: Question difficulty (easy, medium, hard)
    
    Returns:
        True if answer is within acceptable range
    """
    thresholds = {
        "easy": 500,      # Within 500km
        "medium": 300,    # Within 300km
        "hard": 150,      # Within 150km
    }
    return distance_km <= thresholds.get(difficulty, 300)
