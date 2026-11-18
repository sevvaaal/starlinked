/**
 * Personal stats — stored in the browser, no server or account needed.
 * Every localStorage access is wrapped in try/catch (private tabs, blocked cookies).
 */

const STORAGE_KEY = 'starlinked:stats:v1'
/** Key used before the rename to Starlinked — still read so existing scores carry over. */
const LEGACY_STORAGE_KEY = 'dizilink:stats:v1'

export interface GameRecord {
  moves: number
  seconds: number
  startTitle: string
  targetTitle: string
  /** Unix ms */
  at: number
  /** Whether it matched the shortest solution — patched in later because the solution arrives late. */
  optimal?: boolean
  /** Whether at least one director link was used in the chain */
  usedDirector?: boolean
}

interface StatsData {
  /** Number of games started — for the completion rate */
  started: number
  wins: GameRecord[]
}

const EMPTY: StatsData = { started: 0, wins: [] }

function read(): StatsData {
  try {
    const raw = (localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY))
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<StatsData>
    return {
      started: typeof parsed.started === 'number' ? parsed.started : 0,
      wins: Array.isArray(parsed.wins) ? parsed.wins : [],
    }
  } catch {
    return EMPTY
  }
}

function write(data: StatsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // No storage? Quietly stop tracking stats — the game still plays.
  }
}

export function recordStart(): void {
  const data = read()
  write({ ...data, started: data.started + 1 })
}

export function recordWin(record: GameRecord): void {
  const data = read()
  // Keep the last 100 games; more is unnecessary and bloats storage.
  write({ ...data, wins: [...data.wins, record].slice(-100) })
}

export function clearStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** Full list for badge calculation — not capped at 10 like `.recent`. */
export function getAllWins(): GameRecord[] {
  return read().wins.slice()
}

/** Finds a win by its `at` timestamp and patches it. Does nothing if it isn't found. */
export function patchWin(at: number, patch: Partial<Pick<GameRecord, 'optimal'>>): void {
  const data = read()
  const index = data.wins.findIndex((win) => win.at === at)
  if (index === -1) return
  const wins = data.wins.slice()
  wins[index] = { ...wins[index], ...patch }
  write({ ...data, wins })
}

export interface StatsSummary {
  started: number
  won: number
  completionRate: number
  bestMoves: number | null
  averageMoves: number | null
  fastestSeconds: number | null
  totalSeconds: number
  /** Newest to oldest, at most 10 records */
  recent: GameRecord[]
}

export function getSummary(): StatsSummary {
  const { started, wins } = read()
  const won = wins.length

  if (won === 0) {
    return {
      started,
      won: 0,
      completionRate: 0,
      bestMoves: null,
      averageMoves: null,
      fastestSeconds: null,
      totalSeconds: 0,
      recent: [],
    }
  }

  const moves = wins.map((w) => w.moves)
  const totalSeconds = wins.reduce((sum, w) => sum + w.seconds, 0)

  return {
    started,
    won,
    completionRate: started > 0 ? Math.round((won / started) * 100) : 0,
    bestMoves: Math.min(...moves),
    averageMoves: Math.round((moves.reduce((a, b) => a + b, 0) / won) * 10) / 10,
    fastestSeconds: Math.min(...wins.map((w) => w.seconds)),
    totalSeconds,
    recent: [...wins].reverse().slice(0, 10),
  }
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
