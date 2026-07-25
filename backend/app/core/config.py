"""
Application configuration.

Settings are loaded from environment variables (or a .env file) so the
same code can run unmodified on a dev machine or on the Raspberry Pi.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Security -----------------------------------------------------
    secret_key: str = "teja"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    # --- Database -------------------------------------------------------
    database_url: str = "sqlite:///./storage/cloud.db"

    # --- Storage --------------------------------------------------------
    storage_root: str = "./storage"
    max_upload_size_mb: int = 500

    app_name: str = "Personal Cloud"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance (avoids re-reading env vars on every call)."""
    return Settings()
