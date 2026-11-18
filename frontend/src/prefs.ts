import type { LevelId } from './levels'
import type { MediaMix } from './levels'
import { DEFAULT_LEVEL, isLevelId, isMediaMix } from './levels'

/**
 * Small per-browser settings the player chose on the setup screen.
 * Like the stats, they live in localStorage and fail quietly without it.
 */

const STORAGE_KEY = 'starlinked:prefs:v1'

export interface Prefs {
  /** Leave animated movies and series out of free play (voice casts are hard to know). */
  excludeAnimation: boolean
  /** The hover "tik" sound */
  soundOn: boolean
  /** Free-play level picked on the setup screen */
  level: LevelId
  /** Free play: movies only, TV only, or both */
  media: MediaMix
}

const DEFAULTS: Prefs = { excludeAnimation: false, soundOn: true, level: DEFAULT_LEVEL, media: 'mixed' }

export function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Prefs>
    return {
      excludeAnimation:
        typeof parsed.excludeAnimation === 'boolean' ? parsed.excludeAnimation : DEFAULTS.excludeAnimation,
      soundOn: typeof parsed.soundOn === 'boolean' ? parsed.soundOn : DEFAULTS.soundOn,
      level: isLevelId(parsed.level) ? parsed.level : DEFAULTS.level,
      media: isMediaMix(parsed.media) ? parsed.media : DEFAULTS.media,
    }
  } catch {
    return DEFAULTS
  }
}

export function writePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // No storage? The choice just won't be remembered next time.
  }
}
