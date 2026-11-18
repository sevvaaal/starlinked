import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useGame } from '../game/GameContext'
import { getDailyResult, puzzleDateNow } from '../daily'
import { isSoundOn, setSoundOn } from '../sound'
import logoUrl from '../assets/logo.svg'
import Starfield from './Starfield'

const NAV_ITEMS = [
  { to: '/daily', label: 'Daily' },
  { to: '/play', label: 'Play' },
  { to: '/mini-games', label: 'Mini Games' },
  { to: '/how-to-play', label: 'Rules' },
  { to: '/stats', label: 'Scores' },
]

export default function Layout() {
  const { isActive } = useGame()
  const { pathname } = useLocation()
  // Leave a marker in the menu if today's puzzle hasn't been played yet.
  const dailyPending = getDailyResult(puzzleDateNow()) === null
  const [soundOn, setSoundOnState] = useState(isSoundOn)

  function toggleSound() {
    setSoundOn(!soundOn)
    setSoundOnState(!soundOn)
  }

  // Scroll to the top on page change — otherwise you land in the middle of the new page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="app">
      <Starfield />
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Starlinked home">
          <img className="brand-logo" src={logoUrl} alt="" aria-hidden="true" />
          <span className="brand-name">starlinked</span>
        </NavLink>

        <nav className="nav" aria-label="Main menu">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive: linkActive }) => `nav-link${linkActive ? ' is-active' : ''}`}
            >
              {item.label}
              {item.to === '/play' && isActive && (
                <span className="nav-dot" title="Game in progress" aria-label="A game is in progress" />
              )}
              {item.to === '/daily' && dailyPending && (
                <span
                  className="nav-dot nav-dot--daily"
                  title="Today's puzzle is waiting for you"
                  aria-label="Today's puzzle hasn't been played"
                />
              )}
            </NavLink>
          ))}
          <button
            className={`sound-toggle${soundOn ? '' : ' is-off'}`}
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Turn hover sound off' : 'Turn hover sound on'}
            title={soundOn ? 'Sound on' : 'Sound off'}
          >
            ♪
          </button>
        </nav>
      </header>

      <main className="stage">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img className="brand-logo" src={logoUrl} alt="" aria-hidden="true" />
            <span>
              <strong>starlinked</strong>
              <span className="footer-tagline">Link movies and TV shows through shared cast</span>
            </span>
          </div>

          <nav className="footer-links" aria-label="Footer menu">
            <NavLink to="/how-to-play">How to play</NavLink>
            <NavLink to="/stats">Stats</NavLink>
            <NavLink to="/about">About</NavLink>
          </nav>
        </div>

        <p className="footer-legal">
          Movie and TV data provided by{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer noopener">
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </footer>
    </div>
  )
}
