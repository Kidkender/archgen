from typing import Optional

from redis import asyncio as aioredis

from app.core.config import settings


class RedisClient:
    """Redis client wrapper"""

    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        """Connect to redis"""
        if settings.REDIS_URL:
            self.redis = await aioredis.from_url(
                settings.REDIS_URL,
                encoding='utf-8',
                decode_responses=True
            )

    async def disconnect(self):
        """Disconnect from redis"""
        if self.redis:
            await self.redis.close()

    async def get(self, key: str) -> Optional[str]:
        """Get value from redis"""
        if not self.redis:
            return None
        return await self.redis.get(key)

    async def set(self, key: str, value: str, expire: int = 3600):
        """Set value in redis"""
        if self.redis:
            await self.redis.set(key, value, ex=expire)

    async def delete(self, key: str):
        """Delete key from redis"""
        if self.redis:
            await self.redis.delete(key)

redis_client = RedisClient()
