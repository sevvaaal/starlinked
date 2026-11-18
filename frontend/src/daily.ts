/**
 * Daily puzzle results — stored in the browser, no account needed.
 * Kept apart from the general stats: this tracks day-by-day streaks,
 * so records are keyed by date.
 */

const STORAGE_KEY = 'starlinked:daily:v1'
/** Key used before the rename to Starlinked — still read so existing scores carry over. */
const LEGACY_STORAGE_KEY = 'dizilink:daily:v1'
const MAX_RESULTS = 365

export interface DailyResult {
  /** YYYY-MM-DD — the puzzle day as given by the server */
  date: string
  number: number
  moves: number
  /** Par for that day — the shortest path in the pool */
  par: number
  seconds: number
  startTitle: string
  targetTitle: string
  /** Unix ms */
  at: number
  /** Whether it matched the shortest solution — patched in later because the solution arrives late. */
  optimal?: boolean
  /** Whether at least one director link was used in the chain */
  usedDirector?: boolean
  /** Hints used during the game — a hinted game can't count as optimal or perfect */
  hints?: number
}

function read(): DailyResult[] {
  try {
    const raw = (localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as DailyResult[]) : []
  } catch {
    return []
  }
}

function write(results: DailyResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results.slice(-MAX_RESULTS)))
  } catch {
    // No storage? Quietly give up — the game still plays, the streak just isn't kept.
  }
}

/**
 * Client-side estimate of the puzzle day (the server uses +03:00).
 * Only used for cosmetic things like the menu dot; the real day comes from the server.
 */
export function puzzleDateNow(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** Matched or beat par without using any hints. */
export function isPerfectDay(result: Pick<DailyResult, 'moves' | 'par' | 'hints'>): boolean {
  return result.moves <= result.par && !result.hints
}

export function getDailyResult(date: string): DailyResult | null {
  return read().find((result) => result.date === date) ?? null
}

/** The first result is kept so winning a second time on the same day doesn't overwrite it. */
export function recordDailyResult(result: DailyResult): void {
  const results = read()
  if (results.some((existing) => existing.date === result.date)) return
  results.push(result)
  results.sort((a, b) => a.date.localeCompare(b.date))
  write(results)
}

export function clearDaily(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** Full list for badge calculation — not capped at 10 like `.recent`. */
export function getAllDailyResults(): DailyResult[] {
  return read().slice()
}

/** Finds a daily result by its `date` key and patches it. Does nothing if it isn't found. */
export function patchDailyResult(date: string, patch: Partial<Pick<DailyResult, 'optimal'>>): void {
  const results = read()
  const index = results.findIndex((result) => result.date === date)
  if (index === -1) return
  const next = results.slice()
  next[index] = { ...next[index], ...patch }
  write(next)
}

/** Shifts a YYYY-MM-DD date by a number of days (computed in UTC, so no drift). */
function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return shifted.toISOString().slice(0, 10)
}

export interface DailyStats {
  played: number
  currentStreak: number
  bestStreak: number
  /** Number of days you matched (or beat) par */
  perfect: number
  bestMoves: number | null
  averageMoves: number | null
  /** Newest to oldest, at most 10 records */
  recent: DailyResult[]
}

/**
 * Streaks are computed from dates: if today's puzzle hasn't been played yet the
 * streak isn't broken — if you played yesterday, it stays alive through today.
 */
export function getDailyStats(today: string): DailyStats {
  const results = read()
  if (results.length === 0) {
    return {
      played: 0,
      currentStreak: 0,
      bestStreak: 0,
      perfect: 0,
      bestMoves: null,
      averageMoves: null,
      recent: [],
    }
  }

  const dates = new Set(results.map((r) => r.date))

  let currentStreak = 0
  let cursor = dates.has(today) ? today : shiftDate(today, -1)
  while (dates.has(cursor)) {
    currentStreak += 1
    cursor = shiftDate(cursor, -1)
  }

  let bestStreak = 0
  let run = 0
  let previous: string | null = null
  for (const result of results) {
    run = previous !== null && shiftDate(previous, 1) === result.date ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
    previous = result.date
  }

  const moves = results.map((r) => r.moves)

  return {
    played: results.length,
    currentStreak,
    bestStreak,
    perfect: results.filter(isPerfectDay).length,
    bestMoves: Math.min(...moves),
    averageMoves: Math.round((moves.reduce((a, b) => a + b, 0) / results.length) * 10) / 10,
    recent: [...results].reverse().slice(0, 10),
  }
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Share text — no spoilers, no titles mentioned. */
export function buildShareText(result: DailyResult, url: string): string {
  const perfect = isPerfectDay(result)
  const rail = `■${'━●'.repeat(Math.min(result.moves, 12))}━◎`
  const parNote = perfect ? ' ★' : ` (par ${result.par})`
  const hintNote = result.hints ? ` · ✧ ${result.hints}` : ''

  return [
    `starlinked · Daily #${result.number}`,
    rail,
    `${result.moves} ${result.moves === 1 ? 'move' : 'moves'}${parNote}${hintNote} · ${formatClock(result.seconds)}`,
    url,
  ].join('\n')
}

/** "04:12:59" format for the countdown. */
export function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}
