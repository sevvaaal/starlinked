import type { MediaBrief } from '../types'
import { posterUrl } from '../images'

interface MediaCardProps {
  media: MediaBrief
  label?: string
  size?: 'lg' | 'sm'
  /** Rol rengi: başlangıç pembe, hedef mint, ara adımlar nötr. */
  tone?: 'pink' | 'mint' | 'neutral'
}

export default function MediaCard({
  media,
  label,
  size = 'lg',
  tone = 'neutral',
}: MediaCardProps) {
  return (
    <div className={`media-card media-card--${size} tone-${tone}`}>
      {label && <span className="media-card-label">{label}</span>}
      <div className="media-card-poster">
        {media.poster_path ? (
          <img
            src={posterUrl(media.poster_path, size === 'lg' ? 'w185' : 'w92')}
            alt={media.title}
            loading="lazy"
          />
        ) : (
          <div className="media-card-placeholder" aria-hidden="true">
            🎬
          </div>
        )}
        <span className={`type-badge type-badge--${media.media_type}`}>
          {media.media_type === 'movie' ? 'Film' : 'Dizi'}
        </span>
      </div>
      <p className="media-card-title">{media.title}</p>
    </div>
  )
}
