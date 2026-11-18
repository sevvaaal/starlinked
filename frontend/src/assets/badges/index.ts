/**
 * Badge icons from the HackerNoon Pixel Icon Library
 * (https://github.com/hackernoon/pixel-icon-library), CC BY 4.0.
 * Single-color SVGs, tinted with CSS (see BadgeIcon).
 */
import firstLink from './first-link.svg'
import legendaryMove from './legendary-move.svg'
import lightning from './lightning.svg'
import fiveWins from './five-wins.svg'
import twentyFiveWins from './twenty-five-wins.svg'
import hundredWins from './hundred-wins.svg'
import threeDayStreak from './three-day-streak.svg'
import sevenDayStreak from './seven-day-streak.svg'
import thirtyDayStreak from './thirty-day-streak.svg'
import perfectFive from './perfect-five.svg'
import shortestPath from './shortest-path.svg'
import directorBridge from './director-bridge.svg'

export const BADGE_ICONS = {
  'first-link': firstLink,
  'legendary-move': legendaryMove,
  lightning,
  'five-wins': fiveWins,
  'twenty-five-wins': twentyFiveWins,
  'hundred-wins': hundredWins,
  'three-day-streak': threeDayStreak,
  'seven-day-streak': sevenDayStreak,
  'thirty-day-streak': thirtyDayStreak,
  'perfect-five': perfectFive,
  'shortest-path': shortestPath,
  'director-bridge': directorBridge,
} as const
