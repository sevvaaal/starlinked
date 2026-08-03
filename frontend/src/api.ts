import type {
  ActorCreditsResponse,
  MediaCastResponse,
  MediaType,
  NewGameResponse,
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

export const getMediaCast = (mediaType: MediaType, mediaId: number) =>
  request<MediaCastResponse>(`/api/media/${mediaType}/${mediaId}/cast`)

export const getActorCredits = (personId: number) =>
  request<ActorCreditsResponse>(`/api/actor/${personId}/credits`)
