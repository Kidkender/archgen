import asyncio

from app.core.logging import get_logger

logger = get_logger(__name__)


async def example_job(ctx: dict, message: str, user_id: int | None = None) -> dict:
    """Example background job — replace with real logic."""
    logger.info(f"Processing job: message={message!r} user_id={user_id}")
    await asyncio.sleep(0.1)  # simulate work
    return {"processed": True, "message": message}


# arq worker settings — imported by arq CLI as WorkerSettings
class WorkerSettings:
    functions = [example_job]
    # Adjust Redis URL via REDIS_URL env var loaded by arq from the env
    # To run: arq app.workers.example_worker.WorkerSettings
