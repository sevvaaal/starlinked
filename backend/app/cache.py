import time

from .config import get_settings


class TTLCache:
    def __init__(self, ttl_seconds: int):
        self._ttl = ttl_seconds
        self._store: dict[str, tuple[float, object]] = {}

    def get(self, key: str):
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value) -> None:
        self._store[key] = (time.monotonic() + self._ttl, value)


_settings = get_settings()
cast_cache = TTLCache(ttl_seconds=_settings.cache_ttl_seconds)
credits_cache = TTLCache(ttl_seconds=_settings.cache_ttl_seconds)
pool_cache = TTLCache(ttl_seconds=_settings.cache_ttl_seconds * 24)
graph_cache = TTLCache(ttl_seconds=_settings.cache_ttl_seconds * 24)
