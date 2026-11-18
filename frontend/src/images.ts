const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const posterUrl = (path: string, size: 'w92' | 'w154' | 'w185' = 'w154') =>
  `${IMAGE_BASE}/${size}${path}`

export const profileUrl = (path: string, size: 'w45' | 'w92' | 'w185' = 'w92') =>
  `${IMAGE_BASE}/${size}${path}`

/** Up to two initials, shown in place of a missing profile photo. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts
  return letters.map((part) => part[0]?.toLocaleUpperCase() ?? '').join('')
}
