import { useState } from 'react'
import type { CastMember } from '../types'
import { profileUrl } from '../images'

interface ActorPickerProps {
  cast: CastMember[]
  directors: CastMember[]
  currentTitle: string
  onSelect: (actor: CastMember) => void
}

export default function ActorPicker({ cast, directors, currentTitle, onSelect }: ActorPickerProps) {
  const [query, setQuery] = useState('')
  const filtered = cast.filter((member) =>
    `${member.name} ${member.character}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  )

  return (
    <section className="picker window--pink">
      <div className="window-bar">
        <span className="window-title">STEP_1 — PICK_ACTOR</span>
        <span className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>

      <div className="picker-body">
        <div className="picker-head">
          <span className="step-badge">Step 1</span>
          <h2>
            Pick an actor from the cast of{' '}
            <span className="picker-subject picker-subject--pink">{currentTitle}</span>
          </h2>
        </div>

        {directors.length > 0 && (
          <div className="director-row" aria-label="Connect through the director">
            {directors.map((director) => (
              <button
                key={director.person_id}
                className="director-chip"
                onClick={() => onSelect(director)}
                title={`Opens other titles directed by ${director.name}`}
              >
                {director.profile_path ? (
                  <img src={profileUrl(director.profile_path, 'w92')} alt="" loading="lazy" />
                ) : (
                  <span className="director-chip-placeholder" aria-hidden="true">
                    🎬
                  </span>
                )}
                <span className="director-chip-info">
                  <span className="director-chip-label">Director</span>
                  <span className="director-chip-name">{director.name}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="search-box">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            placeholder="Search actors…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search actors"
          />
          {query && <span className="search-count">{filtered.length}</span>}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            hasQuery={query.length > 0}
            onClear={() => setQuery('')}
            emptyText="No cast information found for this title."
          />
        ) : (
          <div className="card-grid">
            {filtered.map((member) => (
              <button key={member.person_id} className="pick-card" onClick={() => onSelect(member)}>
                <div className="pick-card-poster">
                  {member.profile_path ? (
                    <img src={profileUrl(member.profile_path, 'w185')} alt="" loading="lazy" />
                  ) : (
                    <div className="pick-card-placeholder" aria-hidden="true">
                      🎭
                    </div>
                  )}
                </div>
                <span className="pick-card-title">{member.name}</span>
                <span className="pick-card-subtitle">{member.character}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

interface EmptyStateProps {
  hasQuery: boolean
  onClear: () => void
  emptyText: string
}

export function EmptyState({ hasQuery, onClear, emptyText }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        ⌕
      </span>
      <p>{hasQuery ? 'Nothing matches your search.' : emptyText}</p>
      {hasQuery && (
        <button className="btn-ghost" onClick={onClear}>
          Clear search
        </button>
      )}
    </div>
  )
}
