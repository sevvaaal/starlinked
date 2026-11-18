import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext'
import GameHeader from '../components/GameHeader'
import GameBoard from '../components/GameBoard'
import WinBanner from '../components/WinBanner'
import GiveUpBanner from '../components/GiveUpBanner'
import ResultModal from '../components/ResultModal'
import { LEVELS, MEDIA_MIXES, levelInfo } from '../levels'
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
    excludeAnimation,
    setExcludeAnimation,
    hintsUsed,
    level,
    setLevel,
    gameLevel,
    media,
    setMedia,
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
            <h2 className="setup-title">How cinephile are you?</h2>
            <p className="setup-lead">This decides which movies and shows you'll get.</p>
            <div className="level-row" role="radiogroup" aria-label="Level">
              {LEVELS.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={level === option.id}
                  className={`level-card level-card--${index + 1}${level === option.id ? ' is-active' : ''}`}
                  onClick={() => setLevel(option.id)}
                >
                  <span className="level-card-dots" aria-hidden="true">
                    {'★'.repeat(index + 1)}
                    {'☆'.repeat(LEVELS.length - index - 1)}
                  </span>
                  <strong className="level-card-name">{option.name}</strong>
                  <span className="level-card-blurb">{option.blurb}</span>
                </button>
              ))}
            </div>

            <h3 className="setup-subtitle">What do you want to play with?</h3>
            <div className="duration-row" role="radiogroup" aria-label="Movies or TV shows">
              {MEDIA_MIXES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={media === option.id}
                  className={`duration-btn${media === option.id ? ' is-active' : ''}`}
                  onClick={() => setMedia(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <h3 className="setup-subtitle">Time limit</h3>
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
            {level === 'casual' ? (
              <p className="setup-note">No animated titles at this level — voice casts are hard to know.</p>
            ) : (
              <label className="setup-toggle">
                <input
                  type="checkbox"
                  checked={excludeAnimation}
                  onChange={(event) => setExcludeAnimation(event.target.checked)}
                />
                <span>
                  <strong>Skip animated titles</strong>
                  <small>Voice casts are hard to know — leaves out animated movies and shows.</small>
                </span>
              </label>
            )}
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
          hints={hintsUsed}
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
        <div className="finished-actions">
          <button className="btn-ghost" onClick={() => setTicketOpen(true)}>
            View ticket again
          </button>
          {/* Back to the setup screen to pick another level (or time limit) for the next game */}
          <button className="btn-ghost" onClick={resetToSetup}>
            Change level · {levelInfo(gameLevel).name}
          </button>
        </div>
      )}

      {showGame && isFinished && game && ticketOpen && (
        <ResultModal
          status={status === 'won' ? 'won' : status === 'timeout' ? 'timeout' : 'gave-up'}
          moves={moves}
          seconds={elapsed}
          solution={solution}
          newBadges={newlyUnlockedBadges}
          hints={hintsUsed}
          levelName={levelInfo(gameLevel).name}
          start={game.start}
          target={game.target}
          onClose={() => setTicketOpen(false)}
          onPlayAgain={() => startNewGame()}
        />
      )}
    </div>
  )
}
