import { useEffect, useState } from 'react'
import type { MediaBrief, SolutionResponse } from '../types'
import type { Badge } from '../achievements'
import { formatDuration } from '../stats'
import MediaCard from './MediaCard'

interface ResultModalProps {
  status: 'won' | 'gave-up' | 'timeout'
  moves: number
  seconds: number
  solution: SolutionResponse | null
  /** Bu kazanımda yeni açılan rozetler — sadece kazanma durumunda gösterilir. */
  newBadges: Badge[]
  start: MediaBrief
  target: MediaBrief
  onClose: () => void
  onPlayAgain: () => void
}

function buildShareText(status: ResultModalProps['status'], moves: number, seconds: number): string {
  const outcomeEmoji = status === 'won' ? '🎯' : '❌'
  const rail = `🎬${'🔗'.repeat(Math.min(moves, 12))}${outcomeEmoji}`
  const line =
    status === 'won'
      ? `${moves} hamlede bağladım · ⏱ ${formatDuration(seconds)}`
      : `${moves} hamle sonra ${status === 'timeout' ? 'süre doldu' : 'pes ettim'}`
  return ['dizilink', rail, line, window.location.origin].join('\n')
}

/** Wordle tarzı sonuç bileti — oyun bitince açılan, kapatılabilen bir pop-up. */
export default function ResultModal({
  status,
  moves,
  seconds,
  solution,
  newBadges,
  start,
  target,
  onClose,
  onPlayAgain,
}: ResultModalProps) {
  const [shareNote, setShareNote] = useState<string | null>(null)
  const isWin = status === 'won'
  const beatenByShorter = solution !== null && solution.hops < moves

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

  async function handleShare() {
    const text = buildShareText(status, moves, seconds)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setShareNote('Panoya kopyalandı')
    } catch {
      setShareNote('Paylaşılamadı — metni elle kopyalayabilirsin')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="ticket"
        role="dialog"
        aria-modal="true"
        aria-label="Oyun sonucu"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="ticket-close" onClick={onClose} aria-label="Kapat">
          ✕
        </button>

        <div className="ticket-posters">
          <MediaCard media={start} label="Başlangıç" tone="pink" size="lg" />
          <span className="ticket-posters-link" aria-hidden="true">
            →
          </span>
          <MediaCard media={target} label="Hedef" tone="mint" size="lg" />
        </div>

        <div className="ticket-divider" role="separator" aria-hidden="true" />

        <div className="ticket-stub">
          <span className={`ticket-eyebrow${isWin ? '' : ' ticket-eyebrow--muted'}`}>
            {isWin ? 'Bağlandı' : status === 'timeout' ? 'Süre doldu' : 'Pes ettin'}
          </span>
          <h2 className="ticket-title">{isWin ? 'Hedefe ulaştın' : 'Bu sefer olmadı'}</h2>

          <dl className="ticket-info">
            <div className="ticket-info-row">
              <dt>Hamle</dt>
              <dd>{moves}</dd>
            </div>
            <div className="ticket-info-row">
              <dt>Süre</dt>
              <dd>{formatDuration(seconds)}</dd>
            </div>
            {solution && (
              <div className="ticket-info-row">
                <dt>En kısa</dt>
                <dd>{solution.hops}</dd>
              </div>
            )}
          </dl>

          {isWin && solution && (
            <p className="ticket-note">
              {beatenByShorter ? `En kısa yol ${solution.hops} hamleymiş.` : '🏅 En kısa yoldan gittin.'}
            </p>
          )}

          {isWin && newBadges.length > 0 && (
            <div className="ticket-badges">
              {newBadges.map((badge) => (
                <span key={badge.id} className="ticket-badge-chip">
                  {badge.icon} Yeni rozet: {badge.title}
                </span>
              ))}
            </div>
          )}

          <span className="ticket-barcode" aria-hidden="true" />

          <div className="ticket-actions">
            <button className="btn-ghost" onClick={() => void handleShare()}>
              Paylaş
            </button>
            <button className="btn-primary" onClick={onPlayAgain}>
              Tekrar oyna
            </button>
          </div>
          {shareNote && (
            <p className="ticket-share-note" role="status">
              {shareNote}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
