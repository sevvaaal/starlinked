import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext'
import GameHeader from '../components/GameHeader'
import GameBoard from '../components/GameBoard'
import WinBanner from '../components/WinBanner'
import GiveUpBanner from '../components/GiveUpBanner'
import ResultModal from '../components/ResultModal'
import { formatDuration } from '../stats'

const DURATION_OPTIONS: { value: number | null; label: string }[] = [
  { value: 60, label: '1 dk' },
  { value: 180, label: '3 dk' },
  { value: 300, label: '5 dk' },
  { value: 600, label: '10 dk' },
  { value: null, label: 'Sınırsız' },
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

  // Günlük bulmacadan yarım kalmış halde buraya gelinirse (sekme değişimi
  // gibi) serbest oyuna geç — iki modun ekranları burada karışmasın.
  const resetOnDailyLeak = useRef(false)
  useEffect(() => {
    if (resetOnDailyLeak.current) return
    resetOnDailyLeak.current = true
    if (mode === 'daily') resetToSetup()
  }, [mode, resetToSetup])

  // Oyun her bitişte biletini bir kez kendiliğinden açar — Wordle'daki gibi.
  // Kullanıcı kapatırsa alttaki tam sonuç ekranı (WinBanner/GiveUpBanner) durur.
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

  // Henüz hiçbir oyun başlatılmadıysa süre seçimi ekranını göster —
  // /oyna sayfasına girer girmez kendiliğinden başlamasın.
  if (status === 'idle') {
    return (
      <div className="page page--play">
        <section className="setup window window--yellow">
          <div className="window-bar">
            <span className="window-title">OYUN_KURULUMU</span>
            <span className="window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
          <div className="window-body setup-body">
            <h2 className="setup-title">Süreyi seç</h2>
            <p className="setup-lead">
              Hedefe kaç dakikada varacağını sen belirle. İstersen sınırsız oyna.
            </p>
            <div className="duration-row" role="group" aria-label="Süre sınırı">
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
              Oyunu başlat
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
          <div className="hud-stats" aria-label="Oyun istatistikleri">
            <div className="stat">
              <span className="stat-value">{moves}</span>
              <span className="stat-label">hamle</span>
            </div>
            <span className="stat-sep" aria-hidden="true" />
            <div className="stat">
              <span className={`stat-value stat-value--mono${timeCritical ? ' stat-value--critical' : ''}`}>
                {formatDuration(timeLeft ?? elapsed)}
              </span>
              <span className="stat-label">{timeLeft !== null ? 'kalan' : 'süre'}</span>
            </div>
          </div>

          <div className="hud-actions">
            <button className="btn-ghost" onClick={giveUp} title="Oyunu bitir ve çözümü gör">
              Pes et
            </button>
            <button className="btn-ghost btn-ghost--quiet" onClick={resetToSetup}>
              Süreyi değiştir
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
          🎟 Bileti tekrar gör
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
