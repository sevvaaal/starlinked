import { useMemo, useState } from 'react'
import type { CreditItem } from '../types'
import { posterUrl } from '../images'
import { EmptyState } from './ActorPicker'

interface MediaPickerProps {
  credits: CreditItem[]
  actorName: string
  isDirector?: boolean
  onSelect: (credit: CreditItem) => void
}

type SortMode = 'rating' | 'newest' | 'oldest'

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'rating', label: 'Top rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
]

function sortCredits(list: CreditItem[], mode: SortMode): CreditItem[] {
  const sorted = [...list]
  if (mode === 'rating') {
    sorted.sort((a, b) => (b.vote_average ?? -1) - (a.vote_average ?? -1))
  } else if (mode === 'newest') {
    sorted.sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))
  } else {
    sorted.sort((a, b) => (a.release_date ?? '').localeCompare(b.release_date ?? ''))
  }
  return sorted
}

export default function MediaPicker({ credits, actorName, isDirector = false, onSelect }: MediaPickerProps) {
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('rating')

  const filtered = useMemo(
    () =>
      sortCredits(
        credits.filter((credit) =>
          credit.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
        ),
        sortMode,
      ),
    [credits, query, sortMode],
  )

  return (
    <section className="picker window--mint">
      <div className="window-bar">
        <span className="window-title">STEP_2 — PICK_TITLE</span>
        <span className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>

      <div className="picker-body">
        <div className="picker-head">
          <span className="step-badge step-badge--mint">Step 2</span>
          <h2>
            {isDirector ? 'What else did ' : 'What else was '}
            <span className="picker-subject picker-subject--mint">{actorName}</span>
            {isDirector ? ' direct?' : ' in?'}
          </h2>
        </div>

        <div className="search-box">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            placeholder="Search movies / TV…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search movies or TV shows"
          />
          {query && <span className="search-count">{filtered.length}</span>}
        </div>

        <div className="sort-row" role="group" aria-label="Sort">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`sort-btn${sortMode === option.value ? ' is-active' : ''}`}
              onClick={() => setSortMode(option.value)}
              aria-pressed={sortMode === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            hasQuery={query.length > 0}
            onClear={() => setQuery('')}
            emptyText="No other titles found for this person."
          />
        ) : (
          <div className="card-grid">
            {filtered.map((credit) => (
              <button
                key={`${credit.media_type}:${credit.media_id}`}
                className="pick-card"
                onClick={() => onSelect(credit)}
              >
                <div className="pick-card-poster">
                  {credit.poster_path ? (
                    <img src={posterUrl(credit.poster_path)} alt="" loading="lazy" />
                  ) : (
                    <div className="pick-card-placeholder" aria-hidden="true">
                      🎬
                    </div>
                  )}
                  <span className={`type-badge type-badge--${credit.media_type}`}>
                    {credit.media_type === 'movie' ? 'Movie' : 'TV'}
                  </span>
                  {credit.vote_average != null && credit.vote_average > 0 && (
                    <span className="rating-badge">★ {credit.vote_average.toFixed(1)}</span>
                  )}
                </div>
                <span className="pick-card-title">{credit.title}</span>
                <span className="pick-card-subtitle">{credit.character}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
