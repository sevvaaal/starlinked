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

export interface DailyGameResponse extends NewGameResponse {
  /** YYYY-MM-DD, in the game's time zone */
  date: string
  /** Which daily puzzle number this is */
  number: number
  /** Par — the shortest path in the pool graph */
  par: number
  /** Seconds until the next puzzle */
  next_in_seconds: number
}

export interface CastMember {
  person_id: number
  name: string
  character: string
  order: number
  profile_path: string | null
  is_director: boolean
  /** Series only: episodes this person appeared in across the whole run */
  episode_count?: number | null
}

export interface MediaCastResponse {
  media_type: MediaType
  media_id: number
  cast: CastMember[]
  /** The rest of the cast — not shown up front, but searchable */
  more_cast: CastMember[]
  directors: CastMember[]
}

export interface CreditItem {
  media_id: number
  media_type: MediaType
  title: string
  character: string
  episode_count: number | null
  poster_path: string | null
  release_date: string | null
  vote_average: number | null
  is_animation: boolean
}

export interface ActorCreditsResponse {
  person_id: number
  credits: CreditItem[]
}

export interface SolutionStep {
  actor: CastMember
  media: MediaBrief
}

/** Example solution shown when the player gives up */
export interface SolutionResponse {
  start: MediaBrief
  steps: SolutionStep[]
  hops: number
}

/** Multiple-choice "guess the title from the cast" round */
export interface MCQRoundResponse {
  options: MediaBrief[]
  answer: MediaBrief
  cast: CastMember[]
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
  | 'gave-up'
  | 'timeout'
  | 'error'
