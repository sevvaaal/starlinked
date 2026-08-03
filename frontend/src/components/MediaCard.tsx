import type { MediaBrief } from '../types'

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w185'

interface MediaCardProps {
  media: MediaBrief
  label?: string
}

export default function MediaCard({ media, label }: MediaCardProps) {
  return (
    <div className="media-card">
      {label && <span className="media-card-label">{label}</span>}
      {media.poster_path ? (
        <img src={`${POSTER_BASE_URL}${media.poster_path}`} alt={media.title} />
      ) : (
        <div className="media-card-placeholder" />
      )}
      <p className="media-card-title">{media.title}</p>
      <span className={`media-card-badge media-card-badge--${media.media_type}`}>
        {media.media_type === 'movie' ? 'Film' : 'Dizi'}
      </span>
    </div>
  )
}
