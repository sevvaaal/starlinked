from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/


class Settings(BaseSettings):
    tmdb_api_key: str
    tmdb_base_url: str = "https://api.themoviedb.org/3"
    frontend_origin: str = "http://localhost:5173"
    cache_ttl_seconds: int = 3600
    pool_vote_count_gte: int = 200
    pool_pages_to_fetch: int = 5

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env", env_file_encoding="utf-8"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
