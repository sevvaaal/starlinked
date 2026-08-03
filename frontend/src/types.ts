export type MediaType = 'movie' | 'tv'

export interface MediaBrief {
  id: number
  media_type: MediaType
  title: string
  poster_path: string | null
}

export interface NewGameResponse {
  start: MediaBrief
  target: MediaBrief
}

export interface CastMember {
  person_id: number
  name: string
  character: string
  order: number
  profile_path: string | null
}

export interface MediaCastResponse {
  media_type: MediaType
  media_id: number
  cast: CastMember[]
}

export interface CreditItem {
  media_id: number
  media_type: MediaType
  title: string
  character: string
  episode_count: number | null
  poster_path: string | null
  release_date: string | null
}

export interface ActorCreditsResponse {
  person_id: number
  credits: CreditItem[]
}

export type ChainNode =
  | { kind: 'media'; media: MediaBrief }
  | { kind: 'actor'; actor: CastMember }

export type GameStatus =
  | 'idle'
  | 'loading'
  | 'picking-actor'
  | 'picking-media'
  | 'won'
  | 'error'
