/**
 * Personal score for the "Guess from the Cast" mini game — stored in the browser.
 * Deliberately kept out of stats.ts/daily.ts/achievements.ts: it's a different
 * mechanic and scale, and for now it only shows a personal best.
 */

// v2: rounds now open with 2 photos instead of 1, so older bests (often "1 clue")
// can't be compared and are left behind.
const STORAGE_KEY = 'starlinked:guess-cast:v2'

export interface GuessCastResult {
  /** How many actor photos it took — lower is better */
  revealedCount: number
  /** Unix ms */
  at: number
}

function read(): GuessCastResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GuessCastResult>
    if (typeof parsed.revealedCount !== 'number' || typeof parsed.at !== 'number') return null
    return { revealedCount: parsed.revealedCount, at: parsed.at }
  } catch {
    return null
  }
}

/** Keeps only the personal best (fewest actors revealed). */
export function recordGuessCastWin(result: GuessCastResult): void {
  const best = read()
  if (best !== null && best.revealedCount <= result.revealedCount) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  } catch {
    // No storage? Quietly give up — the game still plays.
  }
}

export function getBestGuessCastResult(): GuessCastResult | null {
  return read()
}
