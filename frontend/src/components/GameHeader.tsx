import { useState } from 'react'
import type { GameStatus, NewGameResponse } from '../types'
import MediaCard from './MediaCard'
import CastPreviewModal from './CastPreviewModal'

interface GameHeaderProps {
  game: NewGameResponse | null
  status: GameStatus
  moves: number
  onNewGame: () => void
  /** Turned off for the daily puzzle — there's one matchup per day. */
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
          {status === 'loading' ? 'Getting ready…' : 'Start Game'}
        </button>
      </div>
    )
  }

  return (
    <div className="game-header">
      <div className="matchup">
        <MediaCard media={game.start} label="Start" tone="pink" />

        <div className="matchup-link" aria-hidden="true">
          <span className="matchup-track">
            <span className="matchup-dot" />
            <span className="matchup-dot" />
            <span className="matchup-dot" />
          </span>
          <span className="matchup-count">{moves > 0 ? `${moves} ${moves === 1 ? 'move' : 'moves'}` : 'connect'}</span>
        </div>

        <button
          className="media-card-trigger"
          onClick={() => setShowTargetCast(true)}
          title="Peek at the target's cast"
        >
          <MediaCard media={game.target} label="Target" tone="mint" />
        </button>
      </div>

      {showNewGame && status !== 'won' && (
        <button className="btn-ghost btn-ghost--quiet" onClick={onNewGame}>
          New game
        </button>
      )}

      {showTargetCast && (
        <CastPreviewModal media={game.target} onClose={() => setShowTargetCast(false)} />
      )}
    </div>
  )
}
