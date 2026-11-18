/**
 * Badge/achievement catalog — no separate "earned badges" list is stored.
 * Every unlock is computed on the fly from the raw history in stats.ts/daily.ts,
 * so it never disagrees with the source data, and "reset stats" resets badges too.
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
    id: 'first-link',
    title: 'First Link',
    description: 'Completed your first chain.',
    icon: '◎',
    tone: 'pink',
    isUnlocked: (d) => d.totalWins >= 1,
  },
  {
    id: 'legendary-move',
    title: 'Legendary Move',
    description: 'Reached the target in 2 moves or fewer.',
    icon: '✦',
    tone: 'yellow',
    isUnlocked: (d) => d.records.some((r) => r.moves <= 2),
  },
  {
    id: 'lightning',
    title: 'Lightning Fast',
    description: 'Won in under 30 seconds.',
    icon: 'ϟ',
    tone: 'yellow',
    isUnlocked: (d) => d.records.some((r) => r.seconds <= 30),
  },
  {
    id: 'five-wins',
    title: 'Link Apprentice',
    description: 'Completed 5 games.',
    icon: 'Ⅴ',
    tone: 'mint',
    isUnlocked: (d) => d.totalWins >= 5,
  },
  {
    id: 'twenty-five-wins',
    title: 'Link Master',
    description: 'Completed 25 games.',
    icon: 'ⅩⅩⅤ',
    tone: 'mint',
    isUnlocked: (d) => d.totalWins >= 25,
  },
  {
    id: 'hundred-wins',
    title: 'Link Legend',
    description: 'Completed 100 games.',
    icon: 'Ⅽ',
    tone: 'pink',
    isUnlocked: (d) => d.totalWins >= 100,
  },
  {
    id: 'three-day-streak',
    title: 'Habit Forming',
    description: 'Played the daily puzzle 3 days in a row.',
    icon: '③',
    tone: 'mint',
    isUnlocked: (d) => d.bestStreak >= 3,
  },
  {
    id: 'seven-day-streak',
    title: 'Week-Long Streak',
    description: 'Solved the daily puzzle 7 days in a row.',
    icon: '⑦',
    tone: 'mint',
    isUnlocked: (d) => d.bestStreak >= 7,
  },
  {
    id: 'thirty-day-streak',
    title: 'Monthly Champion',
    description: 'Solved the daily puzzle 30 days in a row.',
    icon: '㉚',
    tone: 'pink',
    isUnlocked: (d) => d.bestStreak >= 30,
  },
  {
    id: 'perfect-five',
    title: 'Perfect Five',
    description: 'Solved 5 daily puzzles at or under par.',
    icon: '★',
    tone: 'yellow',
    isUnlocked: (d) => d.perfectDays >= 5,
  },
  {
    id: 'shortest-path',
    title: 'Shortest Path',
    description: 'Completed a chain in the fewest possible moves.',
    icon: '⌖',
    tone: 'lilac',
    isUnlocked: (d) => d.records.some((r) => r.optimal === true),
  },
  {
    id: 'director-bridge',
    title: 'Director Bridge',
    description: 'Used a director as a link in your chain.',
    icon: '▶',
    tone: 'lilac',
    isUnlocked: (d) => d.records.some((r) => r.usedDirector === true),
  },
]

/** The whole catalog, in order, locked or not. The gallery renders this. */
export const BADGES: Badge[] = CATALOG.map(({ isUnlocked: _isUnlocked, ...badge }) => badge)

/** Currently unlocked badges — recomputed from raw data on every call. */
export function evaluateUnlockedBadges(): Badge[] {
  const data = collect()
  return CATALOG.filter((badge) => badge.isUnlocked(data)).map(
    ({ isUnlocked: _isUnlocked, ...badge }) => badge,
  )
}
