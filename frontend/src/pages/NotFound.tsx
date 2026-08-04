import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page page--doc page--center">
      <header className="page-head">
        <span className="page-eyebrow">404</span>
        <h1 className="page-title">Bu zincirin ucu kopmuş</h1>
        <p className="page-lead">Aradığın sayfa burada değil. Belki oyuna dönmek istersin?</p>
      </header>
      <section className="cta">
        <div className="hero-actions">
          <Link to="/oyna" className="btn-primary btn-lg">
            Oyuna git
          </Link>
          <Link to="/" className="btn-ghost btn-lg-ghost">
            Ana sayfa
          </Link>
        </div>
      </section>
    </div>
  )
}
