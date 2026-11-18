"""Multiple-choice "guess the title from the cast" round.

Unlike `pool_graph`, this needs no connectivity, so we don't touch it at all —
it would force fetching the whole pool's cast up front. Instead it's built
directly on `media_pool` (the cached pool) and `lookups.get_media_cast`
(cached cast, sorted by billing order).
"""

import random
from dataclasses import dataclass

from . import lookups, media_pool
from .config import Settings
from .schemas import CastMember, MediaBrief

OPTION_COUNT = 4
DISTRACTOR_COUNT = OPTION_COUNT - 1

# With 4 options there can be at most 3 wrong guesses: 1 initial + at most 3
# extra reveals = 4 total. A 5th reveal can never trigger, so the cap lives
# here too.
CAST_REVEAL_COUNT = 4

# Retry limit for when a title's cast has too few photos.
MAX_PICK_ATTEMPTS = 8


@dataclass
class MCQRound:
    options: list[MediaBrief]
    answer: MediaBrief
    cast: list[CastMember]


def _photographed_cast(cast: list[CastMember]) -> list[CastMember]:
    """Billing order is preserved — TMDb often returns no profile_path for
    low-billed actors, and those can't be used as clues."""
    return [member for member in cast if member.profile_path is not None]


async def pick_mcq_round(settings: Settings) -> MCQRound | None:
    pool = await media_pool.get_media_pool(settings)
    if len(pool) < OPTION_COUNT:
        return None

    tried: set[tuple[str, int]] = set()
    for _ in range(MAX_PICK_ATTEMPTS):
        candidates = [item for item in pool if (item["media_type"], item["id"]) not in tried]
        if not candidates:
            break
        item = random.choice(candidates)
        tried.add((item["media_type"], item["id"]))

        cast_response = await lookups.get_media_cast(item["media_type"], item["id"])
        photographed = _photographed_cast(cast_response.cast)
        if len(photographed) < CAST_REVEAL_COUNT:
            continue

        answer = MediaBrief(**item)
        distractor_pool = [
            other for other in pool if (other["media_type"], other["id"]) != (item["media_type"], item["id"])
        ]
        distractors = random.sample(distractor_pool, DISTRACTOR_COUNT)
        options = [answer] + [MediaBrief(**d) for d in distractors]
        random.shuffle(options)

        return MCQRound(
            options=options,
            answer=answer,
            cast=photographed[:CAST_REVEAL_COUNT],
        )

    return None
