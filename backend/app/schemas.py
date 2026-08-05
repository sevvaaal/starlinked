from typing import Literal

from pydantic import BaseModel

MediaType = Literal["movie", "tv"]


class MediaBrief(BaseModel):
    id: int
    media_type: MediaType
    title: str
    poster_path: str | None = None


class NewGameResponse(BaseModel):
    start: MediaBrief
    target: MediaBrief


class DailyGameResponse(BaseModel):
    """Same payload as a new game, plus what makes it *the* game of the day."""

    date: str
    number: int
    """Kaçıncı günlük bulmaca — paylaşım metninde geçer."""
    par: int
    """Shortest possible chain length in moves, over the pool graph."""
    next_in_seconds: int
    start: MediaBrief
    target: MediaBrief


class CastMember(BaseModel):
    person_id: int
    name: str
    character: str
    order: int
    profile_path: str | None = None
    is_director: bool = False


class MediaCastResponse(BaseModel):
    media_type: MediaType
    media_id: int
    cast: list[CastMember]
    directors: list[CastMember] = []


class CreditItem(BaseModel):
    media_id: int
    media_type: MediaType
    title: str
    character: str
    episode_count: int | None = None
    poster_path: str | None = None
    release_date: str | None = None
    vote_average: float | None = None


class ActorCreditsResponse(BaseModel):
    person_id: int
    credits: list[CreditItem]


class SolutionStep(BaseModel):
    """One hop: the shared actor, and the title they lead to."""

    actor: CastMember
    media: MediaBrief


class SolutionResponse(BaseModel):
    """A worked answer, shown when the player gives up."""

    start: MediaBrief
    steps: list[SolutionStep]
    hops: int


class MCQRoundResponse(BaseModel):
    """Çoktan seçmeli 'oyunculardan yapımı bul' turu — cevap açıkça gönderilir,
    tıpkı SolutionResponse gibi; client-side reveal ilerlemesi kontrol eder."""

    options: list[MediaBrief]
    answer: MediaBrief
    cast: list[CastMember]
