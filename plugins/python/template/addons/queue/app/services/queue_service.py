from arq import create_pool
from arq.connections import RedisSettings, ArqRedis

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_pool: ArqRedis | None = None


def _redis_settings() -> RedisSettings:
    url = settings.REDIS_URL or "redis://localhost:6379/0"
    return RedisSettings.from_dsn(url)


async def get_queue() -> ArqRedis:
    global _pool
    if _pool is None:
        _pool = await create_pool(_redis_settings())
        logger.info("arq Redis pool created")
    return _pool


async def enqueue(function_name: str, *args, **kwargs) -> str:
    pool = await get_queue()
    job = await pool.enqueue_job(function_name, *args, **kwargs)
    job_id = job.job_id if job else "unknown"
    logger.info(f"Enqueued job: {function_name} (id={job_id})")
    return job_id


async def close_queue() -> None:
    global _pool
    if _pool:
        await _pool.aclose()
        _pool = None
        logger.info("arq Redis pool closed")
