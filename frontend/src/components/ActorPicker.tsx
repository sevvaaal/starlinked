import { useState } from 'react'
import type { CastMember } from '../types'
import { profileUrl, initials } from '../images'

interface ActorPickerProps {
  cast: CastMember[]
  /** The rest of the cast: searchable, and shown in full on request */
  moreCast: CastMember[]
  directors: CastMember[]
  currentTitle: string
  /** Actor the current hint points to — pulled to the front and marked */
  hintActorId?: number | null
  onSelect: (actor: CastMember) => void
}

function matches(member: CastMember, query: string): boolean {
  return `${member.name} ${member.character}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
}

function subtitle(member: CastMember): string {
  if (!member.episode_count) return member.character
  const episodes = `${member.episode_count} ${member.episode_count === 1 ? 'ep' : 'eps'}`
  return member.character ? `${member.character} · ${episodes}` : episodes
}

export default function ActorPicker({
  cast,
  moreCast,
  directors,
  currentTitle,
  hintActorId = null,
  onSelect,
}: ActorPickerProps) {
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  // Searching always looks through the whole cast — the player may know a guest
  // star who isn't in the main list. Without a search, the extra cast is opt-in.
  const pool = query || showAll ? [...cast, ...moreCast] : cast
  const filtered = pool.filter((member) => matches(member, query))
  const hinted = filtered.find((member) => member.person_id === hintActorId)
  const ordered = hinted ? [hinted, ...filtered.filter((member) => member !== hinted)] : filtered

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
                    {initials(director.name)}
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
            placeholder={moreCast.length > 0 ? 'Search the full cast…' : 'Search actors…'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search actors"
          />
          {query && <span className="search-count">{filtered.length}</span>}
        </div>

        {ordered.length === 0 ? (
          <EmptyState
            hasQuery={query.length > 0}
            onClear={() => setQuery('')}
            emptyText="No cast information found for this title."
          />
        ) : (
          <div className="card-grid">
            {ordered.map((member) => (
              <button
                key={member.person_id}
                className={`pick-card${member === hinted ? ' pick-card--hint' : ''}`}
                onClick={() => onSelect(member)}
              >
                <div className="pick-card-poster">
                  {member === hinted && <span className="hint-badge">✧ Hint</span>}
                  {member.profile_path ? (
                    <img src={profileUrl(member.profile_path, 'w185')} alt="" loading="lazy" />
                  ) : (
                    <div className="pick-card-placeholder" aria-hidden="true">
                      {initials(member.name)}
                    </div>
                  )}
                </div>
                <span className="pick-card-title">{member.name}</span>
                <span className="pick-card-subtitle">{subtitle(member)}</span>
              </button>
            ))}
          </div>
        )}

        {!query && moreCast.length > 0 && (
          <div className="show-more-row">
            <button className="btn-ghost" onClick={() => setShowAll((value) => !value)}>
              {showAll ? 'Show main cast only' : `Show full cast (${moreCast.length} more)`}
            </button>
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
