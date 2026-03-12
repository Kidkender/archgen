from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants.error_codes import ERROR_USER_EMAIL_ALREADY_EXISTS, ERROR_USER_NOT_FOUND
from app.core.config import settings
from app.core.exception import BadRequestException
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.auth import LoginResponseSchema, LoginSchema, RegisterSchema
from app.utils.security import hash_password, verify_password

logger = get_logger(__name__)

class AuthService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, payload: RegisterSchema):
        user_exist = await self.db.execute(select(User).where(User.email == payload.email))
        if user_exist.first():
            raise BadRequestException(ERROR_USER_EMAIL_ALREADY_EXISTS)

        hashed_password = hash_password(password=payload.password)
        new_user = User(
            email=payload.email,
            username=payload.username,
            hashed_password=hashed_password,
        )

        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        logger.info(f"User registered: {new_user.username}")

    async def login(self, payload: LoginSchema) -> LoginResponseSchema:
        user = (
            await self.db.execute(select(User).where(User.email == payload.email))
        ).scalar_one_or_none()

        if not user:
            raise BadRequestException(ERROR_USER_NOT_FOUND)

        if not verify_password(payload.password, user.hashed_password):
            raise BadRequestException(ERROR_USER_EMAIL_ALREADY_EXISTS)

        access_token = self.create_access_token(data={
            "sub": str(user.id),
            "email": user.email,
        }, expires_delta=timedelta(minutes=60))

        return LoginResponseSchema(access_token=access_token, user_id=user.id)


    def create_access_token(self,data: dict, expires_delta: timedelta | None = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY)
        return encoded_jwt
