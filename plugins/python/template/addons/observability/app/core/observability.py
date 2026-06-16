from __future__ import annotations

import os

import structlog
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_fastapi_instrumentator import Instrumentator

from fastapi import FastAPI


def setup_logging() -> None:
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer() if os.getenv("LOG_FORMAT") != "json"
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(__import__("logging"), os.getenv("LOG_LEVEL", "INFO"))
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
    )


def setup_tracing() -> None:
    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/traces")
    service_name = os.getenv("OTEL_SERVICE_NAME", "{{PROJECT_NAME}}")

    resource = Resource(attributes={SERVICE_NAME: service_name})
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint)))
    trace.set_tracer_provider(provider)


def instrument_app(app: FastAPI) -> None:
    setup_tracing()
    FastAPIInstrumentor.instrument_app(app)
    Instrumentator().instrument(app).expose(app, endpoint="/metrics")
