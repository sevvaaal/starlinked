import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext'
import GameHeader from '../components/GameHeader'
import GameBoard from '../components/GameBoard'
import WinBanner from '../components/WinBanner'
import GiveUpBanner from '../components/GiveUpBanner'
import ResultModal from '../components/ResultModal'
import { formatDuration } from '../stats'

const DURATION_OPTIONS: { value: number | null; label: string }[] = [
  { value: 60, label: '1 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
  { value: null, label: 'Unlimited' },
]

export default function Play() {
  const {
    game,
    mode,
    chain,
    status,
    moves,
    elapsed,
    durationSeconds,
    setDurationSeconds,
    timeLeft,
    solution,
    newlyUnlockedBadges,
    startNewGame,
    resetToSetup,
    giveUp,
  } = useGame()

  const showGame = mode === 'free'
  const isFinished = status === 'won' || status === 'gave-up' || status === 'timeout'
  const timeCritical = timeLeft !== null && timeLeft <= 20

  // If we land here with a daily puzzle still in progress (e.g. after switching
  // tabs), switch to free play so the two modes' screens don't get mixed up.
  const resetOnDailyLeak = useRef(false)
  useEffect(() => {
    if (resetOnDailyLeak.current) return
    resetOnDailyLeak.current = true
    if (mode === 'daily') resetToSetup()
  }, [mode, resetToSetup])

  // Each time a game ends, its ticket opens once on its own — like in Wordle.
  // If the user closes it, the full result screen below (WinBanner/GiveUpBanner) stays.
  const [ticketOpen, setTicketOpen] = useState(false)
  const ticketShownRef = useRef(false)
  useEffect(() => {
    if (showGame && isFinished && !ticketShownRef.current) {
      ticketShownRef.current = true
      setTicketOpen(true)
    }
    if (!isFinished) {
      ticketShownRef.current = false
    }
  }, [showGame, isFinished])

  // If no game has started yet, show the time-limit picker so the game
  // doesn't start by itself as soon as you open /play.
  if (status === 'idle') {
    return (
      <div className="page page--play">
        <section className="setup window window--yellow">
          <div className="window-bar">
            <span className="window-title">GAME_SETUP</span>
            <span className="window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
          <div className="window-body setup-body">
            <h2 className="setup-title">Choose a time limit</h2>
            <p className="setup-lead">
              Decide how many minutes you get to reach the target — or play with no limit.
            </p>
            <div className="duration-row" role="group" aria-label="Time limit">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  className={`duration-btn${durationSeconds === option.value ? ' is-active' : ''}`}
                  onClick={() => setDurationSeconds(option.value)}
                  aria-pressed={durationSeconds === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button className="btn-primary btn-lg" onClick={() => startNewGame()}>
              Start game
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page page--play">
      {showGame && game && !isFinished && (
        <div className="hud">
          <div className="hud-stats" aria-label="Game stats">
            <div className="stat">
              <span className="stat-value">{moves}</span>
              <span className="stat-label">moves</span>
            </div>
            <span className="stat-sep" aria-hidden="true" />
            <div className="stat">
              <span className={`stat-value stat-value--mono${timeCritical ? ' stat-value--critical' : ''}`}>
                {formatDuration(timeLeft ?? elapsed)}
              </span>
              <span className="stat-label">{timeLeft !== null ? 'left' : 'time'}</span>
            </div>
          </div>

          <div className="hud-actions">
            <button className="btn-ghost" onClick={giveUp} title="End the game and see the solution">
              Give up
            </button>
            <button className="btn-ghost btn-ghost--quiet" onClick={resetToSetup}>
              Change time limit
            </button>
          </div>
        </div>
      )}

      <GameHeader
        game={showGame ? game : null}
        status={status}
        moves={moves}
        onNewGame={() => startNewGame()}
      />

      <GameBoard onRetry={() => startNewGame()} />

      {showGame && status === 'won' && game && (
        <WinBanner
          chain={chain}
          moves={moves}
          seconds={elapsed}
          solution={solution}
          onPlayAgain={() => startNewGame()}
        />
      )}

      {showGame && (status === 'gave-up' || status === 'timeout') && game && (
        <GiveUpBanner
          solution={solution}
          reason={status === 'timeout' ? 'timeout' : 'gave-up'}
          onPlayAgain={() => startNewGame()}
        />
      )}

      {showGame && isFinished && game && !ticketOpen && (
        <button className="btn-ghost ticket-reopen" onClick={() => setTicketOpen(true)}>
          🎟 View ticket again
        </button>
      )}

      {showGame && isFinished && game && ticketOpen && (
        <ResultModal
          status={status === 'won' ? 'won' : status === 'timeout' ? 'timeout' : 'gave-up'}
          moves={moves}
          seconds={elapsed}
          solution={solution}
          newBadges={newlyUnlockedBadges}
          start={game.start}
          target={game.target}
          onClose={() => setTicketOpen(false)}
          onPlayAgain={() => startNewGame()}
        />
      )}
    </div>
  )
}
