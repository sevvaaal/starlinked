import type {
  ActorCreditsResponse,
  DailyGameResponse,
  MediaBrief,
  MediaCastResponse,
  MediaType,
  NewGameResponse,
  SolutionResponse,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`)
  }
  return response.json() as Promise<T>
}

export const getNewGame = () => request<NewGameResponse>('/api/new-game')

export const getDailyGame = () => request<DailyGameResponse>('/api/daily')

export const getMediaCast = (mediaType: MediaType, mediaId: number) =>
  request<MediaCastResponse>(`/api/media/${mediaType}/${mediaId}/cast`)

export const getActorCredits = (personId: number, role: 'cast' | 'director' = 'cast') =>
  request<ActorCreditsResponse>(`/api/actor/${personId}/credits?role=${role}`)

export const getSolution = (start: MediaBrief, target: MediaBrief) => {
  const query = new URLSearchParams({
    start_type: start.media_type,
    start_id: String(start.id),
    target_type: target.media_type,
    target_id: String(target.id),
  })
  return request<SolutionResponse>(`/api/solution?${query}`)
}
