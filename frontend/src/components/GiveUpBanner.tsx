import type { ChainNode, SolutionResponse } from '../types'
import ChainDisplay from './ChainDisplay'

interface GiveUpBannerProps {
  solution: SolutionResponse | null
  onPlayAgain: () => void
  /** A new game can't be started from the daily puzzle — the button is hidden. */
  showPlayAgain?: boolean
  /** With 'timeout', the text explains the game ended because time ran out. */
  reason?: 'gave-up' | 'timeout'
}

/** Turns a solution into a chain that looks just like the player's own. */
export function solutionToChain(solution: SolutionResponse): ChainNode[] {
  const nodes: ChainNode[] = [{ kind: 'media', media: solution.start }]
  for (const step of solution.steps) {
    nodes.push({ kind: 'actor', actor: step.actor })
    nodes.push({ kind: 'media', media: step.media })
  }
  return nodes
}

export default function GiveUpBanner({
  solution,
  onPlayAgain,
  showPlayAgain = true,
  reason = 'gave-up',
}: GiveUpBannerProps) {
  const isTimeout = reason === 'timeout'

  return (
    <section className="win">
      <div className="win-card">
        <span className="win-rating win-rating--giveup">{isTimeout ? 'Time\'s up' : 'You gave up'}</span>
        <h2 className="win-title">{isTimeout ? 'Out of time' : 'Not this time'}</h2>
        <p className="giveup-note">
          {solution
            ? `The shortest path was ${solution.hops} ${solution.hops === 1 ? 'move' : 'moves'} — here's one solution.`
            : 'Could not load an example solution for this matchup.'}
        </p>

        {showPlayAgain && (
          <button className="btn-primary btn-lg" onClick={onPlayAgain}>
            New game
          </button>
        )}
      </div>

      {solution && (
        <div className="win-chain">
          <h3 className="win-chain-title">Example solution</h3>
          <ChainDisplay chain={solutionToChain(solution)} showCurrent={false} />
        </div>
      )}
    </section>
  )
}
