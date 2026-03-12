from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.core.logging import get_logger, setup_logging
from app.core.redis_client import redis_client
from app.middleware import (
    AuthenticationMiddleware,
    ErrorHandlingMiddleware,
    LoggingMiddleware,
    RateLimitMiddleware,
)
from app.routes import router
from app.schedulers import start_schedulers, stop_schedulers

setup_logging()
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events"""
    # Startup
    logger.info("Starting application...")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Connect to Redis
    await redis_client.connect()
    logger.info("Redis connected")

    # Start background schedulers
    start_schedulers()
    logger.info("Schedulers started")

    yield

    # Shutdown
    logger.info("Shutting down application...")

    # Stop schedulers
    stop_schedulers()

    # Disconnect Redis
    await redis_client.disconnect()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,  # ty:ignore[invalid-argument-type]
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middlewares
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthenticationMiddleware)

app.state.settings = settings

app.include_router(router)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
