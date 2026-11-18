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

# Beyond the main cast, players can still *search* for someone they know was
# in it (a guest star, a one-season regular). These aren't shown up front and
# the pool graph ignores them, so they don't make puzzles trivially short.
MOVIE_MORE_CAST_LIMIT = 60
TV_MORE_CAST_LIMIT = 400

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
            character="Director",
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
                character="Director",
                order=0,
                profile_path=item.get("profile_path"),
                is_director=True,
            )
        )
    return _dedupe_by_person(members)[:MAX_DIRECTORS]


def _movie_cast(data: dict) -> tuple[list[CastMember], list[CastMember]]:
    members = [
        CastMember(
            person_id=item["id"],
            name=item["name"],
            character=item.get("character", ""),
            order=item.get("order", 999),
            profile_path=item.get("profile_path"),
            popularity=item.get("popularity"),
        )
        for item in data.get("cast", [])
        if not filters.is_self_appearance(item.get("character"), item.get("name"))
    ]
    members.sort(key=lambda member: member.order)
    return (
        members[:MOVIE_CAST_LIMIT],
        members[MOVIE_CAST_LIMIT : MOVIE_CAST_LIMIT + MOVIE_MORE_CAST_LIMIT],
    )


def _tv_cast(data: dict) -> tuple[list[CastMember], list[CastMember]]:
    """Flatten aggregate credits, where each actor carries a list of roles.

    Sorted by episodes appeared in, not TMDb's `order`: on long-running shows
    `order` puts one-episode guests ahead of people with 20+ episodes, so the
    recurring players everyone remembers fell off the end of the list.
    """
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
                episode_count=item.get("total_episode_count"),
                popularity=item.get("popularity"),
            )
        )

    members.sort(key=lambda member: (-(member.episode_count or 0), member.order))
    return members[:TV_CAST_LIMIT], members[TV_CAST_LIMIT : TV_CAST_LIMIT + TV_MORE_CAST_LIMIT]


async def get_media_cast(media_type: MediaType, media_id: int) -> MediaCastResponse:
    """Top-billed cast plus director(s) for a movie/series. Cached. Raises TMDbError."""
    cache_key = f"cast:{media_type}:{media_id}"
    cached = cast_cache.get(cache_key)
    if cached is not None:
        return cached

    if media_type == "movie":
        data = await tmdb_client.get_movie_credits(media_id)
        members, more = _movie_cast(data)
        directors = _movie_directors(data)
    else:
        data = await tmdb_client.get_tv_aggregate_credits(media_id)
        members, more = _tv_cast(data)
        directors = _tv_directors(data)

    response = MediaCastResponse(
        media_type=media_type,
        media_id=media_id,
        cast=members,
        more_cast=more,
        directors=directors,
    )
    cast_cache.set(cache_key, response)
    return response


async def get_link_cast(media_type: MediaType, media_id: int) -> list[tuple[int, float | None]]:
    """The main cast as (person_id, popularity), in billing order — what the pool
    graph links titles on. Not cached: the graph built from it is.

    Kept separate from `get_media_cast` on purpose. Building a graph touches
    hundreds of titles, and caching each full cast (series carry hundreds of
    searchable extra players) is what pushed the server past its memory limit.
    """
    if media_type == "movie":
        return _movie_link_cast(await tmdb_client.get_movie_credits(media_id))
    return _tv_link_cast(await tmdb_client.get_tv_aggregate_credits(media_id))


# Lightweight twins of _movie_cast / _tv_cast for graph building: same filtering,
# order and limit, but plain tuples and no model objects. A long-running series
# lists thousands of people, and building a full CastMember for each was most of
# the time a graph build spent (on a small server, CPU is the bottleneck).
def _movie_link_cast(data: dict) -> list[tuple[int, float | None]]:
    rows = [
        (item.get("order", 999), item["id"], item.get("popularity"))
        for item in data.get("cast", [])
        if not filters.is_self_appearance(item.get("character"), item.get("name"))
    ]
    rows.sort(key=lambda row: row[0])
    return [(person_id, popularity) for _, person_id, popularity in rows[:MOVIE_CAST_LIMIT]]


def _tv_link_cast(data: dict) -> list[tuple[int, float | None]]:
    rows = []
    for item in data.get("cast", []):
        roles = item.get("roles") or []
        main_role = max(roles, key=lambda role: role.get("episode_count", 0), default=None)
        character = main_role.get("character", "") if main_role else ""
        if filters.is_self_appearance(character, item.get("name")):
            continue
        episodes = item.get("total_episode_count") or 0
        rows.append((-episodes, item.get("order", 999), item["id"], item.get("popularity")))
    rows.sort(key=lambda row: (row[0], row[1]))
    return [(person_id, popularity) for _, _, person_id, popularity in rows[:TV_CAST_LIMIT]]


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
                is_animation=filters.is_animation(item.get("genre_ids")),
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
                character="Director",
                episode_count=None,
                poster_path=item.get("poster_path"),
                release_date=release_date,
                vote_average=item.get("vote_average"),
                is_animation=filters.is_animation(item.get("genre_ids")),
            )
        )

    response = ActorCreditsResponse(person_id=person_id, credits=credits_list)
    credits_cache.set(cache_key, response)
    return response
