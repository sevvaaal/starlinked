import { useGame } from '../game/GameContext'
import ChainDisplay from './ChainDisplay'
import ActorPicker from './ActorPicker'
import MediaPicker from './MediaPicker'
import SkeletonGrid from './SkeletonGrid'

interface GameBoardProps {
  /** Which game "try again" should start after an error */
  onRetry: () => void
  /** Text shown on the initial loading screen */
  loadingLabel?: string
}

/**
 * Game board: chain + picker grids. Free play and the daily puzzle share
 * the same board; only the header/HUD on top differs.
 */
export default function GameBoard({ onRetry, loadingLabel }: GameBoardProps) {
  const {
    game,
    chain,
    currentMedia,
    cast,
    directors,
    credits,
    selectedActor,
    status,
    error,
    selectActor,
    selectMedia,
  } = useGame()

  return (
    <>
      {status === 'error' && error && (
        <div className="alert" role="alert">
          <span className="alert-icon" aria-hidden="true">
            !
          </span>
          <div className="alert-body">
            <strong>Something went wrong</strong>
            <span>{error}</span>
          </div>
          <button className="btn-ghost" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      {game !== null && status !== 'won' && status !== 'gave-up' && chain.length > 0 && (
        <ChainDisplay chain={chain} />
      )}

      {status === 'loading' && game && <SkeletonGrid />}

      {status === 'picking-actor' && currentMedia && (
        <ActorPicker
          cast={cast}
          directors={directors}
          currentTitle={currentMedia.title}
          onSelect={selectActor}
        />
      )}

      {status === 'picking-media' && selectedActor && (
        <MediaPicker
          credits={credits}
          actorName={selectedActor.name}
          isDirector={selectedActor.is_director}
          onSelect={selectMedia}
        />
      )}

      {status === 'loading' && !game && (
        <div className="page-loading">
          <span className="brand-mark brand-mark--spin" aria-hidden="true" />
          <p>{loadingLabel ?? 'Setting up a new matchup…'}</p>
        </div>
      )}
    </>
  )
}
