import { useState } from 'react'
import type { GameStatus, NewGameResponse } from '../types'
import MediaCard from './MediaCard'
import CastPreviewModal from './CastPreviewModal'

interface GameHeaderProps {
  game: NewGameResponse | null
  status: GameStatus
  moves: number
  onNewGame: () => void
  /** Günlük bulmacada kapatılır — gün başına tek eşleşme var. */
  showNewGame?: boolean
}

export default function GameHeader({
  game,
  status,
  moves,
  onNewGame,
  showNewGame = true,
}: GameHeaderProps) {
  const [showTargetCast, setShowTargetCast] = useState(false)

  if (!game) {
    return (
      <div className="game-header">
        <button className="btn-primary btn-lg" onClick={onNewGame} disabled={status === 'loading'}>
          {status === 'loading' ? 'Hazırlanıyor…' : 'Oyuna Başla'}
        </button>
      </div>
    )
  }

  return (
    <div className="game-header">
      <div className="matchup">
        <MediaCard media={game.start} label="Başlangıç" tone="pink" />

        <div className="matchup-link" aria-hidden="true">
          <span className="matchup-track">
            <span className="matchup-dot" />
            <span className="matchup-dot" />
            <span className="matchup-dot" />
          </span>
          <span className="matchup-count">{moves > 0 ? `${moves} hamle` : 'bağla'}</span>
        </div>

        <button
          className="media-card-trigger"
          onClick={() => setShowTargetCast(true)}
          title="Hedefin kadrosuna göz at"
        >
          <MediaCard media={game.target} label="Hedef" tone="mint" />
        </button>
      </div>

      {showNewGame && status !== 'won' && (
        <button className="btn-ghost btn-ghost--quiet" onClick={onNewGame}>
          Yeni oyun
        </button>
      )}

      {showTargetCast && (
        <CastPreviewModal media={game.target} onClose={() => setShowTargetCast(false)} />
      )}
    </div>
  )
}
