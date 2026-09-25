"""Shared pytest fixtures.

Each test gets its own SQLite file under pytest's tmp_path. This is
bulletproof: no in-memory pool weirdness, no cross-test contamination.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base

# Register all models on Base.metadata
from app import models  # noqa: F401


@pytest.fixture()
def db_session(tmp_path) -> Session: # type: ignore
    db_file = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{db_file}", future=True)

    Base.metadata.create_all(engine)

    TestSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()