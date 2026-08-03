import random

from . import tmdb_client
from .cache import pool_cache
from .config import Settings

POOL_KEY = "media_pool"


async def _fetch_movie_pool(settings: Settings) -> list[dict]:
    items = []
    for page in range(1, settings.pool_pages_to_fetch + 1):
        data = await tmdb_client.discover_movie(
            page=page, vote_count_gte=settings.pool_vote_count_gte
        )
        for item in data.get("results", []):
            items.append(
                {
                    "id": item["id"],
                    "media_type": "movie",
                    "title": item["title"],
                    "poster_path": item.get("poster_path"),
                }
            )
    return items


async def _fetch_tv_pool(settings: Settings) -> list[dict]:
    items = []
    for page in range(1, settings.pool_pages_to_fetch + 1):
        data = await tmdb_client.discover_tv(
            page=page, vote_count_gte=settings.pool_vote_count_gte
        )
        for item in data.get("results", []):
            items.append(
                {
                    "id": item["id"],
                    "media_type": "tv",
                    "title": item["name"],
                    "poster_path": item.get("poster_path"),
                }
            )
    return items


async def get_media_pool(settings: Settings) -> list[dict]:
    cached = pool_cache.get(POOL_KEY)
    if cached is not None:
        return cached

    movies = await _fetch_movie_pool(settings)
    series = await _fetch_tv_pool(settings)
    seen: set[tuple[str, int]] = set()
    pool: list[dict] = []
    for item in movies + series:
        key = (item["media_type"], item["id"])
        if key not in seen:
            seen.add(key)
            pool.append(item)

    pool_cache.set(POOL_KEY, pool)
    return pool


def pick_random_pair(pool: list[dict]) -> tuple[dict, dict]:
    return tuple(random.sample(pool, 2))
