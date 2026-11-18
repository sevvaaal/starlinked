import { Link } from 'react-router-dom'
import { useGame } from '../game/GameContext'
import { getSummary } from '../stats'
import { getDailyResult, getDailyStats, puzzleDateNow } from '../daily'
import pinkStar from '../assets/stars/pink.svg'
import mintStar from '../assets/stars/mint.svg'

/** Colors of the static stars around the title, in the order the CSS places them */
const HERO_STARS = ['pink', 'mint', 'pink', 'mint', 'mint', 'pink'] as const

const STEPS = [
  {
    n: '01',
    title: 'Get two titles',
    body: 'We give you a random starting and target movie or show. At first glance they have nothing in common.',
    tone: 'pink',
  },
  {
    n: '02',
    title: 'Pick an actor',
    body: 'Choose someone from the cast of your current title. That actor is your door to new titles.',
    tone: 'mix',
  },
  {
    n: '03',
    title: 'Reach the target',
    body: 'Jump to another title that actor was in, and repeat. Reach the target in as few moves as possible.',
    tone: 'mint',
  },
] as const

export default function Home() {
  const { isActive, moves } = useGame()
  const summary = getSummary()
  const today = puzzleDateNow()
  const dailyDone = getDailyResult(today)
  const dailyStats = getDailyStats(today)

  return (
    <div className="page page--home">
      <section className="hero">
        {HERO_STARS.map((tone, index) => (
          <img
            key={index}
            className={`hero-star hero-star--${index + 1}`}
            src={tone === 'pink' ? pinkStar : mintStar}
            alt=""
            aria-hidden="true"
          />
        ))}
        <span className="hero-eyebrow">Movie & TV connection game</span>
        <h1>
          How many <em className="grad-mint">actors</em> does it take to link two{' '}
          <em className="grad-pink">movies</em>?
        </h1>
        <p className="hero-sub">
          Build a chain from start to target by following shared cast members. See how few moves
          it takes.
        </p>

        <div className="hero-actions">
          <Link to="/daily" className="btn-primary btn-lg">
            Daily puzzle
          </Link>
          <Link to="/play" className="btn-ghost btn-lg-ghost">
            {isActive ? 'Continue game' : 'Free play'}
          </Link>
        </div>

        {isActive ? (
          <p className="hero-resume">
            You have a game in progress — <strong>{moves} {moves === 1 ? 'move' : 'moves'}</strong> so far.
          </p>
        ) : (
          <p className="hero-resume">
            First time here? <Link to="/how-to-play" className="text-link">How to play</Link>
          </p>
        )}
      </section>

      {/* Daily strip: the one daily puzzle where everyone plays the same matchup */}
      <section className="daily-strip window window--yellow">
        <div className="window-bar">
          <span className="window-title">DAILY PUZZLE</span>
          <span className="window-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>

        <div className="window-body daily-strip-body">
          <div className="daily-strip-main">
            <h2 className="daily-strip-heading">
              {dailyDone ? 'You solved today\'s puzzle' : 'Today\'s matchup is ready'}
            </h2>
            <p>
              {dailyDone
                ? `You built the chain in ${dailyDone.moves} ${dailyDone.moves === 1 ? 'move' : 'moves'}. A new matchup arrives tomorrow.`
                : 'Everyone plays the same start and target. You get one try a day — and you can share your result.'}
            </p>
          </div>

          <div className="daily-strip-side">
            {dailyStats.currentStreak > 0 && (
              <div className="mini-stat">
                <span className="mini-stat-value">{dailyStats.currentStreak}</span>
                <span className="mini-stat-label">day streak</span>
              </div>
            )}
            <Link to="/daily" className="btn-primary">
              {dailyDone ? 'See result' : 'Play the daily'}
            </Link>
          </div>
        </div>
      </section>

      {/* Example chain: explains the idea of the game at a glance */}
      <section className="demo" aria-label="Example chain">
        <div className="demo-rail">
          <span className="demo-node demo-node--start">Inception</span>
          <span className="demo-link" aria-hidden="true" />
          <span className="demo-actor">Leonardo DiCaprio</span>
          <span className="demo-link" aria-hidden="true" />
          <span className="demo-node demo-node--mid">Titanic</span>
          <span className="demo-link" aria-hidden="true" />
          <span className="demo-actor">Kate Winslet</span>
          <span className="demo-link" aria-hidden="true" />
          <span className="demo-node demo-node--end">The Reader</span>
        </div>
        <p className="demo-caption">This is what a two-move chain looks like.</p>
      </section>

      <section className="steps" aria-label="How it works">
        {STEPS.map((step) => (
          <article className={`step-card step-card--${step.tone}`} key={step.n}>
            <span className="step-num">{step.n}</span>
            <h2 className="step-title">{step.title}</h2>
            <p className="step-body">{step.body}</p>
          </article>
        ))}
      </section>

      {summary.won > 0 && (
        <section className="home-stats">
          <h2 className="section-title">So far</h2>
          <div className="home-stats-row">
            <div className="mini-stat">
              <span className="mini-stat-value">{summary.won}</span>
              <span className="mini-stat-label">games completed</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value">{summary.bestMoves}</span>
              <span className="mini-stat-label">best moves</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value">{summary.averageMoves}</span>
              <span className="mini-stat-label">average moves</span>
            </div>
          </div>
          <Link to="/stats" className="text-link">
            See all stats →
          </Link>
        </section>
      )}

      <section className="cta">
        <h2 className="cta-title">Ready?</h2>
        <p className="cta-sub">Every game is a new matchup. You'll never get the same one twice.</p>
        <Link to="/play" className="btn-primary btn-lg">
          {isActive ? 'Continue game' : 'Start playing'}
        </Link>
      </section>
    </div>
  )
}
