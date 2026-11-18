import { Link } from 'react-router-dom'

const RULES = [
  {
    title: 'Start and target',
    body: 'Each game gives you two random titles: the start on the left (pink) and the target on the right (mint green). Your goal is to build a chain from the left one to the right one.',
  },
  {
    title: 'Step 1 — Pick an actor',
    body: 'You see the cast of your current title and pick someone. That actor is added to your chain.',
  },
  {
    title: 'Step 2 — Pick a title',
    body: 'The other titles that actor appeared in are listed. Pick one and you\'re there now. Your chain just grew by one link.',
  },
  {
    title: 'Repeat',
    body: 'Pick another actor from the new title\'s cast. Keep going until you reach the target.',
  },
  {
    title: 'Winning',
    body: 'The game ends the moment you pick the target title. Your move count and time are saved.',
  },
]

const TIPS = [
  {
    title: 'Pick prolific actors',
    body: 'Actors with long careers in both movies and TV open the most doors. The names at the top of the cast list are usually the best connected.',
  },
  {
    title: 'Think about the target',
    body: 'If the target is a Turkish or Korean series, go through actors from that country. If it\'s a Marvel movie, even supporting characters can get you there.',
  },
  {
    title: 'Search the full cast',
    body: 'Series show their regulars first, sorted by episode count. Searching looks through the whole cast — guest stars included — and "Show full cast" lists everyone.',
  },
  {
    title: 'Ask for a hint',
    body: 'The 💡 Hint button marks the actor to pick next on the shortest path, then the title to jump to. Each hint is noted on your result, and a hinted game can\'t count as perfect.',
  },
  {
    title: 'Skip animation',
    body: 'Don\'t know voice actors? Turn on "Skip animated titles" before a free-play game and animated movies and shows are left out.',
  },
  {
    title: 'Stuck? You can give up',
    body: '"Give up" ends the game and shows an example solution — you\'ll see which actor links which titles.',
  },
  {
    title: 'No visiting a title twice',
    body: 'Titles already in your chain are removed from the list automatically, so you can\'t go in circles.',
  },
]

export default function HowToPlay() {
  return (
    <div className="page page--doc">
      <header className="page-head">
        <span className="page-eyebrow">Rules</span>
        <h1 className="page-title">How to play</h1>
        <p className="page-lead">
          The rules take a minute to learn. Playing well takes a bit of movie knowledge.
        </p>
      </header>

      <section className="doc-section">
        <h2 className="section-title">How a game goes</h2>
        <ol className="rule-list">
          {RULES.map((rule, index) => (
            <li className="rule" key={rule.title}>
              <span className="rule-num" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3 className="rule-title">{rule.title}</h3>
                <p className="rule-body">{rule.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="doc-section">
        <h2 className="section-title">Reading the colors</h2>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-swatch legend-swatch--pink" aria-hidden="true" />
            <div>
              <strong>Pink</strong>
              <span>The starting point and the pick-an-actor step</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-swatch legend-swatch--mint" aria-hidden="true" />
            <div>
              <strong>Mint green</strong>
              <span>The target title and the pick-a-title step</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-swatch legend-swatch--grad" aria-hidden="true" />
            <div>
              <strong>Gradient</strong>
              <span>The chain shifts from pink to green as you get closer to the target</span>
            </div>
          </div>
        </div>
      </section>

      <section className="doc-section">
        <h2 className="section-title">Daily puzzle</h2>
        <div className="tip-grid">
          <article className="tip-card">
            <h3 className="tip-title">Same matchup for everyone</h3>
            <p className="tip-body">
              A single start–target pair is published every day, and everyone who plays that day
              gets the same one. The puzzle resets at midnight Turkey time (UTC+3).
            </p>
          </article>
          <article className="tip-card">
            <h3 className="tip-title">One try a day</h3>
            <p className="tip-body">
              Once you finish the chain, that day's result is locked in. Want more? Free play is
              unlimited.
            </p>
          </article>
          <article className="tip-card">
            <h3 className="tip-title">Par</h3>
            <p className="tip-body">
              Every puzzle has a par: the shortest path we found in our pool of popular titles.
              Match it or beat it and the day counts as "perfect".
            </p>
          </article>
          <article className="tip-card">
            <h3 className="tip-title">Streaks and sharing</h3>
            <p className="tip-body">
              Days you play in a row count as a streak. You can share your result as spoiler-free
              text.
            </p>
          </article>
        </div>
        <p className="doc-link-row">
          <Link to="/daily" className="text-link">
            Go to today's puzzle →
          </Link>
        </p>
      </section>

      <section className="doc-section">
        <h2 className="section-title">Strategy tips</h2>
        <div className="tip-grid">
          {TIPS.map((tip) => (
            <article className="tip-card" key={tip.title}>
              <h3 className="tip-title">{tip.title}</h3>
              <p className="tip-body">{tip.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2 className="cta-title">Got it? Give it a try.</h2>
        <Link to="/play" className="btn-primary btn-lg">
          Start playing
        </Link>
      </section>
    </div>
  )
}
