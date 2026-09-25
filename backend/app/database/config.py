"""Application settings loaded from environment / .env file."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # server
    backend_port: int = 8000
    log_level: str = "INFO"
    frontend_origin: str = "http://localhost:5173"

    # database
    database_url: str = "sqlite:///./app.db"

    # vkusvill mcp
    vkusvill_mcp_url: str = "https://mcp.vkusvill.ru/mcp"
    vkusvill_mcp_timeout_ms: int = 10_000
    product_search_cache_ttl_seconds: int = 1800
    enable_live_mcp: bool = False


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance. Import this, not Settings, in app code."""
    return Settings()