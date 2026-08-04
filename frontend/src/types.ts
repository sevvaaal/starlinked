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
  /** YYYY-AA-GG, oyunun saat dilimine göre */
  date: string
  /** Kaçıncı günlük bulmaca */
  number: number
  /** Hedef hamle sayısı — havuz grafındaki en kısa yol */
  par: number
  /** Yeni bulmacaya kalan saniye */
  next_in_seconds: number
}

export interface CastMember {
  person_id: number
  name: string
  character: string
  order: number
  profile_path: string | null
  is_director: boolean
}

export interface MediaCastResponse {
  media_type: MediaType
  media_id: number
  cast: CastMember[]
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
}

export interface ActorCreditsResponse {
  person_id: number
  credits: CreditItem[]
}

export interface SolutionStep {
  actor: CastMember
  media: MediaBrief
}

/** Pes edildiğinde gösterilen örnek çözüm */
export interface SolutionResponse {
  start: MediaBrief
  steps: SolutionStep[]
  hops: number
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
