import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clearStats, formatDuration, getSummary } from '../stats'
import { clearDaily, getDailyStats, puzzleDateNow } from '../daily'

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Stats() {
  // Silme işleminden sonra yeniden okumak için basit bir sayaç
  const [version, setVersion] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const summary = getSummary()
  const dailyStats = getDailyStats(puzzleDateNow())

  function handleClear() {
    clearStats()
    clearDaily()
    setConfirming(false)
    setVersion((v) => v + 1)
  }

  if (summary.won === 0 && dailyStats.played === 0) {
    return (
      <div className="page page--doc" key={version}>
        <header className="page-head">
          <span className="page-eyebrow">İstatistikler</span>
          <h1 className="page-title">Henüz skorun yok</h1>
          <p className="page-lead">
            {summary.started > 0
              ? `${summary.started} oyun başlatmışsın ama henüz birini bitirmemişsin. İlk zincirini tamamla, buraya yazalım.`
              : 'İlk oyununu tamamladığında hamle sayın, süren ve rekorların burada birikmeye başlayacak.'}
          </p>
        </header>
        <section className="cta">
          <Link to="/oyna" className="btn-primary btn-lg">
            Oynamaya başla
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page page--doc" key={version}>
      <header className="page-head">
        <span className="page-eyebrow">İstatistikler</span>
        <h1 className="page-title">Skorların</h1>
        <p className="page-lead">
          Bu veriler yalnızca bu tarayıcıda saklanır. Hesap yok, sunucuya bir şey gitmiyor.
        </p>
      </header>

      {summary.won > 0 && (
        <section className="stat-grid">
          <StatTile value={summary.won} label="tamamlanan oyun" tone="mint" />
          <StatTile value={summary.bestMoves} label="en iyi hamle" tone="pink" highlight />
          <StatTile value={summary.averageMoves} label="ortalama hamle" />
          <StatTile
            value={summary.fastestSeconds !== null ? formatDuration(summary.fastestSeconds) : '—'}
            label="en hızlı süre"
          />
          <StatTile value={`%${summary.completionRate}`} label="tamamlama oranı" />
          <StatTile value={formatDuration(summary.totalSeconds)} label="toplam süre" />
        </section>
      )}

      {dailyStats.played > 0 && (
        <section className="doc-section">
          <h2 className="section-title">Günlük bulmaca</h2>
          <section className="stat-grid">
            <StatTile value={dailyStats.currentStreak} label="güncel seri" tone="mint" highlight />
            <StatTile value={dailyStats.bestStreak} label="en uzun seri" tone="pink" />
            <StatTile value={dailyStats.played} label="oynanan gün" />
            <StatTile value={dailyStats.perfect} label="kusursuz gün" />
            <StatTile value={dailyStats.bestMoves} label="en iyi hamle" />
            <StatTile value={dailyStats.averageMoves} label="ortalama hamle" />
          </section>

          <div className="table-wrap">
            <table className="record-table">
              <thead>
                <tr>
                  <th>Bulmaca</th>
                  <th className="num">Hamle</th>
                  <th className="num">Hedef</th>
                  <th className="num">Süre</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.recent.map((record) => (
                  <tr key={record.date}>
                    <td>
                      <span className="record-match">
                        <span className="record-start">#{record.number}</span>
                        <span className="record-arrow" aria-hidden="true">
                          ·
                        </span>
                        <span className="record-target">{record.targetTitle}</span>
                      </span>
                    </td>
                    <td className="num">
                      <span className={record.moves <= record.par ? 'record-best' : ''}>
                        {record.moves}
                      </span>
                    </td>
                    <td className="num dim">{record.par}</td>
                    <td className="num mono">{formatDuration(record.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {summary.won > 0 && (
        <section className="doc-section">
          <h2 className="section-title">Son oyunlar</h2>
          <div className="table-wrap">
            <table className="record-table">
              <thead>
                <tr>
                  <th>Eşleşme</th>
                  <th className="num">Hamle</th>
                  <th className="num">Süre</th>
                  <th className="num">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent.map((record) => (
                  <tr key={record.at}>
                    <td>
                      <span className="record-match">
                        <span className="record-start">{record.startTitle}</span>
                        <span className="record-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="record-target">{record.targetTitle}</span>
                      </span>
                    </td>
                    <td className="num">
                      <span className={record.moves === summary.bestMoves ? 'record-best' : ''}>
                        {record.moves}
                      </span>
                    </td>
                    <td className="num mono">{formatDuration(record.seconds)}</td>
                    <td className="num dim">{formatDate(record.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="danger-zone">
        {confirming ? (
          <>
            <p>Tüm istatistiklerin kalıcı olarak silinecek. Emin misin?</p>
            <div className="danger-actions">
              <button className="btn-danger" onClick={handleClear}>
                Evet, sil
              </button>
              <button className="btn-ghost" onClick={() => setConfirming(false)}>
                Vazgeç
              </button>
            </div>
          </>
        ) : (
          <button className="btn-ghost btn-ghost--quiet" onClick={() => setConfirming(true)}>
            İstatistikleri sıfırla
          </button>
        )}
      </section>
    </div>
  )
}

interface StatTileProps {
  value: string | number | null
  label: string
  tone?: 'pink' | 'mint'
  highlight?: boolean
}

function StatTile({ value, label, tone, highlight }: StatTileProps) {
  return (
    <div className={`stat-tile${tone ? ` stat-tile--${tone}` : ''}${highlight ? ' is-highlight' : ''}`}>
      <span className="stat-tile-value">{value ?? '—'}</span>
      <span className="stat-tile-label">{label}</span>
    </div>
  )
}
