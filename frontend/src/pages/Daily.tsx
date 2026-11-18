import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGame } from '../game/GameContext'
import GameHeader from '../components/GameHeader'
import GameBoard from '../components/GameBoard'
import GiveUpBanner from '../components/GiveUpBanner'
import ChainDisplay from '../components/ChainDisplay'
import HintButton from '../components/HintButton'
import { getDailyGame } from '../api'
import type { DailyGameResponse } from '../types'
import type { DailyResult } from '../daily'
import { buildShareText, formatCountdown, getDailyResult, getDailyStats, isPerfectDay } from '../daily'
import { formatDuration } from '../stats'

function formatDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function Daily() {
  const { chain, mode, daily, status, moves, elapsed, solution, startDailyGame, giveUp } = useGame()

  const [info, setInfo] = useState<DailyGameResponse | null>(null)
  const [infoError, setInfoError] = useState<string | null>(null)
  const [result, setResult] = useState<DailyResult | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [shareNote, setShareNote] = useState<string | null>(null)

  /**
   * Fetch the day's info first: if today's puzzle is already solved we never
   * start the game — like Wordle, one attempt per day.
   */
  const bootstrapped = useRef(false)
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    void (async () => {
      try {
        const response = await getDailyGame()
        setInfo(response)
        setCountdown(response.next_in_seconds)
        const existing = getDailyResult(response.date)
        if (existing) {
          setResult(existing)
        } else {
          startDailyGame()
        }
      } catch (err) {
        setInfoError(err instanceof Error ? err.message : 'Could not load today\'s puzzle')
      }
    })()
  }, [startDailyGame])

  // When the game is won, read the result from storage — the context writes the record.
  useEffect(() => {
    if (mode === 'daily' && status === 'won' && daily) {
      setResult(getDailyResult(daily.date))
    }
  }, [mode, status, daily])

  useEffect(() => {
    if (info === null) return
    const id = setInterval(
      () => setCountdown((value) => (value === null ? null : Math.max(value - 1, 0))),
      1000,
    )
    return () => clearInterval(id)
  }, [info])

  const handleShare = useCallback(async () => {
    if (!result) return
    const text = buildShareText(result, `${window.location.origin}/daily`)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setShareNote('Result copied to clipboard')
    } catch {
      // If sharing was cancelled there's nothing to say; if copying also fails
      // we leave a note so the user can select the text manually.
      setShareNote('Couldn\'t share — you can copy the text manually')
    }
  }, [result])

  if (infoError) {
    return (
      <div className="page page--play">
        <div className="alert" role="alert">
          <span className="alert-icon" aria-hidden="true">
            !
          </span>
          <div className="alert-body">
            <strong>Today's puzzle couldn't be loaded</strong>
            <span>{infoError}</span>
          </div>
          <button className="btn-ghost" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  const stats = info ? getDailyStats(info.date) : null
  const solved = result !== null
  const gaveUp = mode === 'daily' && status === 'gave-up'
  const showBoard = !solved && !gaveUp && mode === 'daily'

  return (
    <div className="page page--play">
      <header className="daily-head">
        <span className="daily-badge">
          Daily <strong>#{info ? info.number : '—'}</strong>
        </span>
        <p className="daily-date">{info ? formatDay(info.date) : 'Preparing today\'s puzzle…'}</p>
        {info && !solved && (
          <p className="daily-hint">
            Everyone plays the same matchup today. Par is{' '}
            <strong>{info.par} {info.par === 1 ? 'move' : 'moves'}</strong>.
          </p>
        )}
      </header>

      {showBoard && daily && status !== 'won' && (
        <div className="hud">
          <div className="hud-stats" aria-label="Game stats">
            <div className="stat">
              <span className="stat-value">{moves}</span>
              <span className="stat-label">moves</span>
            </div>
            <span className="stat-sep" aria-hidden="true" />
            <div className="stat">
              <span className="stat-value stat-value--mono">{formatDuration(elapsed)}</span>
              <span className="stat-label">time</span>
            </div>
            <span className="stat-sep" aria-hidden="true" />
            <div className="stat">
              <span className="stat-value">{daily.par}</span>
              <span className="stat-label">par</span>
            </div>
          </div>

          <div className="hud-actions">
            <HintButton />
            <button className="btn-ghost" onClick={giveUp} title="End today's puzzle and see the solution">
              Give up
            </button>
          </div>
        </div>
      )}

      {showBoard && (
        <>
          {/* No "new game" in the daily: one matchup per day. */}
          {daily && (
            <GameHeader
              game={daily}
              status={status}
              moves={moves}
              onNewGame={startDailyGame}
              showNewGame={false}
            />
          )}
          <GameBoard onRetry={startDailyGame} loadingLabel="Preparing today's matchup…" />
        </>
      )}

      {gaveUp && (
        <>
          <GiveUpBanner solution={solution} onPlayAgain={startDailyGame} showPlayAgain={false} />
          <div className="daily-next">
            {countdown !== null && countdown > 0 && (
              <>
                <span className="daily-next-label">Next puzzle in</span>
                <span className="daily-countdown">{formatCountdown(countdown)}</span>
              </>
            )}
            <Link to="/play" className="text-link">
              Try again in free play →
            </Link>
          </div>
        </>
      )}

      {solved && result && (
        <section className="daily-result">
          <div className="win-card">
            <span className="win-rating">
              {isPerfectDay(result) ? 'Perfect' : 'Completed'}
            </span>
            <h2 className="win-title">Daily #{result.number} solved</h2>
            <p className="daily-matchup">
              <span className="record-start">{result.startTitle}</span>
              <span className="record-arrow" aria-hidden="true">
                →
              </span>
              <span className="record-target">{result.targetTitle}</span>
            </p>
            {result.hints ? (
              <p className="win-optimal-note">
                ✧ Solved with {result.hints} {result.hints === 1 ? 'hint' : 'hints'}
              </p>
            ) : null}

            <div className="win-stats">
              <div className="win-stat">
                <span className="win-stat-value">{result.moves}</span>
                <span className="win-stat-label">moves</span>
              </div>
              <span className="win-stat-sep" aria-hidden="true" />
              <div className="win-stat">
                <span className="win-stat-value">{result.par}</span>
                <span className="win-stat-label">par</span>
              </div>
              <span className="win-stat-sep" aria-hidden="true" />
              <div className="win-stat">
                <span className="win-stat-value">{formatDuration(result.seconds)}</span>
                <span className="win-stat-label">time</span>
              </div>
            </div>

            <button className="btn-primary btn-lg" onClick={() => void handleShare()}>
              Share result
            </button>
            {shareNote && (
              <p className="daily-share-note" role="status">
                {shareNote}
              </p>
            )}
          </div>

          {stats && stats.played > 0 && (
            <div className="daily-streaks">
              <div className="mini-stat">
                <span className="mini-stat-value">{stats.currentStreak}</span>
                <span className="mini-stat-label">current streak</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-value">{stats.bestStreak}</span>
                <span className="mini-stat-label">best streak</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-value">{stats.played}</span>
                <span className="mini-stat-label">days played</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-value">{stats.perfect}</span>
                <span className="mini-stat-label">perfect days</span>
              </div>
            </div>
          )}

          <div className="daily-next">
            {countdown !== null && countdown > 0 ? (
              <>
                <span className="daily-next-label">Next puzzle in</span>
                <span className="daily-countdown">{formatCountdown(countdown)}</span>
              </>
            ) : (
              <button className="btn-ghost" onClick={() => window.location.reload()}>
                New puzzle ready — refresh
              </button>
            )}
            <Link to="/play" className="text-link">
              Don't want to wait? Play free mode →
            </Link>
          </div>

          {mode === 'daily' && status === 'won' && chain.length > 0 && (
            <div className="win-chain">
              <h3 className="win-chain-title">Your chain</h3>
              <ChainDisplay chain={chain} />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
