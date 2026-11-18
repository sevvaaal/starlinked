from typing import Literal

from fastapi import APIRouter, HTTPException

from . import daily, lookups, mcq, pool_graph, solution, tmdb_client
from .config import get_settings
from .schemas import (
    ActorCreditsResponse,
    DailyGameResponse,
    MCQRoundResponse,
    MediaBrief,
    MediaCastResponse,
    NewGameResponse,
    SolutionResponse,
)

router = APIRouter()


@router.get("/new-game", response_model=NewGameResponse)
async def new_game():
    settings = get_settings()
    try:
        graph = await pool_graph.get_pool_graph(settings)
    except tmdb_client.TMDbError as exc:
        raise HTTPException(502, "TMDb request failed") from exc

    pair = pool_graph.pick_connectable_pair(graph)
    if pair is None:
        raise HTTPException(502, "Could not build a solvable game from TMDb data")

    start, target = pair
    return NewGameResponse(start=MediaBrief(**start), target=MediaBrief(**target))


@router.get("/daily", response_model=DailyGameResponse)
async def daily_game():
    settings = get_settings()
    try:
        pair = await daily.get_daily_pair(settings)
    except tmdb_client.TMDbError as exc:
        raise HTTPException(502, "TMDb request failed") from exc

    if pair is None:
        raise HTTPException(502, "Could not build today's puzzle from TMDb data")

    start, target, par = pair
    day = daily.current_puzzle_date()
    return DailyGameResponse(
        date=day.isoformat(),
        number=daily.puzzle_number(day),
        par=par,
        next_in_seconds=daily.seconds_until_next_puzzle(),
        start=MediaBrief(**start),
        target=MediaBrief(**target),
    )


@router.get("/solution", response_model=SolutionResponse)
async def game_solution(
    start_type: Literal["movie", "tv"],
    start_id: int,
    target_type: Literal["movie", "tv"],
    target_id: int,
):
    """A worked answer for a matchup — served when the player gives up."""
    settings = get_settings()
    try:
        graph = await pool_graph.get_pool_graph(settings)
        answer = await solution.build_solution(
            graph, (start_type, start_id), (target_type, target_id)
        )
    except tmdb_client.TMDbError as exc:
        raise HTTPException(502, "TMDb request failed") from exc

    if answer is None:
        raise HTTPException(404, "No known chain between these titles")
    return answer


@router.get("/mcq-round", response_model=MCQRoundResponse)
async def mcq_round():
    """Multiple-choice 'guess the title from the cast' round — generated from the
    pool. Like /new-game and /daily it doesn't look up a specific ID, so on
    failure it returns 502 like they do, not /solution's 404."""
    settings = get_settings()
    try:
        round_ = await mcq.pick_mcq_round(settings)
    except tmdb_client.TMDbError as exc:
        raise HTTPException(502, "TMDb request failed") from exc

    if round_ is None:
        raise HTTPException(502, "Could not build a guess-the-cast round from TMDb data")

    return MCQRoundResponse(options=round_.options, answer=round_.answer, cast=round_.cast)


@router.get("/media/{media_type}/{media_id}/cast", response_model=MediaCastResponse)
async def media_cast(media_type: Literal["movie", "tv"], media_id: int):
    try:
        return await lookups.get_media_cast(media_type, media_id)
    except tmdb_client.TMDbError as exc:
        if exc.status_code == 404:
            raise HTTPException(404, "Media not found on TMDb") from exc
        raise HTTPException(502, "TMDb request failed") from exc


@router.get("/actor/{person_id}/credits", response_model=ActorCreditsResponse)
async def actor_credits(person_id: int, role: Literal["cast", "director"] = "cast"):
    try:
        if role == "director":
            return await lookups.get_person_directed_credits(person_id)
        return await lookups.get_actor_credits(person_id)
    except tmdb_client.TMDbError as exc:
        if exc.status_code == 404:
            raise HTTPException(404, "Person not found on TMDb") from exc
        raise HTTPException(502, "TMDb request failed") from exc
