import json
import logging
import sys
from contextvars import ContextVar
from datetime import datetime

request_id_var: ContextVar[str] = ContextVar("request_id", default="")
user_id_var: ContextVar[str] = ContextVar("user_id", default="")


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging"""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""

        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        request_id = request_id_var.get()
        if request_id:
            log_data["request_id"] = request_id

        user_id = user_id_var.get()
        if user_id:
            log_data["user_id"] = user_id

        if hasattr(record, "extra_fields"):
            log_data["context"] = record.extra_fields

        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info),
            }

        return json.dumps(log_data, default=str)


class StructuredLogger(logging.LoggerAdapter):
    """Logger adapter that supports structured logging"""

    def process(self, msg, kwargs):
        """Process log message and add extra fields"""
        extra = kwargs.get("extra", {})

        if extra:
            kwargs["extra"] = {"extra_fields": extra}

        return msg, kwargs


def setup_logging(level: str = "INFO", json_format: bool = True) -> None:
    """
    Setup application logging

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
        json_format: Use JSON formatter (True) or simple text (False)
    """

    handler = logging.StreamHandler(sys.stdout)

    if json_format:
        formatter = StructuredFormatter()
    else:
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = [handler]

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> StructuredLogger:
    """
    Get a structured logger instance

    Args:
        name: Logger name (usually __name__)

    Returns:
        StructuredLogger instance
    """
    base_logger = logging.getLogger(name)
    return StructuredLogger(base_logger, {})
