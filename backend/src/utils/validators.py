"""Validation utilities for DRY principle.

Centralized validation logic used across services and routes.
"""
import re


def validate_player_name(name: str) -> tuple[bool, str | None]:
    """Validate player name format.

    Args:
        name: Player name to validate

    Returns:
        Tuple of (is_valid, error_message)
        - (True, None) if valid
        - (False, "error message") if invalid
    """
    if not name or len(name.strip()) == 0:
        return False, "Player name cannot be empty"

    name = name.strip()

    if len(name) < 2:
        return False, "Player name must be at least 2 characters"

    if len(name) > 20:
        return False, "Player name must be at most 20 characters"

    if not re.match(r'^[\w\s-]{2,20}$', name, re.UNICODE):
        return False, "Player name must be 2-20 characters"

    return True, None


def validate_coordinates(lat: float, lon: float) -> tuple[bool, str | None]:
    """Validate geographic coordinates.
    
    Args:
        lat: Latitude (-90 to 90)
        lon: Longitude (-180 to 180)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        return False, "Coordinates must be numbers"

    if lat < -90 or lat > 90:
        return False, "Latitude must be between -90 and 90"

    if lon < -180 or lon > 180:
        return False, "Longitude must be between -180 and 180"

    return True, None


def validate_round_id(round_id: str) -> tuple[bool, str | None]:
    """Validate round ID format (UUID).
    
    Args:
        round_id: Round ID to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not round_id or len(round_id.strip()) == 0:
        return False, "Round ID cannot be empty"

    # Basic UUID format check (8-4-4-4-12 hex digits)
    uuid_pattern = re.compile(
        r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
        re.IGNORECASE
    )

    if not uuid_pattern.match(round_id.strip()):
        return False, "Invalid round ID format"

    return True, None
