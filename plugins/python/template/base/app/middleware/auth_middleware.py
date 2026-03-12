import logging

import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.constants.error_codes import ERROR_INVALID_CREDENTIALS, ERROR_TOKEN_INVALID
from app.core.config import settings

logger = logging.getLogger(__name__)

PUBLIC_PATHS = [
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
    "/api/v1/auth/register",
    "/api/v1/auth/login",
]


class AuthenticationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer"):
            return JSONResponse(status_code=401, content={"detail": ERROR_INVALID_CREDENTIALS})

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            request.state.user_id = payload.get("sub")
            request.state.email = payload.get("email")
        except jwt.ExpiredSignatureError:
            return JSONResponse(status_code=401, content={"detail": ERROR_TOKEN_INVALID})
        except jwt.InvalidTokenError:
            return JSONResponse(status_code=401, content={"detail": ERROR_TOKEN_INVALID})

        return await call_next(request)
