import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MCQRoundResponse, MediaBrief } from '../types'
import { getMcqRound } from '../api'
import { posterUrl, profileUrl, initials } from '../images'
import { getBestGuessCastResult, recordGuessCastWin } from '../guessCastStats'

function mediaKey(media: MediaBrief): string {
  return `${media.media_type}:${media.id}`
}

function tier(revealedCount: number): string {
  if (revealedCount <= 1) return 'Legendary'
  if (revealedCount === 2) return 'Great'
  if (revealedCount === 3) return 'Nice work'
  return 'Completed'
}

type Status = 'loading' | 'error' | 'playing' | 'won'

/**
 * A standalone mini game — it doesn't touch GameContext at all. Pushing it into
 * the main game's state machine (chain building, time limits, solution lookup...)
 * would be needless complexity; here it's just "fetch a round → guess".
 */
export default function GuessTheCast() {
  const [round, setRound] = useState<MCQRoundResponse | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [revealedCount, setRevealedCount] = useState(1)
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set())
  const [best, setBest] = useState(() => getBestGuessCastResult())

  async function loadRound() {
    setStatus('loading')
    setError(null)
    setRevealedCount(1)
    setWrongIds(new Set())
    try {
      const response = await getMcqRound()
      setRound(response)
      setStatus('playing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the round')
      setStatus('error')
    }
  }

  const bootstrapped = useRef(false)
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    void loadRound()
  }, [])

  function handleGuess(option: MediaBrief) {
    if (!round || status !== 'playing') return
    if (mediaKey(option) === mediaKey(round.answer)) {
      setStatus('won')
      recordGuessCastWin({ revealedCount, at: Date.now() })
      setBest(getBestGuessCastResult())
      return
    }
    setWrongIds((prev) => new Set(prev).add(mediaKey(option)))
    setRevealedCount((count) => Math.min(count + 1, round.cast.length))
  }

  return (
    <div className="page page--doc">
      <header className="page-head">
        <span className="page-eyebrow">Mini Game</span>
        <h1 className="page-title">Guess from the Cast</h1>
        <p className="page-lead">
          Look at the cast photos and pick the right title out of 4 options. The fewer clues you
          need, the better your score.
        </p>
      </header>

      <section className="picker window--lilac">
        <div className="window-bar">
          <span className="window-title">GUESS_FROM_CAST</span>
          <span className="window-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>

        <div className="picker-body">
          {status === 'loading' && (
            <div className="page-loading">
              <span className="brand-mark brand-mark--spin" aria-hidden="true" />
              <p>Preparing a round…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="alert" role="alert">
              <span className="alert-icon" aria-hidden="true">
                !
              </span>
              <div className="alert-body">
                <strong>Something went wrong</strong>
                <span>{error}</span>
              </div>
              <button className="btn-ghost" onClick={() => void loadRound()}>
                Try again
              </button>
            </div>
          )}

          {round && (status === 'playing' || status === 'won') && (
            <>
              {status === 'won' ? (
                <div className="win-card">
                  <span className="win-rating">{tier(revealedCount)}</span>
                  <h2 className="win-title">{round.answer.title}</h2>
                  <div className="win-stats">
                    <div className="win-stat">
                      <span className="win-stat-value">{revealedCount}</span>
                      <span className="win-stat-label">{revealedCount === 1 ? 'clue' : 'clues'}</span>
                    </div>
                  </div>
                  {best && (
                    <p className="win-optimal-note">Personal best: {best.revealedCount} {best.revealedCount === 1 ? 'clue' : 'clues'}</p>
                  )}
                  <button className="btn-primary btn-lg" onClick={() => void loadRound()}>
                    New round
                  </button>
                </div>
              ) : (
                <div className="picker-head">
                  <span className="step-badge">
                    Clue {revealedCount}/{round.cast.length}
                  </span>
                  <h2>Which title do these actors share?</h2>
                </div>
              )}

              <div className="reveal-strip">
                {round.cast.slice(0, revealedCount).map((actor) => (
                  <div className="reveal-photo" key={actor.person_id} title={actor.name}>
                    {actor.profile_path ? (
                      <img src={profileUrl(actor.profile_path, 'w185')} alt={actor.name} loading="lazy" />
                    ) : (
                      <div className="pick-card-placeholder" aria-hidden="true">
                        {initials(actor.name)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="card-grid">
                {round.options.map((option) => {
                  const key = mediaKey(option)
                  const isWrong = wrongIds.has(key)
                  const isCorrect = status === 'won' && key === mediaKey(round.answer)
                  return (
                    <button
                      key={key}
                      className={`pick-card${isWrong ? ' pick-card--wrong' : ''}${isCorrect ? ' pick-card--correct' : ''}`}
                      onClick={() => handleGuess(option)}
                      disabled={isWrong || status === 'won'}
                    >
                      <div className="pick-card-poster">
                        {option.poster_path ? (
                          <img src={posterUrl(option.poster_path)} alt="" loading="lazy" />
                        ) : (
                          <div className="pick-card-placeholder" aria-hidden="true">
                            ✦
                          </div>
                        )}
                        <span className={`type-badge type-badge--${option.media_type}`}>
                          {option.media_type === 'movie' ? 'Movie' : 'TV'}
                        </span>
                      </div>
                      <span className="pick-card-title">{option.title}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <p className="doc-link-row">
        <Link to="/mini-games" className="text-link">
          ← Back to mini games
        </Link>
      </p>
    </div>
  )
}
