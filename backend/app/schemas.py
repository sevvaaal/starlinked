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


class CastMember(BaseModel):
    person_id: int
    name: str
    character: str
    order: int
    profile_path: str | None = None


class MediaCastResponse(BaseModel):
    media_type: MediaType
    media_id: int
    cast: list[CastMember]


class CreditItem(BaseModel):
    media_id: int
    media_type: MediaType
    title: str
    character: str
    episode_count: int | None = None
    poster_path: str | None = None
    release_date: str | None = None


class ActorCreditsResponse(BaseModel):
    person_id: int
    credits: list[CreditItem]
