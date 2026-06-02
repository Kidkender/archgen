from fastapi import APIRouter

from app.core.config import settings
from app.routes.api.v1 import api_router
from app.routes.ws import ws_router

from .health import router as health_router

router = APIRouter()

router.include_router(health_router)
router.include_router(api_router, prefix=settings.API_V1_PREFIX)
router.include_router(ws_router)

__all__ = ["router"]
