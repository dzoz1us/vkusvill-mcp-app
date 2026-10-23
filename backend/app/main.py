"""FastAPI application entrypoint."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.grocery import router as grocery_router
from app.api.meal_plans import router as meal_plans_router
from app.api.recipes import router as recipes_router
from app.api.vkusvill import router as vkusvill_router
from app.database.base import SessionLocal
from app.database.config import get_settings
from app.database.init_db import init_db
from app.middleware import RequestIDMiddleware
from app.schemas.enums import ErrorCode
from app.schemas.errors import ErrorBody, ErrorResponse
from app.seed_runner import seed_if_empty

settings = get_settings()

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    with SessionLocal() as db:
        seed_if_empty(db)
    yield


app = FastAPI(
    title="VkusPlan API",
    version="0.1.0",
    lifespan=lifespan,
)


def _error_response(code: ErrorCode, message: str, status_code: int) -> JSONResponse:
    body = ErrorResponse(error=ErrorBody(code=code, message=message, retryable=False))
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, __: RequestValidationError) -> JSONResponse:
    return _error_response(
        ErrorCode.VALIDATION_ERROR,
        "Request validation failed.",
        status.HTTP_422_UNPROCESSABLE_CONTENT,
    )


@app.exception_handler(Exception)
async def internal_error_handler(_: Request, __: Exception) -> JSONResponse:
    return _error_response(
        ErrorCode.INTERNAL_ERROR,
        "An unexpected error occurred.",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meal_plans_router)
app.include_router(grocery_router)
app.include_router(vkusvill_router)
app.include_router(recipes_router)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}
