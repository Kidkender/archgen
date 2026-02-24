from fastapi import APIRouter

from app.core.config import settings
from app.routes.api.v1 import api_router

from .health import router as health_router

router = APIRouter()

router.include_router(health_router)
router.include_router(api_router, prefix=settings.API_V1_PREFIX)

__all__ = ["router"]
