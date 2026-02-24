from fastapi import APIRouter

from app.routes.api.v1 import users

api_router = APIRouter()

api_router.include_router(users.router)

__all__ = ["api_router"]
