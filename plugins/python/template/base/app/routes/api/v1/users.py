from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.base import DataResponse, PaginatedResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("", response_model=DataResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new user"""
    service = UserService(db)
    user = await service.create_user(data)
    return DataResponse(data=user)

@router.get("/{user_id}", response_model=DataResponse[UserResponse])
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    user = await service.get_user(user_id)
    return DataResponse(data=user)


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    users = await service.list_users(page, limit)
    return PaginatedResponse(data=users)
