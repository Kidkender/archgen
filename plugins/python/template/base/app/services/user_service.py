from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants.error_codes import ERROR_USER_NOT_FOUND
from app.core.exception import BadRequestException
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.user import UpdateUser, UserResponse
from app.utils.security import hash_password

logger = get_logger(__name__)

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def update_user(self, user_id: int, data: UpdateUser):
        value = {}

        if data.username:
            value['username'] = data.username
        if data.password:
            hashed_password = hash_password(data.password)
            value['hashed_password'] = hashed_password
        if value:
            await self.db.execute(update(User).where(User.id == user_id).values(**value))
            await self.db.commit()

        logger.info(f"User {user_id} updated")

    async def get_user(self, user_id: int) -> Optional[UserResponse]:
        print("user_id: ", user_id)
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise BadRequestException(ERROR_USER_NOT_FOUND)
        return UserResponse.model_validate(user)

    async def list_users(self, page = 1, limit = 10) -> list[UserResponse]:
        offset = (page - 1) * limit
        query = select(User).offset(offset).limit(limit)
        result = await self.db.execute(query)
        users = result.scalars().all()

        return [UserResponse.model_validate(user) for user in users]
