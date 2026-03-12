from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.base import TimestampSchema


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str

class UserResponse(UserBase, TimestampSchema):
    """Schema for user response"""

    model_config= ConfigDict(from_attributes=True)
    id: int
    is_active: bool

class UpdateUser(BaseModel):
    """Schema for updating user"""
    username: str | None = None
    password: str | None = None
