import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGame } from '../game/GameContext'
import GameHeader from '../components/GameHeader'
import GameBoard from '../components/GameBoard'
import GiveUpBanner from '../components/GiveUpBanner'
import ChainDisplay from '../components/ChainDisplay'
import { getDailyGame } from '../api'
import type { DailyGameResponse } from '../types'
import type { DailyResult } from '../daily'
import { buildShareText, formatCountdown, getDailyResult, getDailyStats } from '../daily'
import { formatDuration } from '../stats'

function formatDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('tr-TR', {
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
   * Önce günün künyesini alırız: bugünkü bulmaca zaten çözülmüşse oyunu hiç
   * başlatmayız — Wordle gibi, gün başına tek deneme.
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
        setInfoError(err instanceof Error ? err.message : 'Günün bulmacası alınamadı')
      }
    })()
  }, [startDailyGame])

  // Oyun kazanıldığında sonucu depodan okuruz — kaydı context yazar.
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
    const text = buildShareText(result, `${window.location.origin}/gunluk`)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setShareNote('Sonuç panoya kopyalandı')
    } catch {
      // Paylaşım iptal edildiyse ses çıkarmaya gerek yok; kopyalama da
      // başarısızsa kullanıcı metni elle seçebilsin diye uyarı bırakıyoruz.
      setShareNote('Paylaşılamadı — metni elle kopyalayabilirsin')
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
            <strong>Günün bulmacası yüklenemedi</strong>
            <span>{infoError}</span>
          </div>
          <button className="btn-ghost" onClick={() => window.location.reload()}>
            Tekrar dene
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
          Günlük <strong>#{info ? info.number : '—'}</strong>
        </span>
        <p className="daily-date">{info ? formatDay(info.date) : 'Günün bulmacası hazırlanıyor…'}</p>
        {info && !solved && (
          <p className="daily-hint">
            Herkes bugün aynı eşleşmeyi oynuyor. Hedef{' '}
            <strong>{info.par} hamle</strong>.
          </p>
        )}
      </header>

      {showBoard && daily && status !== 'won' && (
        <div className="hud">
          <div className="hud-stats" aria-label="Oyun istatistikleri">
            <div className="stat">
              <span className="stat-value">{moves}</span>
              <span className="stat-label">hamle</span>
            </div>
            <span className="stat-sep" aria-hidden="true" />
            <div className="stat">
              <span className="stat-value stat-value--mono">{formatDuration(elapsed)}</span>
              <span className="stat-label">süre</span>
            </div>
            <span className="stat-sep" aria-hidden="true" />
            <div className="stat">
              <span className="stat-value">{daily.par}</span>
              <span className="stat-label">hedef</span>
            </div>
          </div>

          <div className="hud-actions">
            <button className="btn-ghost" onClick={giveUp} title="Bugünü bitir ve çözümü gör">
              Pes et
            </button>
          </div>
        </div>
      )}

      {showBoard && (
        <>
          {/* Günlükte "yeni oyun" yok: gün başına tek eşleşme. */}
          {daily && (
            <GameHeader
              game={daily}
              status={status}
              moves={moves}
              onNewGame={startDailyGame}
              showNewGame={false}
            />
          )}
          <GameBoard onRetry={startDailyGame} loadingLabel="Günün eşleşmesi hazırlanıyor…" />
        </>
      )}

      {gaveUp && (
        <>
          <GiveUpBanner solution={solution} onPlayAgain={startDailyGame} showPlayAgain={false} />
          <div className="daily-next">
            {countdown !== null && countdown > 0 && (
              <>
                <span className="daily-next-label">Yeni bulmacaya</span>
                <span className="daily-countdown">{formatCountdown(countdown)}</span>
              </>
            )}
            <Link to="/oyna" className="text-link">
              Serbest oyunda tekrar dene →
            </Link>
          </div>
        </>
      )}

      {solved && result && (
        <section className="daily-result">
          <div className="win-card">
            <span className="win-rating">
              {result.moves <= result.par ? 'Kusursuz' : 'Tamamlandı'}
            </span>
            <h2 className="win-title">Günlük #{result.number} çözüldü</h2>
            <p className="daily-matchup">
              <span className="record-start">{result.startTitle}</span>
              <span className="record-arrow" aria-hidden="true">
                →
              </span>
              <span className="record-target">{result.targetTitle}</span>
            </p>

            <div className="win-stats">
              <div className="win-stat">
                <span className="win-stat-value">{result.moves}</span>
                <span className="win-stat-label">hamle</span>
              </div>
              <span className="win-stat-sep" aria-hidden="true" />
              <div className="win-stat">
                <span className="win-stat-value">{result.par}</span>
                <span className="win-stat-label">hedef</span>
              </div>
              <span className="win-stat-sep" aria-hidden="true" />
              <div className="win-stat">
                <span className="win-stat-value">{formatDuration(result.seconds)}</span>
                <span className="win-stat-label">süre</span>
              </div>
            </div>

            <button className="btn-primary btn-lg" onClick={() => void handleShare()}>
              Sonucu paylaş
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
                <span className="mini-stat-label">güncel seri</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-value">{stats.bestStreak}</span>
                <span className="mini-stat-label">en uzun seri</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-value">{stats.played}</span>
                <span className="mini-stat-label">oynanan gün</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-value">{stats.perfect}</span>
                <span className="mini-stat-label">kusursuz gün</span>
              </div>
            </div>
          )}

          <div className="daily-next">
            {countdown !== null && countdown > 0 ? (
              <>
                <span className="daily-next-label">Yeni bulmacaya</span>
                <span className="daily-countdown">{formatCountdown(countdown)}</span>
              </>
            ) : (
              <button className="btn-ghost" onClick={() => window.location.reload()}>
                Yeni bulmaca hazır — yenile
              </button>
            )}
            <Link to="/oyna" className="text-link">
              Beklemek istemiyorsan serbest oyna →
            </Link>
          </div>

          {mode === 'daily' && status === 'won' && chain.length > 0 && (
            <div className="win-chain">
              <h3 className="win-chain-title">Kurduğun zincir</h3>
              <ChainDisplay chain={chain} />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
