const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const posterUrl = (path: string, size: 'w92' | 'w154' | 'w185' = 'w154') =>
  `${IMAGE_BASE}/${size}${path}`

export const profileUrl = (path: string, size: 'w45' | 'w92' | 'w185' = 'w92') =>
  `${IMAGE_BASE}/${size}${path}`
