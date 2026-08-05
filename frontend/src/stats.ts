/**
 * Kişisel istatistikler — tarayıcıda saklanır, sunucu ya da hesap gerekmez.
 * localStorage erişimi (gizli sekme, kapalı çerezler) her yerde try/catch'li.
 */

const STORAGE_KEY = 'dizilink:stats:v1'

export interface GameRecord {
  moves: number
  seconds: number
  startTitle: string
  targetTitle: string
  /** Unix ms */
  at: number
  /** En kısa çözümle eşleşti mi — solution gecikmeli geldiği için sonradan patchlenir. */
  optimal?: boolean
  /** Zincirde en az bir yönetmen bağlantısı kullanıldı mı */
  usedDirector?: boolean
}

interface StatsData {
  /** Başlatılan oyun sayısı — tamamlama oranı için */
  started: number
  wins: GameRecord[]
}

const EMPTY: StatsData = { started: 0, wins: [] }

function read(): StatsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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
    // Depolama yoksa istatistik tutmayı sessizce bırak — oyun yine oynanır.
  }
}

export function recordStart(): void {
  const data = read()
  write({ ...data, started: data.started + 1 })
}

export function recordWin(record: GameRecord): void {
  const data = read()
  // Son 100 oyunu tut, fazlası hem gereksiz hem de depolama şişirir.
  write({ ...data, wins: [...data.wins, record].slice(-100) })
}

export function clearStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // yoksay
  }
}

/** Rozet hesaplaması için tam liste — `.recent` gibi 10 kayıtla sınırlı değil. */
export function getAllWins(): GameRecord[] {
  return read().wins.slice()
}

/** Bir kazanımı `at` damgasından bulup üstüne yazar. Bulunamazsa sessizce vazgeçer. */
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
  /** En yeniden eskiye, en fazla 10 kayıt */
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
