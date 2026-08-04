import type { ChainNode, SolutionResponse } from '../types'
import ChainDisplay from './ChainDisplay'

interface GiveUpBannerProps {
  solution: SolutionResponse | null
  onPlayAgain: () => void
  /** Günlük bulmacada yeni oyun başlatılamaz — buton gizlenir. */
  showPlayAgain?: boolean
  /** 'timeout' ise süresi dolduğu için bittiğini anlatan metin gösterilir. */
  reason?: 'gave-up' | 'timeout'
}

/** Çözümü, oyuncunun kendi zinciriyle aynı görünen bir zincire çevirir. */
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
        <span className="win-rating win-rating--giveup">{isTimeout ? 'Süre doldu' : 'Pes ettin'}</span>
        <h2 className="win-title">{isTimeout ? 'Zaman yetmedi' : 'Bu sefer olmadı'}</h2>
        <p className="giveup-note">
          {solution
            ? `En kısa yol ${solution.hops} hamleymiş — işte bir çözüm.`
            : 'Bu eşleşme için örnek bir çözüm getirilemedi.'}
        </p>

        {showPlayAgain && (
          <button className="btn-primary btn-lg" onClick={onPlayAgain}>
            Yeni oyun
          </button>
        )}
      </div>

      {solution && (
        <div className="win-chain">
          <h3 className="win-chain-title">Örnek çözüm</h3>
          <ChainDisplay chain={solutionToChain(solution)} showCurrent={false} />
        </div>
      )}
    </section>
  )
}
