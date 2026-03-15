"""API module initialization."""
from fastapi import APIRouter

from src.api import routes

# Create main router
api_router = APIRouter(prefix="/api/v1")

# Include routes
api_router.include_router(routes.router)

__all__ = ["api_router"]
