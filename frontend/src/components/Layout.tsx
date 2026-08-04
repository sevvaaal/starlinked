import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useGame } from '../game/GameContext'
import { getDailyResult, puzzleDateNow } from '../daily'

const NAV_ITEMS = [
  { to: '/gunluk', label: 'Günlük' },
  { to: '/oyna', label: 'Oyna' },
  { to: '/nasil-oynanir', label: 'Kurallar' },
  { to: '/istatistikler', label: 'Skorlar' },
]

export default function Layout() {
  const { isActive } = useGame()
  const { pathname } = useLocation()
  // Bugünün bulmacası henüz oynanmadıysa menüde işaret bırak.
  const dailyPending = getDailyResult(puzzleDateNow()) === null

  // Sayfa değişince başa dön — yoksa yeni sayfaya ortasından girilmiş gibi olur.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Dizilink ana sayfa">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">dizilink</span>
        </NavLink>

        <nav className="nav" aria-label="Ana menü">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive: linkActive }) => `nav-link${linkActive ? ' is-active' : ''}`}
            >
              {item.label}
              {item.to === '/oyna' && isActive && (
                <span className="nav-dot" title="Devam eden oyun" aria-label="Devam eden oyun var" />
              )}
              {item.to === '/gunluk' && dailyPending && (
                <span
                  className="nav-dot nav-dot--daily"
                  title="Bugünün bulmacası seni bekliyor"
                  aria-label="Bugünün bulmacası oynanmadı"
                />
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="stage">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              <strong>dizilink</strong>
              <span className="footer-tagline">Film ve dizileri ortak oyuncularla bağla</span>
            </span>
          </div>

          <nav className="footer-links" aria-label="Alt menü">
            <NavLink to="/nasil-oynanir">Nasıl oynanır</NavLink>
            <NavLink to="/istatistikler">İstatistikler</NavLink>
            <NavLink to="/hakkinda">Hakkında</NavLink>
          </nav>
        </div>

        <p className="footer-legal">
          Film ve dizi verileri{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer noopener">
            TMDB
          </a>{' '}
          tarafından sağlanmaktadır. Bu ürün TMDB tarafından onaylanmamıştır veya
          sertifikalandırılmamıştır.
        </p>
      </footer>
    </div>
  )
}
