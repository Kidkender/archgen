import logging

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger(__name__)

PUBLIC_PATHS = [
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
]


class AuthenticationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        if request.method == "OPTIONS":
            return await call_next(request)

        return await call_next(request)

        # api_key = request.headers.get("X-API-Key")

        # if not api_key:
        #     logger.warning(
        #         f"  Missing API key for {request.method} {request.url.path} "
        #         f"from {request.client.host if request.client else 'unknown'}"
        #     )
        #     return JSONResponse(
        #         status_code=401,
        #         content={
        #             "error_code": "error.auth.missing-key",
        #             "message": "Authentication required. Include X-API-Key header.",
        #             "details": {
        #                 "header": "X-API-Key",
        #                 "example": "X-API-Key: ak_your_api_key_here"
        #             }
        #         }
        #     )

        # # Validate key
        # db = SessionLocal()
        # try:
        #     api_key_service = APIKeyService(db)
        #     db_key = api_key_service.validate_key(api_key)

        #     if not db_key:
        #         logger.warning(
        #             f"  Invalid API key for {request.method} {request.url.path} "
        #             f"from {request.client.host if request.client else 'unknown'}"
        #         )
        #         return JSONResponse(
        #             status_code=401,
        #             content={
        #                 "error_code": "error.auth.invalid-key",
        #                 "message": "Invalid or expired API key",
        #                 "details": {
        #                     "hint": "Check that your API key is correct and active"
        #                 }
        #             }
        #         )

        #     # Attach key info to request state for use in route handlers
        #     request.state.api_key = db_key
        #     request.state.api_key_name = db_key.name

        #     logger.debug(
        #         f" Authenticated: {request.method} {request.url.path} "
        #         f"with key '{db_key.name}' (ID: {db_key.id})"
        #     )

        #     # Continue to route handler
        #     response = await call_next(request)

        #     return response

        # finally:
        #     db.close()
