from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import LoginSchema, RegisterSchema
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterSchema,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)
    await service.register(data)

@router.post("/login", status_code=status.HTTP_200_OK)
async def login(
    data: LoginSchema,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)
    return await service.login(data)
