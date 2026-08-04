import { useEffect, useState } from 'react'
import type { CastMember, MediaBrief } from '../types'
import { getMediaCast } from '../api'
import { posterUrl, profileUrl } from '../images'

interface CastPreviewModalProps {
  media: MediaBrief
  onClose: () => void
}

/** Bir yapımın kadrosuna göz atma penceresi — sadece bilgi amaçlı, seçim yapmaz. */
export default function CastPreviewModal({ media, onClose }: CastPreviewModalProps) {
  const [cast, setCast] = useState<CastMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setCast(null)
    setError(null)
    getMediaCast(media.media_type, media.id)
      .then((response) => {
        if (!cancelled) setCast(response.cast)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Kadro alınamadı')
      })
    return () => {
      cancelled = true
    }
  }, [media.media_type, media.id])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal window window--mint"
        role="dialog"
        aria-modal="true"
        aria-label={`${media.title} kadrosu`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="window-bar">
          <span className="window-title">KADRO_ÖNİZLEME</span>
          <button className="modal-close" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-head">
            <div className="modal-poster">
              {media.poster_path ? (
                <img src={posterUrl(media.poster_path)} alt="" loading="lazy" />
              ) : (
                <div className="pick-card-placeholder" aria-hidden="true">
                  🎬
                </div>
              )}
              <span className={`type-badge type-badge--${media.media_type}`}>
                {media.media_type === 'movie' ? 'Film' : 'Dizi'}
              </span>
            </div>
            <h3 className="modal-head-title">{media.title}</h3>
          </div>

          {error && <p className="modal-error">{error}</p>}

          {!error && !cast && (
            <div className="card-grid" aria-busy="true" aria-live="polite">
              {Array.from({ length: 8 }, (_, index) => (
                <div className="pick-card pick-card--skeleton" key={index}>
                  <div className="skeleton pick-card-poster" />
                  <div className="skeleton skeleton-line" style={{ width: '80%', height: '11px' }} />
                  <div className="skeleton skeleton-line" style={{ width: '55%', height: '9px' }} />
                </div>
              ))}
              <span className="sr-only">Kadro yükleniyor</span>
            </div>
          )}

          {cast && cast.length === 0 && <p className="modal-error">Bu yapım için kadro bilgisi yok.</p>}

          {cast && cast.length > 0 && (
            <div className="card-grid">
              {cast.map((member) => (
                <div className="pick-card pick-card--static" key={member.person_id}>
                  <div className="pick-card-poster">
                    {member.profile_path ? (
                      <img src={profileUrl(member.profile_path, 'w185')} alt="" loading="lazy" />
                    ) : (
                      <div className="pick-card-placeholder" aria-hidden="true">
                        🎭
                      </div>
                    )}
                  </div>
                  <span className="pick-card-title">{member.name}</span>
                  <span className="pick-card-subtitle">{member.character}</span>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button className="btn-ghost" onClick={onClose}>
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
