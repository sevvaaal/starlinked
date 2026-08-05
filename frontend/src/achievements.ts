/**
 * Rozet/başarım kataloğu — hiçbir "kazanılan rozet" listesi ayrıca saklanmıyor.
 * Her açılış, stats.ts/daily.ts'teki ham geçmişten anlık hesaplanır: veri
 * kaynağıyla asla çelişmez, "istatistikleri sıfırla" otomatik olarak da sıfırlar.
 */

import type { GameRecord } from './stats'
import { getAllWins } from './stats'
import type { DailyResult } from './daily'
import { getAllDailyResults, getDailyStats, puzzleDateNow } from './daily'

export type BadgeTone = 'pink' | 'mint' | 'yellow' | 'lilac'

export interface Badge {
  id: string
  title: string
  description: string
  icon: string
  tone: BadgeTone
}

interface AchievementData {
  records: (GameRecord | DailyResult)[]
  totalWins: number
  bestStreak: number
  perfectDays: number
}

function collect(): AchievementData {
  const wins = getAllWins()
  const dailyResults = getAllDailyResults()
  const dailyStats = getDailyStats(puzzleDateNow())
  return {
    records: [...wins, ...dailyResults],
    totalWins: wins.length + dailyResults.length,
    bestStreak: dailyStats.bestStreak,
    perfectDays: dailyStats.perfect,
  }
}

interface BadgeDef extends Badge {
  isUnlocked: (data: AchievementData) => boolean
}

const CATALOG: BadgeDef[] = [
  {
    id: 'ilk-baglanti',
    title: 'İlk Bağlantı',
    description: 'İlk zincirini tamamladın.',
    icon: '🔗',
    tone: 'pink',
    isUnlocked: (d) => d.totalWins >= 1,
  },
  {
    id: 'efsane-hamle',
    title: 'Efsane Hamle',
    description: '2 hamle ya da daha azda hedefe ulaştın.',
    icon: '🌟',
    tone: 'yellow',
    isUnlocked: (d) => d.records.some((r) => r.moves <= 2),
  },
  {
    id: 'simsek',
    title: 'Şimşek Gibi',
    description: '30 saniyeden kısa sürede kazandın.',
    icon: '⚡',
    tone: 'yellow',
    isUnlocked: (d) => d.records.some((r) => r.seconds <= 30),
  },
  {
    id: 'bes-zafer',
    title: 'Bağlantı Çırağı',
    description: '5 oyun tamamladın.',
    icon: '🥉',
    tone: 'mint',
    isUnlocked: (d) => d.totalWins >= 5,
  },
  {
    id: 'yirmibes-zafer',
    title: 'Bağlantı Ustası',
    description: '25 oyun tamamladın.',
    icon: '🥈',
    tone: 'mint',
    isUnlocked: (d) => d.totalWins >= 25,
  },
  {
    id: 'yuz-zafer',
    title: 'Bağlantı Efsanesi',
    description: '100 oyun tamamladın.',
    icon: '🥇',
    tone: 'pink',
    isUnlocked: (d) => d.totalWins >= 100,
  },
  {
    id: 'uc-gunluk-seri',
    title: 'Alışkanlık',
    description: 'Günlük bulmacada 3 gün üst üste oynadın.',
    icon: '🔥',
    tone: 'mint',
    isUnlocked: (d) => d.bestStreak >= 3,
  },
  {
    id: 'yedi-gunluk-seri',
    title: 'Bir Haftalık Seri',
    description: '7 gün üst üste günlük bulmacayı çözdün.',
    icon: '🔥',
    tone: 'mint',
    isUnlocked: (d) => d.bestStreak >= 7,
  },
  {
    id: 'otuz-gunluk-seri',
    title: 'Aylık Şampiyon',
    description: '30 gün üst üste günlük bulmacayı çözdün.',
    icon: '🔥',
    tone: 'pink',
    isUnlocked: (d) => d.bestStreak >= 30,
  },
  {
    id: 'kusursuz-besli',
    title: 'Kusursuz Beşli',
    description: '5 günlük bulmacayı hedef hamlede ya da altında çözdün.',
    icon: '⭐',
    tone: 'yellow',
    isUnlocked: (d) => d.perfectDays >= 5,
  },
  {
    id: 'en-kisa-yol',
    title: 'En Kısa Yolu Buldun',
    description: 'Bir zinciri mümkün olan en kısa hamlede tamamladın.',
    icon: '🧭',
    tone: 'lilac',
    isUnlocked: (d) => d.records.some((r) => r.optimal === true),
  },
  {
    id: 'yonetmen-koprusu',
    title: 'Yönetmen Köprüsü',
    description: 'Zincirinde bir yönetmeni bağlantı olarak kullandın.',
    icon: '🎬',
    tone: 'lilac',
    isUnlocked: (d) => d.records.some((r) => r.usedDirector === true),
  },
]

/** Tüm katalog — sırayla, kilitli/açık ayrımı yapılmadan. Galeri bunu render eder. */
export const BADGES: Badge[] = CATALOG.map(({ isUnlocked: _isUnlocked, ...badge }) => badge)

/** Şu an açık olan rozetler — her çağrıda ham veriden yeniden hesaplanır. */
export function evaluateUnlockedBadges(): Badge[] {
  const data = collect()
  return CATALOG.filter((badge) => badge.isUnlocked(data)).map(
    ({ isUnlocked: _isUnlocked, ...badge }) => badge,
  )
}
