/**
 * Small per-browser settings the player chose on the setup screen.
 * Like the stats, they live in localStorage and fail quietly without it.
 */

const STORAGE_KEY = 'starlinked:prefs:v1'

export interface Prefs {
  /** Leave animated movies and series out of free play (voice casts are hard to know). */
  excludeAnimation: boolean
}

const DEFAULTS: Prefs = { excludeAnimation: false }

export function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Prefs>
    return {
      excludeAnimation:
        typeof parsed.excludeAnimation === 'boolean' ? parsed.excludeAnimation : DEFAULTS.excludeAnimation,
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
