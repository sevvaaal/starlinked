import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MCQRoundResponse, MediaBrief } from '../types'
import { getMcqRound } from '../api'
import { posterUrl, profileUrl } from '../images'
import { getBestGuessCastResult, recordGuessCastWin } from '../guessCastStats'

function mediaKey(media: MediaBrief): string {
  return `${media.media_type}:${media.id}`
}

function tier(revealedCount: number): string {
  if (revealedCount <= 1) return 'Efsane'
  if (revealedCount === 2) return 'Çok iyi'
  if (revealedCount === 3) return 'İyi iş'
  return 'Tamamlandı'
}

type Status = 'loading' | 'error' | 'playing' | 'won'

/**
 * Kendi başına duran bir mini oyun — GameContext'e hiç dokunmuyor. Ana oyunun
 * state makinesine sokmak (zincir kurma, süre sınırı, çözüm arama...)
 * gereksiz karmaşıklık olurdu, burada sadece "tur getir → tahmin et" var.
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
      setError(err instanceof Error ? err.message : 'Tur yüklenemedi')
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
        <span className="page-eyebrow">Mini Oyun</span>
        <h1 className="page-title">Oyunculardan Film Bul</h1>
        <p className="page-lead">
          Kadro fotoğraflarına bakıp doğru yapımı 4 seçenekten bul. Ne kadar az ipucuyla
          bulursan skorun o kadar iyi.
        </p>
      </header>

      <section className="picker window--lilac">
        <div className="window-bar">
          <span className="window-title">OYUNCULARDAN_FILM_BUL</span>
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
              <p>Tur hazırlanıyor…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="alert" role="alert">
              <span className="alert-icon" aria-hidden="true">
                !
              </span>
              <div className="alert-body">
                <strong>Bir şeyler ters gitti</strong>
                <span>{error}</span>
              </div>
              <button className="btn-ghost" onClick={() => void loadRound()}>
                Tekrar dene
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
                      <span className="win-stat-label">ipucu</span>
                    </div>
                  </div>
                  {best && (
                    <p className="win-optimal-note">Kişisel en iyin: {best.revealedCount} ipucu</p>
                  )}
                  <button className="btn-primary btn-lg" onClick={() => void loadRound()}>
                    Yeni tur
                  </button>
                </div>
              ) : (
                <div className="picker-head">
                  <span className="step-badge">
                    İpucu {revealedCount}/{round.cast.length}
                  </span>
                  <h2>Bu oyuncular hangi yapımda oynadı?</h2>
                </div>
              )}

              <div className="reveal-strip">
                {round.cast.slice(0, revealedCount).map((actor) => (
                  <div className="reveal-photo" key={actor.person_id} title={actor.name}>
                    {actor.profile_path ? (
                      <img src={profileUrl(actor.profile_path, 'w185')} alt={actor.name} loading="lazy" />
                    ) : (
                      <div className="pick-card-placeholder" aria-hidden="true">
                        🎭
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
                            🎬
                          </div>
                        )}
                        <span className={`type-badge type-badge--${option.media_type}`}>
                          {option.media_type === 'movie' ? 'Film' : 'Dizi'}
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
        <Link to="/mini-oyunlar" className="text-link">
          ← Mini oyunlara dön
        </Link>
      </p>
    </div>
  )
}
