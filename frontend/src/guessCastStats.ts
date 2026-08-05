/**
 * "Oyunculardan Film Bul" mini oyununun kişisel skoru — tarayıcıda saklanır.
 * stats.ts/daily.ts/achievements.ts'e bilinçli olarak karıştırılmıyor: farklı
 * bir mekanik/ölçek, bu turun kapsamı sadece kişisel en iyiyi göstermek.
 */

const STORAGE_KEY = 'dizilink:guess-cast:v1'

export interface GuessCastResult {
  /** Kaç oyuncu fotoğrafıyla bulundu — düşük daha iyi */
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

/** Sadece kişisel en iyiyi (en az açılan oyuncu sayısını) tutar. */
export function recordGuessCastWin(result: GuessCastResult): void {
  const best = read()
  if (best !== null && best.revealedCount <= result.revealedCount) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  } catch {
    // Depolama yoksa sessizce vazgeç — oyun yine oynanır.
  }
}

export function getBestGuessCastResult(): GuessCastResult | null {
  return read()
}
