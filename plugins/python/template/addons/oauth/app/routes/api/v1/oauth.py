from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.oauth import oauth_settings
from app.services.oauth_service import OAuthService

router = APIRouter(prefix="/oauth", tags=["OAuth"])


@router.get("/google", summary="Redirect to Google OAuth")
async def google_login() -> dict:
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={oauth_settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={oauth_settings.APP_URL}/api/v1/oauth/google/callback"
        "&response_type=code"
        "&scope=openid%20email%20profile"
    )
    return {"url": url}


@router.get("/google/callback", summary="Google OAuth callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)) -> dict:
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided")
    service = OAuthService(db)
    profile = await service.get_google_user(code)
    user = await service.find_or_create_user(
        email=profile["email"],
        name=profile.get("name", ""),
    )
    token = service.create_token(user)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/github", summary="Redirect to GitHub OAuth")
async def github_login() -> dict:
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={oauth_settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={oauth_settings.APP_URL}/api/v1/oauth/github/callback"
        "&scope=user:email"
    )
    return {"url": url}


@router.get("/github/callback", summary="GitHub OAuth callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)) -> dict:
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided")
    service = OAuthService(db)
    profile = await service.get_github_user(code)
    email = profile.get("email") or f"{profile['login']}@github.local"
    name = profile.get("name") or profile["login"]
    user = await service.find_or_create_user(email=email, name=name)
    token = service.create_token(user)
    return {"access_token": token, "token_type": "bearer"}
