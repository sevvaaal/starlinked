import type { ChainNode } from '../types'

interface WinBannerProps {
  chain: ChainNode[]
  onPlayAgain: () => void
}

export default function WinBanner({ chain, onPlayAgain }: WinBannerProps) {
  const hopCount = chain.filter((node) => node.kind === 'actor').length

  return (
    <div className="win-banner">
      <h2>Hedefe ulaştın!</h2>
      <p>{hopCount} bağlantı ile tamamladın.</p>
      <button onClick={onPlayAgain}>Tekrar Oyna</button>
    </div>
  )
}
