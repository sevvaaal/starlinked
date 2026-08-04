"""Turns a path through the pool graph into a chain the player can read.

The graph knows which titles connect, but not *who* connects them in a way
worth showing — so for each hop we pick a shared actor and pull their name and
photo from the (already cached) cast of the title we are leaving.
"""

from . import lookups
from .pool_graph import MediaKey, PoolGraph
from .schemas import CastMember, MediaBrief, SolutionResponse, SolutionStep


async def _actor_linking(graph: PoolGraph, first: MediaKey, second: MediaKey) -> CastMember | None:
    shared = graph.shared_actors(first, second)
    if not shared:
        return None

    cast = (await lookups.get_media_cast(first[0], first[1])).cast
    # Prefer the highest-billed of the shared actors: the most recognisable one.
    for member in cast:
        if member.person_id in shared:
            return member
    return None


async def build_solution(
    graph: PoolGraph, start: MediaKey, target: MediaKey
) -> SolutionResponse | None:
    path = graph.shortest_path(start, target)
    if path is None or len(path) < 2:
        return None

    steps: list[SolutionStep] = []
    for first, second in zip(path, path[1:]):
        actor = await _actor_linking(graph, first, second)
        if actor is None:
            return None  # graph and cast data disagree; better no answer than a wrong one
        steps.append(SolutionStep(actor=actor, media=MediaBrief(**graph.media_by_key[second])))

    return SolutionResponse(
        start=MediaBrief(**graph.media_by_key[path[0]]),
        steps=steps,
        hops=len(steps),
    )
