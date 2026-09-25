"""FastAPI application entrypoint.

For MVP we run with uvicorn:
    uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.config import get_settings
from app.database.init_db import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create tables on startup for MVP. Replace with Alembic later.
    init_db()
    yield


app = FastAPI(
    title="VkusPlan API",
    version="0.1.0",
    lifespan=lifespan,
)

# Mobile SPA served from a different origin -> CORS needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}