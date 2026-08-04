from typing import Literal

from . import filters, tmdb_client
from .cache import cast_cache, credits_cache
from .schemas import ActorCreditsResponse, CastMember, CreditItem, MediaCastResponse

MediaType = Literal["movie", "tv"]

MOVIE_CAST_LIMIT = 20
# Series get a deeper list: aggregate credits reach past the series regulars
# into recurring supporting players, which is where most of the interesting
# connections live.
TV_CAST_LIMIT = 45

# A film can list several credited directors (co-directed animation, anthology
# segments); a handful is plenty to offer as connectors.
MAX_DIRECTORS = 3


def _dedupe_by_person(members: list[CastMember]) -> list[CastMember]:
    seen: set[int] = set()
    unique: list[CastMember] = []
    for member in members:
        if member.person_id in seen:
            continue
        seen.add(member.person_id)
        unique.append(member)
    return unique


def _movie_directors(data: dict) -> list[CastMember]:
    members = [
        CastMember(
            person_id=item["id"],
            name=item["name"],
            character="Yönetmen",
            order=0,
            profile_path=item.get("profile_path"),
            is_director=True,
        )
        for item in data.get("crew", [])
        if item.get("job") == "Director"
    ]
    return _dedupe_by_person(members)[:MAX_DIRECTORS]


def _tv_directors(data: dict) -> list[CastMember]:
    """Aggregate credits carry each crew member's jobs as a list, not one job."""
    members: list[CastMember] = []
    for item in data.get("crew", []):
        jobs = item.get("jobs") or []
        if not any(job.get("job") == "Director" for job in jobs):
            continue
        members.append(
            CastMember(
                person_id=item["id"],
                name=item["name"],
                character="Yönetmen",
                order=0,
                profile_path=item.get("profile_path"),
                is_director=True,
            )
        )
    return _dedupe_by_person(members)[:MAX_DIRECTORS]


def _movie_cast(data: dict) -> list[CastMember]:
    members = [
        CastMember(
            person_id=item["id"],
            name=item["name"],
            character=item.get("character", ""),
            order=item.get("order", 999),
            profile_path=item.get("profile_path"),
        )
        for item in data.get("cast", [])
        if not filters.is_self_appearance(item.get("character"), item.get("name"))
    ]
    members.sort(key=lambda member: member.order)
    return members[:MOVIE_CAST_LIMIT]


def _tv_cast(data: dict) -> list[CastMember]:
    """Flatten aggregate credits, where each actor carries a list of roles."""
    members: list[CastMember] = []
    for item in data.get("cast", []):
        roles = item.get("roles") or []
        # An actor can hold several roles across seasons; the one they played
        # most is the one worth showing.
        main_role = max(roles, key=lambda role: role.get("episode_count", 0), default=None)
        character = main_role.get("character", "") if main_role else ""
        if filters.is_self_appearance(character, item.get("name")):
            continue
        members.append(
            CastMember(
                person_id=item["id"],
                name=item["name"],
                character=character,
                order=item.get("order", 999),
                profile_path=item.get("profile_path"),
            )
        )

    members.sort(key=lambda member: member.order)
    return members[:TV_CAST_LIMIT]


async def get_media_cast(media_type: MediaType, media_id: int) -> MediaCastResponse:
    """Top-billed cast plus director(s) for a movie/series. Cached. Raises TMDbError."""
    cache_key = f"cast:{media_type}:{media_id}"
    cached = cast_cache.get(cache_key)
    if cached is not None:
        return cached

    if media_type == "movie":
        data = await tmdb_client.get_movie_credits(media_id)
        members = _movie_cast(data)
        directors = _movie_directors(data)
    else:
        data = await tmdb_client.get_tv_aggregate_credits(media_id)
        members = _tv_cast(data)
        directors = _tv_directors(data)

    response = MediaCastResponse(
        media_type=media_type, media_id=media_id, cast=members, directors=directors
    )
    cast_cache.set(cache_key, response)
    return response


async def get_actor_credits(person_id: int) -> ActorCreditsResponse:
    """A person's deduped movie+tv credits (combined_credits). Cached. Raises TMDbError."""
    cache_key = f"credits:{person_id}"
    cached = credits_cache.get(cache_key)
    if cached is not None:
        return cached

    data = await tmdb_client.get_person_combined_credits(person_id)

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

        character = item.get("character", "")
        if filters.is_self_appearance(character):
            continue  # guest spot, not a role — see filters.py
        if media_type == "tv" and filters.has_excluded_genre(item.get("genre_ids")):
            continue

        seen.add(key)
        credits_list.append(
            CreditItem(
                media_id=media_id,
                media_type=media_type,
                title=title,
                character=character,
                episode_count=item.get("episode_count") if media_type == "tv" else None,
                poster_path=item.get("poster_path"),
                release_date=release_date,
                vote_average=item.get("vote_average"),
            )
        )

    response = ActorCreditsResponse(person_id=person_id, credits=credits_list)
    credits_cache.set(cache_key, response)
    return response


async def get_person_directed_credits(person_id: int) -> ActorCreditsResponse:
    """The movies/series a person directed — same shape as acting credits.

    A separate cache key from `get_actor_credits`: the same person can be
    picked as either an actor or a director, and the two credit lists differ.
    """
    cache_key = f"directed:{person_id}"
    cached = credits_cache.get(cache_key)
    if cached is not None:
        return cached

    data = await tmdb_client.get_person_combined_credits(person_id)

    seen: set[tuple[str, int]] = set()
    credits_list: list[CreditItem] = []
    for item in data.get("crew", []):
        if item.get("job") != "Director":
            continue

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
            continue

        if media_type == "tv" and filters.has_excluded_genre(item.get("genre_ids")):
            continue

        seen.add(key)
        credits_list.append(
            CreditItem(
                media_id=media_id,
                media_type=media_type,
                title=title,
                character="Yönetmen",
                episode_count=None,
                poster_path=item.get("poster_path"),
                release_date=release_date,
                vote_average=item.get("vote_average"),
            )
        )

    response = ActorCreditsResponse(person_id=person_id, credits=credits_list)
    credits_cache.set(cache_key, response)
    return response
