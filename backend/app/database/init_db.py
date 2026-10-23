"""Create all tables in the configured database.

Run from backend/:
    python -m app.database.init_db
"""

# Importing model modules registers them on Base.metadata.
# Do not remove even if the linter complains about unused imports.
from app import models  # noqa: F401
from app.database.base import Base, engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database initialized.")
