"""Rules that keep "everyone shows up here" titles out of the game.

A late-night show like Jimmy Fallon's credits hundreds of unrelated actors as
guests, so it links almost any two titles in one hop and makes the puzzle
trivial. Two complementary rules catch these:

* **Genre** — talk / news / reality formats are structurally guest-driven, so
  they are dropped wholesale.
* **Credited role** — someone billed as "Self" is a guest appearing as
  themselves, not a cast member. This also catches awards nights, making-of
  featurettes and documentaries that no genre filter would.
"""

GENRE_ANIMATION = 16  # same id for movies and series
TV_GENRE_DOCUMENTARY = 99
TV_GENRE_NEWS = 10763
TV_GENRE_REALITY = 10764
TV_GENRE_TALK = 10767

# Documentary covers the "making of" / clip-show series (Marvel Studios
# Assembled and friends) that stitch together everyone who ever appeared in a
# franchise — same problem as a talk show.
EXCLUDED_TV_GENRES = frozenset(
    {TV_GENRE_DOCUMENTARY, TV_GENRE_NEWS, TV_GENRE_REALITY, TV_GENRE_TALK}
)

# discover/tv `without_genres`: pipe-separated means "exclude titles carrying
# ANY of these" (comma would mean ALL of them, which would let talk shows through).
EXCLUDED_TV_GENRES_PARAM = "|".join(str(genre_id) for genre_id in sorted(EXCLUDED_TV_GENRES))

_SELF_MARKERS = frozenset({"self", "himself", "herself", "themselves"})

# "Self - Guest", "Herself / Narrator", "Self (archive footage)" all reduce to
# the part before the first of these.
_ROLE_SEPARATORS = "(-–/,"


def is_animation(genre_ids) -> bool:
    """Animated titles are voice-cast, so players can opt out of them."""
    return GENRE_ANIMATION in (genre_ids or ())


def has_excluded_genre(genre_ids) -> bool:
    return bool(EXCLUDED_TV_GENRES.intersection(genre_ids or ()))


def is_self_appearance(character: str | None, actor_name: str | None = None) -> bool:
    """Whether a credited role means "appeared as themselves, not in a part".

    Pass `actor_name` where it's known: celebrities are often credited under
    their own name rather than "Self" (Conan O'Brien in The Office), and that
    spelling slips past the marker list.
    """
    if not character:
        return False

    lowered = character.strip().lower()

    # Archive footage isn't a performance — it shouldn't link two titles.
    if "archive footage" in lowered or "archive sound" in lowered:
        return True

    head = lowered
    for separator in _ROLE_SEPARATORS:
        head = head.split(separator)[0]
    head = head.strip()

    if head in _SELF_MARKERS:
        return True
    return bool(actor_name) and head == actor_name.strip().lower()
