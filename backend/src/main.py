"""Geography Quiz Backend API.

Application factory with structured logging configuration.
"""
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import api_router
from src.database import init_db
from src.logger import configure_logging


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    # Configure logging before anything else
    configure_logging()

    logger = structlog.get_logger(__name__)
    logger.info("Creating Geography Quiz API application")

    app = FastAPI(
        title="Geography Quiz API",
        description="Interactive map-based geography quiz game",
        version="0.1.0",
    )

    # Setup CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(api_router)
    logger.info("API routes registered")

    # Initialize database on startup
    @app.on_event("startup")
    def startup() -> None:
        logger.info("Initializing database")
        init_db()
        logger.info("Database initialized")

    @app.on_event("shutdown")
    def shutdown() -> None:
        logger.info("Shutting down Geography Quiz API")

    logger.info("Application created successfully")
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
