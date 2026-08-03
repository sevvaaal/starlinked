import type { ChainNode } from '../types'
import MediaCard from './MediaCard'

interface ChainDisplayProps {
  chain: ChainNode[]
}

export default function ChainDisplay({ chain }: ChainDisplayProps) {
  return (
    <div className="chain-display">
      {chain.map((node, index) =>
        node.kind === 'media' ? (
          <MediaCard key={`media-${index}`} media={node.media} />
        ) : (
          <div key={`actor-${index}`} className="chain-actor">
            {node.actor.name}
          </div>
        ),
      )}
    </div>
  )
}
