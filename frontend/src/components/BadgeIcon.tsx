import type { CSSProperties } from 'react'

/**
 * A single-color pixel icon, drawn as a CSS mask so it takes the text color
 * of wherever it sits (dark on an unlocked badge, grey on a locked one).
 */
export default function BadgeIcon({ src, className = '' }: { src: string; className?: string }) {
  return (
    <span
      className={`badge-icon ${className}`.trim()}
      style={{ '--icon': `url("${src}")` } as CSSProperties}
      aria-hidden="true"
    />
  )
}
