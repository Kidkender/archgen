from fastapi import APIRouter, status
from sqlalchemy import text

from app.core.database import engine
from app.core.redis_client import redis_client
from app.schemas.base import DataResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=DataResponse)
async def health_check():
    """Basic health check"""
    return DataResponse(message="Service is healthy")


@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def readiness_check():
    """Readiness check - verify dependencies"""

    checks = {
        "database": False,
        "redis": False
    }

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        pass

    # Check Redis
    try:
        if redis_client.redis:
            redis_client.redis.ping()
            checks["redis"] = True
    except Exception:
        pass

    if not all(checks.values()):
        return {
            "success": False,
            "checks": checks
        }

    return {
        "success": True,
        "checks": checks
    }


@router.get("/health/live", response_model=DataResponse)
async def liveness_check():
    """Liveness check - simple ping"""
    return DataResponse(message="Service is alive")
