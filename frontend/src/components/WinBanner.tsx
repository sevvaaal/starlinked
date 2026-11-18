import type { ChainNode, SolutionResponse } from '../types'
import ChainDisplay from './ChainDisplay'
import { solutionToChain } from './GiveUpBanner'

interface WinBannerProps {
  chain: ChainNode[]
  moves: number
  seconds: number
  /** Fetched in the background; null until it arrives. */
  solution: SolutionResponse | null
  /** Hints used — a hinted win is told apart from an unaided one */
  hints?: number
  onPlayAgain: () => void
}

function rating(moves: number): string {
  if (moves <= 2) return 'Legendary'
  if (moves <= 4) return 'Great'
  if (moves <= 6) return 'Nice work'
  return 'Completed'
}

export default function WinBanner({
  chain,
  moves,
  seconds,
  solution,
  hints = 0,
  onPlayAgain,
}: WinBannerProps) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  const beatenByShorter = solution !== null && solution.hops < moves

  return (
    <section className="win">
      <div className="win-card">
        <span className="win-rating">{rating(moves)}</span>
        <h2 className="win-title">You reached the target</h2>

        <div className="win-stats">
          <div className="win-stat">
            <span className="win-stat-value">{moves}</span>
            <span className="win-stat-label">moves</span>
          </div>
          <span className="win-stat-sep" aria-hidden="true" />
          <div className="win-stat">
            <span className="win-stat-value">
              {minutes}
              <small>m</small> {rest}
              <small>s</small>
            </span>
            <span className="win-stat-label">time</span>
          </div>
        </div>

        {hints > 0 && (
          <p className="win-optimal-note">
            💡 You used {hints} {hints === 1 ? 'hint' : 'hints'} this game.
          </p>
        )}

        {solution &&
          (beatenByShorter ? (
            <p className="win-optimal-note">
              The shortest path was <strong>{solution.hops} moves</strong> — see it below.
            </p>
          ) : (
            <p className="win-optimal-note win-optimal-note--best">
              🏅 You took the shortest path — it doesn't get better than that.
            </p>
          ))}

        <button className="btn-primary btn-lg" onClick={onPlayAgain}>
          Play again
        </button>
      </div>

      <div className="win-chain">
        <h3 className="win-chain-title">Your chain</h3>
        <ChainDisplay chain={chain} />
      </div>

      {beatenByShorter && solution && (
        <div className="win-chain">
          <h3 className="win-chain-title">Shortest solution — {solution.hops} moves</h3>
          <ChainDisplay chain={solutionToChain(solution)} showCurrent={false} />
        </div>
      )}
    </section>
  )
}
