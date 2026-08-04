import type { ChainNode, SolutionResponse } from '../types'
import ChainDisplay from './ChainDisplay'
import { solutionToChain } from './GiveUpBanner'

interface WinBannerProps {
  chain: ChainNode[]
  moves: number
  seconds: number
  /** Arka planda getirilir; henüz gelmediyse null. */
  solution: SolutionResponse | null
  onPlayAgain: () => void
}

function rating(moves: number): string {
  if (moves <= 2) return 'Efsane'
  if (moves <= 4) return 'Çok iyi'
  if (moves <= 6) return 'İyi iş'
  return 'Tamamlandı'
}

export default function WinBanner({ chain, moves, seconds, solution, onPlayAgain }: WinBannerProps) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  const beatenByShorter = solution !== null && solution.hops < moves

  return (
    <section className="win">
      <div className="win-card">
        <span className="win-rating">{rating(moves)}</span>
        <h2 className="win-title">Hedefe ulaştın</h2>

        <div className="win-stats">
          <div className="win-stat">
            <span className="win-stat-value">{moves}</span>
            <span className="win-stat-label">hamle</span>
          </div>
          <span className="win-stat-sep" aria-hidden="true" />
          <div className="win-stat">
            <span className="win-stat-value">
              {minutes}
              <small>dk</small> {rest}
              <small>sn</small>
            </span>
            <span className="win-stat-label">süre</span>
          </div>
        </div>

        {solution &&
          (beatenByShorter ? (
            <p className="win-optimal-note">
              En kısa yol <strong>{solution.hops} hamle</strong>ymiş — aşağıda görebilirsin.
            </p>
          ) : (
            <p className="win-optimal-note win-optimal-note--best">
              🏅 En kısa yoldan gittin, bundan daha iyisi yok.
            </p>
          ))}

        <button className="btn-primary btn-lg" onClick={onPlayAgain}>
          Tekrar oyna
        </button>
      </div>

      <div className="win-chain">
        <h3 className="win-chain-title">Kurduğun zincir</h3>
        <ChainDisplay chain={chain} />
      </div>

      {beatenByShorter && solution && (
        <div className="win-chain">
          <h3 className="win-chain-title">En kısa çözüm — {solution.hops} hamle</h3>
          <ChainDisplay chain={solutionToChain(solution)} showCurrent={false} />
        </div>
      )}
    </section>
  )
}
