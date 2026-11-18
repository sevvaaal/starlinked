import { Link } from 'react-router-dom'
import BadgeIcon from '../components/BadgeIcon'
// Pixel icon from HackerNoon's Pixel Icon Library (CC BY 4.0), like the badges
import castIcon from '../assets/icons/cast.svg'

interface MiniGame {
  to: string
  title: string
  description: string
  /** Image URL of a single-color pixel icon */
  icon: string
}

const MINI_GAMES: MiniGame[] = [
  {
    to: '/mini-games/guess-from-cast',
    title: 'Guess from the Cast',
    description: 'Look at the cast photos and pick the right title out of 4 options. Fewer clues means a higher score.',
    icon: castIcon,
  },
]

export default function MiniGames() {
  return (
    <div className="page page--doc">
      <header className="page-head">
        <span className="page-eyebrow">Mini Games</span>
        <h1 className="page-title">For quick breaks</h1>
        <p className="page-lead">
          Small, quick puzzles that play differently from the main game. More are coming over time.
        </p>
      </header>

      <div className="mini-games-grid">
        {MINI_GAMES.map((game) => (
          <Link key={game.to} to={game.to} className="step-card mini-game-card">
            <span className="step-num mini-game-icon" aria-hidden="true">
              <BadgeIcon src={game.icon} />
            </span>
            <h2 className="step-title">{game.title}</h2>
            <p className="step-body">{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
