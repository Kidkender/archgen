import time

from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.exception import TooManyRequestsException
from app.core.redis_client import redis_client


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if redis_client.redis:
            return await call_next(request)

        client_id = request.client.host
        api_key = request.headers.get(settings.API_KEY_HEADER)
        if api_key:
            client_id = f"api_key:{api_key}"

        rate_key = f"rate_limit:{client_id}:{int(time.time() / 60)}"
        current = await redis_client.get(rate_key)
        if current and int(current) >= settings.RATE_LIMIT_PER_MINUTE:
            raise TooManyRequestsException()

        if current and redis_client.redis:
            await redis_client.redis.incr(rate_key)
        else:
            await redis_client.set(rate_key, "1", expire=60)
        response = await call_next(request)
        return response
