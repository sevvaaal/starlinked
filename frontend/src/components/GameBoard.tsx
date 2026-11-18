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
    moreCast,
    directors,
    credits,
    selectedActor,
    status,
    error,
    hint,
    hintStatus,
    selectActor,
    selectMedia,
    backToCast,
  } = useGame()

  // A hint only applies to the title it was computed from.
  const activeHint =
    hint && currentMedia && hint.fromKey === `${currentMedia.media_type}:${currentMedia.id}` ? hint : null
  const hintMediaKey =
    activeHint && selectedActor?.person_id === activeHint.actor.person_id
      ? `${activeHint.media.media_type}:${activeHint.media.id}`
      : null

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

      {hintStatus === 'unavailable' && (status === 'picking-actor' || status === 'picking-media') && (
        <p className="hint-note" role="status">
          💡 No hint from here — this title isn't linked to the target in our title pool. Try a
          different path, or give up to see a solution.
        </p>
      )}

      {status === 'loading' && game && <SkeletonGrid />}

      {status === 'picking-actor' && currentMedia && (
        <ActorPicker
          key={`${currentMedia.media_type}:${currentMedia.id}`}
          cast={cast}
          moreCast={moreCast}
          directors={directors}
          currentTitle={currentMedia.title}
          hintActorId={activeHint?.actor.person_id ?? null}
          onSelect={selectActor}
        />
      )}

      {status === 'picking-media' && selectedActor && (
        <MediaPicker
          credits={credits}
          actorName={selectedActor.name}
          isDirector={selectedActor.is_director}
          hintKey={hintMediaKey}
          onSelect={selectMedia}
          onBack={backToCast}
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
