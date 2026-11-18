"""Free-play difficulty levels ("How cinephile are you?").

Each level has its own title pool, its own rule for which cast members count as
links when building the connection graph, and its own start-to-target distance.

* casual    — the most-voted titles of all time, linked only through top-billed
              or clearly famous actors, 2-3 moves apart.
* buff      — the original pool (what's popular right now), 2-4 moves apart.
              The daily puzzle's "buff" days use exactly this, so it must not
              change, or past daily puzzles would reshuffle.
* cinephile — a much deeper pool with classics, world cinema and acclaimed
              titles, 3-5 moves apart.
"""

import random
from dataclasses import dataclass
from typing import Literal

from .schemas import CastMember

LevelName = Literal["casual", "buff", "cinephile"]
LEVEL_NAMES: tuple[LevelName, ...] = ("casual", "buff", "cinephile")
DEFAULT_LEVEL: LevelName = "buff"


@dataclass(frozen=True)
class Discover:
    """One TMDb discover query: media type, sort order, minimum votes, pages to fetch."""

    media_type: Literal["movie", "tv"]
    sort_by: str
    vote_count_gte: int
    pages: int


@dataclass(frozen=True)
class Level:
    name: LevelName
    queries: tuple[Discover, ...]
    min_hops: int
    max_hops: int
    # Casual only: links must be top-billed, or famous enough to be recognised.
    top_billed: int | None = None
    famous_popularity: float | None = None
    # Casual only: no animated titles at all — voice casts aren't "everyone knows them".
    skip_animation: bool = False

    def links_through(self, position: int, member: CastMember) -> bool:
        """Whether this cast member (at `position` in billing order) can join two titles."""
        if self.top_billed is None:
            return True
        if position < self.top_billed:
            return True
        return (member.popularity or 0) >= (self.famous_popularity or float("inf"))


def _buff_queries(vote_count_gte: int, pages: int) -> tuple[Discover, ...]:
    return (
        Discover("movie", "popularity.desc", vote_count_gte, pages),
        Discover("tv", "popularity.desc", vote_count_gte, pages),
    )


def get_level(name: LevelName, vote_count_gte: int = 200, pages: int = 5) -> Level:
    """The level definition. `vote_count_gte` / `pages` come from settings (buff pool)."""
    if name == "casual":
        # Same number of movie and series pages, so the pool is about half and half.
        return Level(
            name="casual",
            queries=(
                Discover("movie", "vote_count.desc", 0, 4),
                Discover("tv", "vote_count.desc", 0, 4),
            ),
            min_hops=2,
            max_hops=3,
            top_billed=8,
            famous_popularity=3.0,
            skip_animation=True,
        )
    if name == "cinephile":
        return Level(
            name="cinephile",
            queries=(
                *_buff_queries(vote_count_gte, pages),
                Discover("movie", "vote_count.desc", 0, 14),
                Discover("movie", "vote_average.desc", 1500, 8),
                Discover("tv", "vote_count.desc", 0, 14),
                Discover("tv", "vote_average.desc", 600, 8),
            ),
            min_hops=3,
            max_hops=5,
        )
    return Level(name="buff", queries=_buff_queries(vote_count_gte, pages), min_hops=2, max_hops=4)


# The daily puzzle's level is drawn at random each day, seeded by the puzzle
# number so every player (and every server restart) gets the same one.
# Daily #322 (2026-11-18, the day levels were introduced) is pinned to "buff"
# so the puzzle players had already seen that day stays the same.
FIRST_LEVELED_DAY = 322


def daily_level(puzzle_number: int) -> LevelName:
    if puzzle_number <= FIRST_LEVELED_DAY:
        return "buff"
    return random.Random(f"daily-level-{puzzle_number}").choice(LEVEL_NAMES)
