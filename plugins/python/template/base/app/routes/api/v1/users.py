from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.base import DataResponse, PaginatedResponse
from app.schemas.user import UpdateUser, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    users = await service.list_users(page, limit)
    return PaginatedResponse(data=users)



@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    user = await service.get_user(int(request.state.user_id))
    return DataResponse(data=user)

@router.patch("/me", status_code=status.HTTP_204_NO_CONTENT)
async def update_user(
    request: Request,
    data: UpdateUser,
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    return await service.update_user(int(request.state.user_id), data)

@router.get("/{user_id}", response_model=DataResponse[UserResponse])
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    user = await service.get_user(user_id)
    return DataResponse(data=user)
