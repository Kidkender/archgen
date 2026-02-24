from typing import Any

from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(
        self,
        error_code: str | None = None,
        message: str | None = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict[str, Any] | None = None,
    ):
        """
        Args:
            error_code: Error code constant (e.g., ERROR_USER_NOT_FOUND)
            message: Human-readable message (optional, sẽ dùng error_code nếu None)
            status_code: HTTP status code
            details: Additional context data
        """
        self.error_code = error_code
        self.details = details or {}

        display_message = message or error_code

        super().__init__(
            status_code=status_code,
            detail={
                "error_code": error_code,
                "message": display_message,
                "details": self.details,
            },
        )


class NotFoundException(AppException):
    """404 Not Found"""

    default_status_code = status.HTTP_404_NOT_FOUND


class BadRequestException(AppException):
    """400 Bad Request - Validation, invalid input, etc."""

    default_status_code = status.HTTP_400_BAD_REQUEST


class UnauthorizedException(AppException):
    """401 Unauthorized - Authentication failed"""

    default_status_code = status.HTTP_401_UNAUTHORIZED


class ForbiddenException(AppException):
    """403 Forbidden - Authorization failed"""

    default_status_code = status.HTTP_403_FORBIDDEN


class ConflictException(AppException):
    """409 Conflict - Duplicate resources, etc."""

    default_status_code = status.HTTP_409_CONFLICT

class TooManyRequestsException(AppException):
    """429 Too Many Requests"""

    default_status_code = status.HTTP_429_TOO_MANY_REQUESTS

class InternalServerException(AppException):
    """500 Internal Server Error"""

    default_status_code = status.HTTP_500_INTERNAL_SERVER_ERROR


class ServiceUnavailableException(AppException):
    """503 Service Unavailable - External services down"""

    default_status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class BadGatewayException(AppException):
    """502 Bad Gateway - External service errors"""

    default_status_code = status.HTTP_502_BAD_GATEWAY
