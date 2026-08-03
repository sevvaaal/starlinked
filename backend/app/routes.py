from typing import Literal

from fastapi import APIRouter, HTTPException

from . import media_pool, tmdb_client
from .cache import cast_cache, credits_cache
from .config import get_settings
from .schemas import (
    ActorCreditsResponse,
    CastMember,
    CreditItem,
    MediaBrief,
    MediaCastResponse,
    NewGameResponse,
)

router = APIRouter()


@router.get("/new-game", response_model=NewGameResponse)
async def new_game():
    settings = get_settings()
    try:
        pool = await media_pool.get_media_pool(settings)
    except tmdb_client.TMDbError as exc:
        raise HTTPException(502, "TMDb request failed") from exc
    start, target = media_pool.pick_random_pair(pool)
    return NewGameResponse(start=MediaBrief(**start), target=MediaBrief(**target))


@router.get("/media/{media_type}/{media_id}/cast", response_model=MediaCastResponse)
async def media_cast(media_type: Literal["movie", "tv"], media_id: int):
    cache_key = f"cast:{media_type}:{media_id}"
    cached = cast_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        if media_type == "movie":
            data = await tmdb_client.get_movie_credits(media_id)
        else:
            data = await tmdb_client.get_tv_credits(media_id)
    except tmdb_client.TMDbError as exc:
        if exc.status_code == 404:
            raise HTTPException(404, "Media not found on TMDb") from exc
        raise HTTPException(502, "TMDb request failed") from exc

    members = sorted(
        (
            CastMember(
                person_id=item["id"],
                name=item["name"],
                character=item.get("character", ""),
                order=item.get("order", 999),
                profile_path=item.get("profile_path"),
            )
            for item in data.get("cast", [])
        ),
        key=lambda m: m.order,
    )[:20]

    response = MediaCastResponse(media_type=media_type, media_id=media_id, cast=members)
    cast_cache.set(cache_key, response)
    return response


@router.get("/actor/{person_id}/credits", response_model=ActorCreditsResponse)
async def actor_credits(person_id: int):
    cache_key = f"credits:{person_id}"
    cached = credits_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        data = await tmdb_client.get_person_combined_credits(person_id)
    except tmdb_client.TMDbError as exc:
        if exc.status_code == 404:
            raise HTTPException(404, "Person not found on TMDb") from exc
        raise HTTPException(502, "TMDb request failed") from exc

    seen: set[tuple[str, int]] = set()
    credits_list: list[CreditItem] = []
    for item in data.get("cast", []):
        media_type = item.get("media_type")
        if media_type not in ("movie", "tv"):
            continue

        media_id = item["id"]
        key = (media_type, media_id)
        if key in seen:
            continue

        title = item.get("title") or item.get("name")
        release_date = item.get("release_date") or item.get("first_air_date")
        if not title or not release_date:
            continue  # skip unreleased / dateless entries

        seen.add(key)
        credits_list.append(
            CreditItem(
                media_id=media_id,
                media_type=media_type,
                title=title,
                character=item.get("character", ""),
                episode_count=item.get("episode_count") if media_type == "tv" else None,
                poster_path=item.get("poster_path"),
                release_date=release_date,
            )
        )

    response = ActorCreditsResponse(person_id=person_id, credits=credits_list)
    credits_cache.set(cache_key, response)
    return response
