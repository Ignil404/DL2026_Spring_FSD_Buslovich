"""Structured logging configuration with structlog.

Provides both console (human-readable) and file (JSON) logging.
"""
import logging
import sys
from pathlib import Path

import structlog


def configure_logging(log_file: str = "logs/app.log") -> None:
    """Configure structlog with console and file handlers.
    
    Args:
        log_file: Path to JSON log file. Defaults to logs/app.log.
    
    Console output: Human-readable colored format
    File output: JSON format for log aggregation
    """
    # Ensure log directory exists
    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Console handler - human-readable format
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            processor=structlog.dev.ConsoleRenderer()
        )
    )
    
    # File handler - JSON format
    json_handler = logging.FileHandler(log_file)
    json_handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            processor=structlog.processors.JSONRenderer()
        )
    )
    
    # Configure standard library logging
    logging.basicConfig(
        level=logging.INFO,
        handlers=[console_handler, json_handler],
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Get a logger instance.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Configured structlog logger
    """
    return structlog.get_logger(name)
