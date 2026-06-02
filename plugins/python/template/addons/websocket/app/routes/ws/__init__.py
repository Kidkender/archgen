from app.routes.ws.notifications import router as notifications_router
from fastapi import APIRouter

ws_router = APIRouter()
ws_router.include_router(notifications_router)

__all__ = ["ws_router"]
