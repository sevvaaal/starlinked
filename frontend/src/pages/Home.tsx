import { Link } from 'react-router-dom'
import { useGame } from '../game/GameContext'
import { getSummary } from '../stats'
import { getDailyResult, getDailyStats, puzzleDateNow } from '../daily'

const STEPS = [
  {
    n: '01',
    title: 'İki yapım al',
    body: 'Sana rastgele bir başlangıç ve bir hedef film/dizi veriyoruz. Aralarında görünürde hiçbir bağ yok.',
    tone: 'pink',
  },
  {
    n: '02',
    title: 'Bir oyuncu seç',
    body: 'Elindeki yapımın kadrosundan birini seç. O oyuncu seni yeni yapımlara açacak kapıdır.',
    tone: 'mix',
  },
  {
    n: '03',
    title: 'Hedefe ulaş',
    body: 'Oyuncunun oynadığı başka bir yapıma atla ve tekrarla. En az hamleyle hedefe var.',
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
        <span className="sparkle sparkle--1" aria-hidden="true" />
        <span className="sparkle sparkle--2" aria-hidden="true" />
        <span className="sparkle sparkle--3" aria-hidden="true" />
        <span className="sparkle sparkle--4" aria-hidden="true" />
        <span className="hero-eyebrow">Film & dizi bağlantı oyunu</span>
        <h1>
          Her film bir <em className="grad-pink">oyuncuyla</em>
          <br />
          başka bir <em className="grad-mint">filme</em> bağlanır
        </h1>
        <p className="hero-sub">
          Başlangıçtan hedefe giden zinciri ortak oyuncuları takip ederek kur. Kaç hamlede
          varabileceğini gör.
        </p>

        <div className="hero-actions">
          <Link to="/gunluk" className="btn-primary btn-lg">
            Günün bulmacası
          </Link>
          <Link to="/oyna" className="btn-ghost btn-lg-ghost">
            {isActive ? 'Oyuna devam et' : 'Serbest oyna'}
          </Link>
        </div>

        {isActive ? (
          <p className="hero-resume">
            Yarım kalmış bir oyunun var — <strong>{moves} hamle</strong> yapmışsın.
          </p>
        ) : (
          <p className="hero-resume">
            İlk kez mi geldin? <Link to="/nasil-oynanir" className="text-link">Nasıl oynanır?</Link>
          </p>
        )}
      </section>

      {/* Günlük şeridi: herkesin aynı eşleşmeyi oynadığı tek günlük bulmaca */}
      <section className="daily-strip window window--yellow">
        <div className="window-bar">
          <span className="window-title">GÜNÜN BULMACASI</span>
          <span className="window-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>

        <div className="window-body daily-strip-body">
          <div className="daily-strip-main">
            <h2 className="daily-strip-heading">
              {dailyDone ? 'Bugünü çözdün' : 'Bugünün eşleşmesi hazır'}
            </h2>
            <p>
              {dailyDone
                ? `Zinciri ${dailyDone.moves} hamlede kurdun. Yarın yeni bir eşleşme geliyor.`
                : 'Herkes aynı başlangıç ve hedefi oynuyor. Günde bir hakkın var — sonucunu paylaşabilirsin.'}
            </p>
          </div>

          <div className="daily-strip-side">
            {dailyStats.currentStreak > 0 && (
              <div className="mini-stat">
                <span className="mini-stat-value">{dailyStats.currentStreak}</span>
                <span className="mini-stat-label">günlük seri</span>
              </div>
            )}
            <Link to="/gunluk" className="btn-primary">
              {dailyDone ? 'Sonucu gör' : 'Günlüğü oyna'}
            </Link>
          </div>
        </div>
      </section>

      {/* Örnek zincir: oyunun fikrini tek bakışta anlatır */}
      <section className="demo" aria-label="Örnek zincir">
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
        <p className="demo-caption">İki hamlelik bir zincir işte böyle görünür.</p>
      </section>

      <section className="steps" aria-label="Nasıl çalışır">
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
          <h2 className="section-title">Şu ana kadar</h2>
          <div className="home-stats-row">
            <div className="mini-stat">
              <span className="mini-stat-value">{summary.won}</span>
              <span className="mini-stat-label">tamamlanan oyun</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value">{summary.bestMoves}</span>
              <span className="mini-stat-label">en iyi hamle</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value">{summary.averageMoves}</span>
              <span className="mini-stat-label">ortalama hamle</span>
            </div>
          </div>
          <Link to="/istatistikler" className="text-link">
            Tüm istatistikleri gör →
          </Link>
        </section>
      )}

      <section className="cta">
        <h2 className="cta-title">Hazır mısın?</h2>
        <p className="cta-sub">Her oyun yeni bir eşleşme. Aynısı iki kez gelmez.</p>
        <Link to="/oyna" className="btn-primary btn-lg">
          {isActive ? 'Oyuna devam et' : 'Oynamaya başla'}
        </Link>
      </section>
    </div>
  )
}
