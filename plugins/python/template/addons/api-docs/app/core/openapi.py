from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

tags_metadata = [
    {
        "name": "health",
        "description": "Service health and readiness checks.",
    },
    {
        "name": "Auth",
        "description": "Register, login, and token management.",
    },
    {
        "name": "Users",
        "description": "User profile and account management.",
    },
    {
        "name": "OAuth",
        "description": "Third-party OAuth2 login (Google, GitHub).",
    },
]


def custom_openapi(app: FastAPI) -> dict:
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=(
            "## {{PROJECT_NAME}} API\n\n"
            "Production-ready REST API built with **FastAPI**.\n\n"
            "### Authentication\n"
            "Most endpoints require a Bearer token obtained from `/api/v1/auth/login`.\n\n"
            "```\nAuthorization: Bearer <token>\n```"
        ),
        routes=app.routes,
        tags=tags_metadata,
        contact={"name": "{{AUTHOR}}"},
        license_info={"name": "ISC"},
    )
    app.openapi_schema = schema
    return schema
