import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page page--doc page--center">
      <header className="page-head">
        <span className="page-eyebrow">404</span>
        <h1 className="page-title">This chain is broken</h1>
        <p className="page-lead">The page you're looking for isn't here. Maybe head back to the game?</p>
      </header>
      <section className="cta">
        <div className="hero-actions">
          <Link to="/play" className="btn-primary btn-lg">
            Go to the game
          </Link>
          <Link to="/" className="btn-ghost btn-lg-ghost">
            Home
          </Link>
        </div>
      </section>
    </div>
  )
}
