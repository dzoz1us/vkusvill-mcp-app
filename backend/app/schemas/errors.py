"""Unified error envelope.

Every non-2xx response from the API serializes to this shape, so the
mobile client can render a consistent error state.
"""

from pydantic import BaseModel

from app.schemas.enums import ErrorCode


class ErrorBody(BaseModel):
    code: ErrorCode
    message: str
    retryable: bool = False


class ErrorResponse(BaseModel):
    error: ErrorBody