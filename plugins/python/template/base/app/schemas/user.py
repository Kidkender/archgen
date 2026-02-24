from pydantic import EmailStr

from app.schemas.base import DataResponse, TimestampSchema


class UserBase(DataResponse):
    """Base user schema"""
    email: EmailStr
    username: str

class UserResponse(UserBase, TimestampSchema):
    """Schema for user response"""
    id: int
    is_active: bool

class UserCreate(UserBase):
    """Schema for creating user"""
    password: str
