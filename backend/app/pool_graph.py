"""In-memory connection graph over the popular-media pool.

Instead of searching TMDb live on every new game (dozens of requests, seconds
of latency), we fetch each pool title's cast *once*, build a
media <-> actor <-> media index in memory, and cache it. Picking a playable
pair then becomes a local BFS over a few hundred nodes — effectively instant.

The graph only contains pool titles, so it under-approximates the real TMDb
graph: a pair it reports as connected genuinely is (every edge is a real
shared cast member), while pairs connectable only through less popular titles
are simply never offered. That bias is a feature here — it keeps games
solvable with well-known titles.
"""

import asyncio
import random

from . import lookups, media_pool
from .cache import graph_cache
from .config import Settings

MediaKey = tuple[str, int]

GRAPH_KEY = "pool_graph"
MAX_CONCURRENT_REQUESTS = 15

# A target this many "shared actor" hops away from the start: far enough to be
# a puzzle, close enough to stay winnable.
MIN_HOPS = 2
MAX_HOPS = 4
START_ATTEMPTS = 40

_semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
_build_lock = asyncio.Lock()


class PoolGraph:
    def __init__(
        self,
        media_by_key: dict[MediaKey, dict],
        media_to_actors: dict[MediaKey, set[int]],
        actor_to_media: dict[int, set[MediaKey]],
    ) -> None:
        self.media_by_key = media_by_key
        self.media_to_actors = media_to_actors
        self.actor_to_media = actor_to_media

    def neighbours(self, key: MediaKey) -> set[MediaKey]:
        """Titles sharing at least one cast member with `key`."""
        found: set[MediaKey] = set()
        for actor_id in self.media_to_actors.get(key, ()):
            found |= self.actor_to_media.get(actor_id, set())
        found.discard(key)
        return found

    def reachable_with_depth(
        self, start: MediaKey, min_hops: int, max_hops: int
    ) -> list[tuple[MediaKey, int]]:
        """Titles between `min_hops` and `max_hops` hops away, with their hop count.

        BFS, so the depth reported for a title is its *shortest* distance from
        `start` — i.e. the fewest moves a perfect player would need.
        """
        seen = {start}
        frontier = {start}
        result: list[tuple[MediaKey, int]] = []

        for depth in range(1, max_hops + 1):
            next_frontier: set[MediaKey] = set()
            for key in frontier:
                next_frontier |= self.neighbours(key) - seen
            if not next_frontier:
                break
            seen |= next_frontier
            frontier = next_frontier
            if depth >= min_hops:
                result.extend((key, depth) for key in next_frontier)

        return result

    def reachable_within(self, start: MediaKey, min_hops: int, max_hops: int) -> list[MediaKey]:
        """Titles between `min_hops` and `max_hops` hops away from `start`."""
        return [key for key, _ in self.reachable_with_depth(start, min_hops, max_hops)]

    def shortest_path(self, start: MediaKey, target: MediaKey) -> list[MediaKey] | None:
        """The title-by-title path a perfect player would take, or None."""
        if start == target:
            return [start]

        came_from: dict[MediaKey, MediaKey] = {}
        seen = {start}
        frontier = [start]

        while frontier:
            next_frontier: list[MediaKey] = []
            for key in frontier:
                for neighbour in self.neighbours(key):
                    if neighbour in seen:
                        continue
                    seen.add(neighbour)
                    came_from[neighbour] = key
                    if neighbour == target:
                        path = [target]
                        while path[-1] != start:
                            path.append(came_from[path[-1]])
                        return list(reversed(path))
                    next_frontier.append(neighbour)
            frontier = next_frontier

        return None

    def shared_actors(self, first: MediaKey, second: MediaKey) -> set[int]:
        return self.media_to_actors.get(first, set()) & self.media_to_actors.get(second, set())


async def _fetch_cast(key: MediaKey):
    media_type, media_id = key
    async with _semaphore:
        return key, await lookups.get_media_cast(media_type, media_id)


async def _build_graph(settings: Settings) -> PoolGraph:
    pool = await media_pool.get_media_pool(settings)
    media_by_key = {(item["media_type"], item["id"]): item for item in pool}

    results = await asyncio.gather(
        *(_fetch_cast(key) for key in media_by_key), return_exceptions=True
    )

    media_to_actors: dict[MediaKey, set[int]] = {}
    actor_to_media: dict[int, set[MediaKey]] = {}
    for result in results:
        if isinstance(result, BaseException):
            continue  # one unavailable title shouldn't sink the whole graph
        key, cast_response = result
        actor_ids = {member.person_id for member in cast_response.cast}
        media_to_actors[key] = actor_ids
        for actor_id in actor_ids:
            actor_to_media.setdefault(actor_id, set()).add(key)

    return PoolGraph(media_by_key, media_to_actors, actor_to_media)


async def get_pool_graph(settings: Settings) -> PoolGraph:
    """The cached pool graph, building it on first use.

    The lock (plus the re-check inside it) means concurrent callers wait for
    one build instead of each kicking off their own few-hundred-request run.
    """
    cached = graph_cache.get(GRAPH_KEY)
    if cached is not None:
        return cached

    async with _build_lock:
        cached = graph_cache.get(GRAPH_KEY)
        if cached is not None:
            return cached
        graph = await _build_graph(settings)
        graph_cache.set(GRAPH_KEY, graph)
        return graph


def pick_seeded_pair(graph: PoolGraph, rng: random.Random) -> tuple[dict, dict, int] | None:
    """A start, a target reachable from it, and the shortest hop count between them.

    Everything is drawn from `rng` over *sorted* collections, so the same seed
    and the same pool always produce the same pair — that's what makes the
    daily puzzle identical for every player.
    """
    keys = sorted(graph.media_by_key)
    rng.shuffle(keys)

    for start_key in keys[:START_ATTEMPTS]:
        candidates = sorted(graph.reachable_with_depth(start_key, MIN_HOPS, MAX_HOPS))
        if candidates:
            target_key, hops = rng.choice(candidates)
            return graph.media_by_key[start_key], graph.media_by_key[target_key], hops

    return None


def pick_connectable_pair(graph: PoolGraph) -> tuple[dict, dict] | None:
    """A random start plus a target provably reachable from it, or None."""
    picked = pick_seeded_pair(graph, random.Random())
    if picked is None:
        return None
    start, target, _ = picked
    return start, target
