/**
 * Günlük bulmaca sonuçları — tarayıcıda saklanır, hesap gerekmez.
 * Genel istatistiklerden ayrı tutulur: burada gün gün seri (streak) tutuyoruz,
 * o yüzden kayıt anahtarı tarih.
 */

const STORAGE_KEY = 'dizilink:daily:v1'
const MAX_RESULTS = 365

export interface DailyResult {
  /** YYYY-AA-GG — sunucunun verdiği bulmaca günü */
  date: string
  number: number
  moves: number
  /** O gün için hedef hamle sayısı — havuzdaki en kısa yol */
  par: number
  seconds: number
  startTitle: string
  targetTitle: string
  /** Unix ms */
  at: number
}

function read(): DailyResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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
    // Depolama yoksa sessizce vazgeç — oyun yine oynanır, seri tutulmaz.
  }
}

/**
 * Bulmaca gününün istemci tarafındaki tahmini (sunucu +03:00 kullanır).
 * Sadece menü rozeti gibi kozmetik yerlerde kullanılır; asıl gün sunucudan gelir.
 */
export function puzzleDateNow(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function getDailyResult(date: string): DailyResult | null {
  return read().find((result) => result.date === date) ?? null
}

/** Aynı gün ikinci kez kazanmak kaydı bozmasın diye ilk sonuç korunur. */
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
  } catch {
    // yoksay
  }
}

/** YYYY-AA-GG tarihini gün cinsinden kaydırır (UTC'de hesaplanır, sapma olmaz). */
function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return shifted.toISOString().slice(0, 10)
}

export interface DailyStats {
  played: number
  currentStreak: number
  bestStreak: number
  /** Hedefi yakaladığın (ya da kırdığın) gün sayısı */
  perfect: number
  bestMoves: number | null
  averageMoves: number | null
  /** En yeniden eskiye, en fazla 10 kayıt */
  recent: DailyResult[]
}

/**
 * Seriler tarih üstünden hesaplanır: bugünkü bulmaca henüz oynanmadıysa seri
 * kırılmış sayılmaz — dünü oynadıysan seri bugün akşama kadar ayakta.
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
    perfect: results.filter((r) => r.moves <= r.par).length,
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

/** Paylaşım metni — spoiler yok, yapım adları geçmez. */
export function buildShareText(result: DailyResult, url: string): string {
  const perfect = result.moves <= result.par
  const rail = `🎬${'🔗'.repeat(Math.min(result.moves, 12))}🎯`
  const parNote = perfect ? ' ⭐' : ` (hedef ${result.par})`

  return [
    `dizilink · Günlük #${result.number}`,
    rail,
    `${result.moves} hamle${parNote} · ⏱ ${formatClock(result.seconds)}`,
    url,
  ].join('\n')
}

/** Geri sayım için "04:12:59" biçimi. */
export function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}
