from datetime import timedelta

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.core.oauth import oauth_settings
from app.models.user import User
from app.services.auth_service import AuthService

logger = get_logger(__name__)


class OAuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self._auth = AuthService(db)

    async def find_or_create_user(self, email: str, name: str) -> User:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            username = name.lower().replace(" ", "_")
            user = User(email=email, username=username, hashed_password="")
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
            logger.info(f"Created OAuth user: {email}")
        return user

    def create_token(self, user: User) -> str:
        return self._auth.create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=timedelta(minutes=60),
        )

    async def get_google_user(self, code: str) -> dict:
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": oauth_settings.GOOGLE_CLIENT_ID,
                    "client_secret": oauth_settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": f"{oauth_settings.APP_URL}/api/v1/oauth/google/callback",
                    "grant_type": "authorization_code",
                },
            )
            token_resp.raise_for_status()
            access_token = token_resp.json()["access_token"]
            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_resp.raise_for_status()
            return user_resp.json()

    async def get_github_user(self, code: str) -> dict:
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "code": code,
                    "client_id": oauth_settings.GITHUB_CLIENT_ID,
                    "client_secret": oauth_settings.GITHUB_CLIENT_SECRET,
                },
                headers={"Accept": "application/json"},
            )
            token_resp.raise_for_status()
            access_token = token_resp.json()["access_token"]
            user_resp = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            user_resp.raise_for_status()
            return user_resp.json()
