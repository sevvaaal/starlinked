import { useEffect, useState } from 'react'
import type { MediaBrief, SolutionResponse } from '../types'
import type { Badge } from '../achievements'
import { formatDuration } from '../stats'
import MediaCard from './MediaCard'
import BadgeIcon from './BadgeIcon'

interface ResultModalProps {
  status: 'won' | 'gave-up' | 'timeout'
  moves: number
  seconds: number
  solution: SolutionResponse | null
  /** Badges newly unlocked by this win — shown only when the player wins. */
  newBadges: Badge[]
  /** Hints used during the game */
  hints?: number
  /** Free-play level name, shown on the ticket and in the share text */
  levelName?: string
  start: MediaBrief
  target: MediaBrief
  onClose: () => void
  onPlayAgain: () => void
}

function buildShareText(
  status: ResultModalProps['status'],
  moves: number,
  seconds: number,
  hints: number,
  levelName?: string,
): string {
  const outcome = status === 'won' ? '◎' : '✕'
  const rail = `■${'━●'.repeat(Math.min(moves, 12))}━${outcome}`
  const line =
    status === 'won'
      ? `Connected in ${moves} ${moves === 1 ? 'move' : 'moves'} · ${formatDuration(seconds)}`
      : `${status === 'timeout' ? 'Ran out of time' : 'Gave up'} after ${moves} ${moves === 1 ? 'move' : 'moves'}`
  const hintNote = hints > 0 ? ` · ✧ ${hints}` : ''
  const header = levelName ? `starlinked · ${levelName}` : 'starlinked'
  return [header, rail, `${line}${hintNote}`, window.location.origin].join('\n')
}

/** Wordle-style result ticket — a dismissible pop-up shown when the game ends. */
export default function ResultModal({
  status,
  moves,
  seconds,
  solution,
  newBadges,
  hints = 0,
  levelName,
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
    const text = buildShareText(status, moves, seconds, hints, levelName)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setShareNote('Copied to clipboard')
    } catch {
      setShareNote('Couldn\'t share — you can copy the text manually')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="ticket"
        role="dialog"
        aria-modal="true"
        aria-label="Game result"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="ticket-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="ticket-posters">
          <MediaCard media={start} label="Start" tone="pink" size="lg" />
          <span className="ticket-posters-link" aria-hidden="true">
            →
          </span>
          <MediaCard media={target} label="Target" tone="mint" size="lg" />
        </div>

        <div className="ticket-divider" role="separator" aria-hidden="true" />

        <div className="ticket-stub">
          <span className={`ticket-eyebrow${isWin ? '' : ' ticket-eyebrow--muted'}`}>
            {isWin ? 'Connected' : status === 'timeout' ? 'Time\'s up' : 'You gave up'}
          </span>
          {levelName && <span className="ticket-level">{levelName}</span>}
          <h2 className="ticket-title">{isWin ? 'You reached the target' : 'Not this time'}</h2>

          <dl className="ticket-info">
            <div className="ticket-info-row">
              <dt>Moves</dt>
              <dd>{moves}</dd>
            </div>
            <div className="ticket-info-row">
              <dt>Time</dt>
              <dd>{formatDuration(seconds)}</dd>
            </div>
            {hints > 0 && (
              <div className="ticket-info-row">
                <dt>Hints</dt>
                <dd>{hints}</dd>
              </div>
            )}
            {solution && (
              <div className="ticket-info-row">
                <dt>Shortest</dt>
                <dd>{solution.hops}</dd>
              </div>
            )}
          </dl>

          {isWin && solution && (
            <p className="ticket-note">
              {beatenByShorter ? `The shortest path was ${solution.hops} ${solution.hops === 1 ? 'move' : 'moves'}.` : '★ You took the shortest path.'}
            </p>
          )}

          {isWin && newBadges.length > 0 && (
            <div className="ticket-badges">
              {newBadges.map((badge) => (
                <span key={badge.id} className="ticket-badge-chip">
                  <BadgeIcon src={badge.icon} /> New badge: {badge.title}
                </span>
              ))}
            </div>
          )}

          <span className="ticket-barcode" aria-hidden="true" />

          <div className="ticket-actions">
            <button className="btn-ghost" onClick={() => void handleShare()}>
              Share
            </button>
            <button className="btn-primary" onClick={onPlayAgain}>
              Play again
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
