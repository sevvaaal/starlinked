import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="page page--doc">
      <header className="page-head">
        <span className="page-eyebrow">About</span>
        <h1 className="page-title">What is Starlinked?</h1>
        <p className="page-lead">
          A small browser game that shows how small the world of film and TV really is.
        </p>
      </header>

      <section className="doc-section prose">
        <h2 className="section-title">The idea</h2>
        <p>
          Almost any movie or TV show can be linked to another through shared cast members, and
          the distance is usually much shorter than you'd think. Starlinked gives you two random
          titles and asks you to build the chain between them — and you'll often be surprised to
          get there in just three to five moves.
        </p>

        <h2 className="section-title">Data source</h2>
        <p>
          All movie, TV and cast data comes from the{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer noopener">
            TMDB
          </a>{' '}
          API. Starlinked is an independent project and is not endorsed or certified by TMDB.
          Posters and photos belong to their respective owners.
        </p>
        <p>
          Badge icons come from the{' '}
          <a href="https://github.com/hackernoon/pixel-icon-library" target="_blank" rel="noreferrer noopener">
            Pixel Icon Library
          </a>{' '}
          by HackerNoon (
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer noopener">
            CC BY 4.0
          </a>
          ). The logo stars are based on{' '}
          <a href="https://soulofkiran.itch.io/pixel-art-animated-star" target="_blank" rel="noreferrer noopener">
            Pixel Art Animated Star
          </a>{' '}
          by Narik.
        </p>

        <h2 className="section-title">Your data</h2>
        <p>
          No account needed, and no personal information is collected. Your scores are kept only
          in your browser's local storage, and you can delete them any time from the{' '}
          <Link to="/stats">Stats</Link> page. That's also why you won't see your scores on
          another device.
        </p>

        <h2 className="section-title">Tech</h2>
        <p>
          The frontend is built with React and TypeScript, the backend with Python and FastAPI.
          TMDB responses are cached on the server, so the game loads fast and the API isn't hit
          more than it needs to be.
        </p>
      </section>

      <section className="cta">
        <h2 className="cta-title">Best way to find out is to try</h2>
        <Link to="/play" className="btn-primary btn-lg">
          Start playing
        </Link>
      </section>
    </div>
  )
}
