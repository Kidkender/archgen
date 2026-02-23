from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class BaseResponse(BaseModel):
    """
    Base response structure for all API endpoints.

    All responses should extend this to maintain consistency.
    """

    success: bool = Field(True, description="Indicates if the operation was successful")
    message: str | None = Field(None, description="Human-readable message about the operation")

    class Config:
        json_schema_extra = {
            "example": {"success": True, "message": "Operation completed successfully"}
        }


class DataResponse(BaseResponse, Generic[T]):
    """
    Response with data payload.

    Use this for responses that return data after operation.
    Generic type T represents the data structure.

    Example:
        class UserData(BaseModel):
            id: int
            name: str

        class UserResponse(DataResponse[UserData]):
            pass
    """

    success: bool = True
    data: T | None = Field(None, description="Response data payload")
    message: str | None = None

    class Config:
        json_schema_extra = {"example": {"success": True, "data": {"id": 1, "name": "example"}}}


class ErrorDetail(BaseModel):
    """Error detail structure for error responses"""

    field: str | None = Field(
        None, description="Field name that caused the error (for validation errors)"
    )
    message: str = Field(..., description="Error message")
    code: str | None = Field(None, description="Error code for client handling")


class ErrorResponse(BaseModel):
    """
    Standard error response structure.

    Used by ErrorHandlingMiddleware for consistent error formatting.
    """

    error_code: str = Field(
        ..., description="Machine-readable error code (e.g., 'error.validation.invalid-input')"
    )
    message: str = Field(..., description="Human-readable error message")
    details: dict | None = Field(None, description="Additional error context and details")

    class Config:
        json_schema_extra = {
            "example": {
                "error_code": "error.validation.invalid-input",
                "message": "Validation failed",
                "details": {"fields": [{"field": "email", "message": "Invalid email format"}]},
            }
        }


class PaginationMeta(BaseModel):
    """Pagination metadata for list responses"""

    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")


class PaginatedResponse(BaseResponse, Generic[T]):
    """
    Response for paginated list data.

    Example:
        class ItemData(BaseModel):
            id: int
            name: str

        class ItemsResponse(PaginatedResponse[ItemData]):
            pass
    """

    data: list[T] = Field(..., description="List of items")
    meta: PaginationMeta = Field(..., description="Pagination metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Items retrieved successfully",
                "data": [{"id": 1, "name": "Item 1"}],
                "meta": {"total": 100, "page": 1, "per_page": 10, "total_pages": 10},
            }
        }

class TimestampSchema(BaseModel):
    """Schema with timestamps"""
    created_at: datetime = Field(..., description="Timestamp of creation")
    updated_at: datetime = Field(..., description="Timestamp of last update")
