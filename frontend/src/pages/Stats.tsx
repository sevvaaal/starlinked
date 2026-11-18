import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clearStats, formatDuration, getSummary } from '../stats'
import { clearDaily, getDailyStats, puzzleDateNow } from '../daily'
import { BADGES, evaluateUnlockedBadges } from '../achievements'

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Stats() {
  // A simple counter to re-read the data after clearing
  const [version, setVersion] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const summary = getSummary()
  const dailyStats = getDailyStats(puzzleDateNow())
  const unlockedIds = new Set(evaluateUnlockedBadges().map((badge) => badge.id))

  function handleClear() {
    clearStats()
    clearDaily()
    setConfirming(false)
    setVersion((v) => v + 1)
  }

  const badgeGallery = (
    <section className="doc-section">
      <h2 className="section-title">Your badges</h2>
      <div className="badge-grid">
        {BADGES.map((badge) => {
          const unlocked = unlockedIds.has(badge.id)
          return (
            <div
              key={badge.id}
              className={`badge-chip${unlocked ? ` badge-chip--${badge.tone}` : ' is-locked'}`}
            >
              <span className="badge-chip-icon" aria-hidden="true">
                {badge.icon}
              </span>
              <span className="badge-chip-title">{badge.title}</span>
              <span className="badge-chip-desc">{badge.description}</span>
            </div>
          )
        })}
      </div>
    </section>
  )

  if (summary.won === 0 && dailyStats.played === 0) {
    return (
      <div className="page page--doc" key={version}>
        <header className="page-head">
          <span className="page-eyebrow">Stats</span>
          <h1 className="page-title">No scores yet</h1>
          <p className="page-lead">
            {summary.started > 0
              ? `You've started ${summary.started} ${summary.started === 1 ? 'game' : 'games'} but haven't finished one yet. Complete your first chain and it'll show up here.`
              : 'Once you finish your first game, your moves, times and records will start piling up here.'}
          </p>
        </header>
        {badgeGallery}
        <section className="cta">
          <Link to="/play" className="btn-primary btn-lg">
            Start playing
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page page--doc" key={version}>
      <header className="page-head">
        <span className="page-eyebrow">Stats</span>
        <h1 className="page-title">Your scores</h1>
        <p className="page-lead">
          This data is stored only in this browser. No account, nothing is sent to a server.
        </p>
      </header>

      {summary.won > 0 && (
        <section className="stat-grid">
          <StatTile value={summary.won} label="games completed" tone="mint" />
          <StatTile value={summary.bestMoves} label="best moves" tone="pink" highlight />
          <StatTile value={summary.averageMoves} label="average moves" />
          <StatTile
            value={summary.fastestSeconds !== null ? formatDuration(summary.fastestSeconds) : '—'}
            label="fastest time"
          />
          <StatTile value={`${summary.completionRate}%`} label="completion rate" />
          <StatTile value={formatDuration(summary.totalSeconds)} label="total time" />
        </section>
      )}

      {badgeGallery}

      {dailyStats.played > 0 && (
        <section className="doc-section">
          <h2 className="section-title">Daily puzzle</h2>
          <section className="stat-grid">
            <StatTile value={dailyStats.currentStreak} label="current streak" tone="mint" highlight />
            <StatTile value={dailyStats.bestStreak} label="best streak" tone="pink" />
            <StatTile value={dailyStats.played} label="days played" />
            <StatTile value={dailyStats.perfect} label="perfect days" />
            <StatTile value={dailyStats.bestMoves} label="best moves" />
            <StatTile value={dailyStats.averageMoves} label="average moves" />
          </section>

          <div className="table-wrap">
            <table className="record-table">
              <thead>
                <tr>
                  <th>Puzzle</th>
                  <th className="num">Moves</th>
                  <th className="num">Par</th>
                  <th className="num">Time</th>
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
          <h2 className="section-title">Recent games</h2>
          <div className="table-wrap">
            <table className="record-table">
              <thead>
                <tr>
                  <th>Matchup</th>
                  <th className="num">Moves</th>
                  <th className="num">Time</th>
                  <th className="num">Date</th>
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
            <p>All your stats will be permanently deleted. Are you sure?</p>
            <div className="danger-actions">
              <button className="btn-danger" onClick={handleClear}>
                Yes, delete
              </button>
              <button className="btn-ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button className="btn-ghost btn-ghost--quiet" onClick={() => setConfirming(true)}>
            Reset stats
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
