import type { NewGameResponse } from '../types'
import MediaCard from './MediaCard'

interface GameHeaderProps {
  game: NewGameResponse | null
  onNewGame: () => void
}

export default function GameHeader({ game, onNewGame }: GameHeaderProps) {
  return (
    <div className="game-header">
      {game ? (
        <div className="game-header-cards">
          <MediaCard media={game.start} label="Başlangıç" />
          <span className="game-header-arrow">→</span>
          <MediaCard media={game.target} label="Hedef" />
        </div>
      ) : (
        <p>Başlangıç ve hedef için yeni bir oyun başlat.</p>
      )}
      <button onClick={onNewGame}>{game ? 'Yeni Oyun' : 'Oyuna Başla'}</button>
    </div>
  )
}
