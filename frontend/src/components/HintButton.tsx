import { useGame } from '../game/GameContext'

/** HUD button: reveals the next step toward the target. Shared by free play and the daily. */
export default function HintButton() {
  const { status, hintStatus, hintsUsed, requestHint } = useGame()
  const playing = status === 'picking-actor' || status === 'picking-media'

  return (
    <button
      className="btn-ghost hint-btn"
      onClick={requestHint}
      disabled={!playing || hintStatus === 'loading'}
      title="Show which actor to pick next. Hints are noted on your result."
    >
      {hintStatus === 'loading' ? '✧ Thinking…' : '✧ Hint'}
      {hintsUsed > 0 && <span className="hint-count">{hintsUsed}</span>}
    </button>
  )
}
