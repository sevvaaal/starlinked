import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { ChainNode } from '../types'
import MediaCard from './MediaCard'
import { profileUrl } from '../images'

interface ChainDisplayProps {
  chain: ChainNode[]
  /** Turned off when showing a ready-made solution — the player isn't "standing" there. */
  showCurrent?: boolean
}

export default function ChainDisplay({ chain, showCurrent = true }: ChainDisplayProps) {
  const railRef = useRef<HTMLDivElement>(null)

  // Scroll to the last link as the chain grows so the user doesn't have to hunt for it.
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollTo({ left: rail.scrollWidth, behavior: 'smooth' })
  }, [chain.length])

  const lastIndex = Math.max(chain.length - 1, 1)

  return (
    <section className="chain" aria-label="Your chain">
      <div className="chain-rail" ref={railRef}>
        {chain.map((node, index) => {
          // 0 → pink (start), 1 → mint (approaching the target)
          const progress = index / lastIndex
          const isLast = index === chain.length - 1

          return (
            <div
              className="chain-item"
              key={node.kind === 'media' ? `m${node.media.id}-${index}` : `a${node.actor.person_id}-${index}`}
              style={{ '--t': progress } as CSSProperties}
            >
              {index > 0 && (
                <span className="chain-link" aria-hidden="true">
                  <span className="chain-link-line" />
                </span>
              )}
              {node.kind === 'media' ? (
                <div className={`chain-node${isLast && showCurrent ? ' chain-node--current' : ''}`}>
                  <MediaCard media={node.media} size="sm" />
                  {isLast && showCurrent && <span className="chain-here">you are here</span>}
                </div>
              ) : (
                <div className="chain-actor">
                  {node.actor.profile_path ? (
                    <img
                      className="chain-actor-avatar"
                      src={profileUrl(node.actor.profile_path, 'w92')}
                      alt={node.actor.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="chain-actor-avatar chain-actor-avatar--placeholder" aria-hidden="true">
                      🎭
                    </div>
                  )}
                  <span className="chain-actor-name">{node.actor.name}</span>
                  {node.actor.is_director && <span className="chain-actor-role">director</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
