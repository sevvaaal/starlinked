from . import filters, tmdb_client
from .cache import pool_cache
from .config import Settings
from .levels import DEFAULT_LEVEL, Discover, LevelName, get_level


def _to_item(media_type: str, item: dict) -> dict:
    return {
        "id": item["id"],
        "media_type": media_type,
        "title": item["title"] if media_type == "movie" else item["name"],
        "poster_path": item.get("poster_path"),
        "is_animation": filters.is_animation(item.get("genre_ids")),
    }


async def _run_query(query: Discover) -> list[dict]:
    discover = tmdb_client.discover_movie if query.media_type == "movie" else tmdb_client.discover_tv
    items = []
    for page in range(1, query.pages + 1):
        data = await discover(page=page, vote_count_gte=query.vote_count_gte, sort_by=query.sort_by)
        for item in data.get("results", []):
            # discover/tv already excludes these genres; re-check in case a title
            # carries one alongside a scripted genre.
            if query.media_type == "tv" and filters.has_excluded_genre(item.get("genre_ids")):
                continue
            items.append(_to_item(query.media_type, item))
    return items


async def get_media_pool(settings: Settings, level: LevelName = DEFAULT_LEVEL) -> list[dict]:
    """The titles a level's games are built from, deduplicated, in query order. Cached."""
    cache_key = f"media_pool:{level}"
    cached = pool_cache.get(cache_key)
    if cached is not None:
        return cached

    definition = get_level(level, settings.pool_vote_count_gte, settings.pool_pages_to_fetch)
    seen: set[tuple[str, int]] = set()
    pool: list[dict] = []
    for query in definition.queries:
        for item in await _run_query(query):
            if definition.skip_animation and item["is_animation"]:
                continue
            key = (item["media_type"], item["id"])
            if key not in seen:
                seen.add(key)
                pool.append(item)

    pool_cache.set(cache_key, pool)
    return pool
