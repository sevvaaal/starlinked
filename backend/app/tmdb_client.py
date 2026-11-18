import httpx

from . import filters
from .config import get_settings


class TMDbError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)


async def _get(path: str, params: dict | None = None) -> dict:
    settings = get_settings()
    params = dict(params or {})
    params["api_key"] = settings.tmdb_api_key
    url = f"{settings.tmdb_base_url}{path}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)
    if response.status_code != 200:
        raise TMDbError(response.status_code, response.text)
    return response.json()


async def get_movie_credits(movie_id: int) -> dict:
    return await _get(f"/movie/{movie_id}/credits")


async def get_tv_credits(series_id: int) -> dict:
    return await _get(f"/tv/{series_id}/credits")


async def get_tv_aggregate_credits(series_id: int) -> dict:
    """Cast across *all* episodes, not just the latest season.

    This is what surfaces recurring/supporting players — plain /credits only
    lists the current season's series regulars.
    """
    return await _get(f"/tv/{series_id}/aggregate_credits")


async def get_person_combined_credits(person_id: int) -> dict:
    return await _get(f"/person/{person_id}/combined_credits")


async def discover_movie(page: int, vote_count_gte: int, sort_by: str = "popularity.desc") -> dict:
    return await _get(
        "/discover/movie",
        {
            "sort_by": sort_by,
            "vote_count.gte": vote_count_gte,
            "page": page,
        },
    )


async def discover_tv(page: int, vote_count_gte: int, sort_by: str = "popularity.desc") -> dict:
    return await _get(
        "/discover/tv",
        {
            "sort_by": sort_by,
            "vote_count.gte": vote_count_gte,
            "page": page,
            "include_null_first_air_dates": "false",
            "without_genres": filters.EXCLUDED_TV_GENRES_PARAM,
        },
    )
