/** Free-play difficulty levels ("How cinephile are you?"). The backend knows them by `id`. */

export type LevelId = 'casual' | 'buff' | 'cinephile'

export interface LevelInfo {
  id: LevelId
  /** What the player sees: the level's name */
  name: string
  /** One line on what kind of titles to expect */
  blurb: string
}

export const LEVELS: LevelInfo[] = [
  {
    id: 'casual',
    name: 'Just here for the popcorn',
    blurb: 'Blockbusters and hit shows everyone knows, linked by famous faces.',
  },
  {
    id: 'buff',
    name: 'I watch movies to log them on Letterboxd',
    blurb: "What's popular right now, old and new. A few longer chains.",
  },
  {
    id: 'cinephile',
    name: "I'd watch a black-and-white French film",
    blurb: 'Classics, world cinema and deep cuts. The longest chains.',
  },
]

export const DEFAULT_LEVEL: LevelId = 'casual'

/** Free play can keep to one kind of title. */
export type MediaMix = 'mixed' | 'movie' | 'tv'

export const MEDIA_MIXES: { id: MediaMix; label: string }[] = [
  { id: 'mixed', label: 'Both' },
  { id: 'movie', label: 'Movies only' },
  { id: 'tv', label: 'TV shows only' },
]

export function isMediaMix(value: unknown): value is MediaMix {
  return value === 'mixed' || value === 'movie' || value === 'tv'
}

export function levelInfo(id: LevelId | undefined | null): LevelInfo {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[1]
}

export function isLevelId(value: unknown): value is LevelId {
  return value === 'casual' || value === 'buff' || value === 'cinephile'
}
