import { Link } from 'react-router-dom'

interface MiniGame {
  to: string
  title: string
  description: string
  emoji: string
}

const MINI_GAMES: MiniGame[] = [
  {
    to: '/mini-oyunlar/oyunculardan-film-bul',
    title: 'Oyunculardan Film Bul',
    description: 'Kadro fotoğraflarına bakıp 4 seçenekten doğru yapımı bul. Az ipucuyla bulmak daha yüksek skor kazandırır.',
    emoji: '🎭',
  },
]

export default function MiniGames() {
  return (
    <div className="page page--doc">
      <header className="page-head">
        <span className="page-eyebrow">Mini Oyunlar</span>
        <h1 className="page-title">Kısa molalar için</h1>
        <p className="page-lead">
          Ana oyundan farklı, hızlı oynanan küçük bulmacalar. Zamanla yenileri eklenecek.
        </p>
      </header>

      <div className="mini-games-grid">
        {MINI_GAMES.map((game) => (
          <Link key={game.to} to={game.to} className="step-card mini-game-card">
            <span className="step-num" aria-hidden="true">
              {game.emoji}
            </span>
            <h2 className="step-title">{game.title}</h2>
            <p className="step-body">{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
