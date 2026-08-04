"""The daily puzzle: one shared start/target pair per calendar day.

Wordle-style — everybody who plays on the same day gets the same matchup, so
scores are comparable and shareable. The pair is derived from the day itself
(seeded RNG over the pool graph), not stored anywhere, so no database and no
scheduled job is needed.
"""

import asyncio
import random
from datetime import date, datetime, time, timedelta, timezone

from . import pool_graph
from .config import Settings

# The puzzle rolls over at local midnight in Turkey. Fixed +03:00 year round —
# no DST since 2016, so no tz database needed.
GAME_TZ = timezone(timedelta(hours=3))

# Puzzle #1. Only affects the number shown to players.
EPOCH = date(2026, 1, 1)

SEED_PREFIX = "dizilink-daily"

# Today's pair, kept for the whole day: {iso_date: (start, target, par)}.
# Deliberately not a TTLCache — expiry here is "the date changed", not a delay.
_cache: dict[str, tuple[dict, dict, int]] = {}
_lock = asyncio.Lock()


def current_puzzle_date() -> date:
    return datetime.now(GAME_TZ).date()


def puzzle_number(day: date) -> int:
    return (day - EPOCH).days + 1


def seconds_until_next_puzzle() -> int:
    """Seconds left until the next puzzle unlocks — drives the countdown."""
    now = datetime.now(GAME_TZ)
    tomorrow = datetime.combine(now.date() + timedelta(days=1), time.min, tzinfo=GAME_TZ)
    return max(int((tomorrow - now).total_seconds()), 0)


async def get_daily_pair(settings: Settings) -> tuple[dict, dict, int] | None:
    """Today's (start, target, par), or None if no solvable pair could be built.

    The pool the graph is built from shifts as TMDb popularity shifts, so the
    seed alone doesn't guarantee stability — caching the day's pick does, for
    the lifetime of this process. Players on the same server always agree.
    """
    key = current_puzzle_date().isoformat()
    cached = _cache.get(key)
    if cached is not None:
        return cached

    async with _lock:
        cached = _cache.get(key)
        if cached is not None:
            return cached

        graph = await pool_graph.get_pool_graph(settings)
        picked = pool_graph.pick_seeded_pair(graph, random.Random(f"{SEED_PREFIX}-{key}"))
        if picked is None:
            return None

        _cache.clear()  # yesterday's pair is dead weight
        _cache[key] = picked
        return picked
