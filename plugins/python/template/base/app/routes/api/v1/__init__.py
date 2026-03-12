from fastapi import APIRouter

from app.routes.api.v1 import auth, users

api_router = APIRouter()

api_router.include_router(users.router)
api_router.include_router(auth.router)

__all__ = ["api_router"]
