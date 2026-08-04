import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="page page--doc">
      <header className="page-head">
        <span className="page-eyebrow">Hakkında</span>
        <h1 className="page-title">Dizilink nedir?</h1>
        <p className="page-lead">
          Sinema dünyasının ne kadar küçük olduğunu gösteren küçük bir tarayıcı oyunu.
        </p>
      </header>

      <section className="doc-section prose">
        <h2 className="section-title">Fikir</h2>
        <p>
          Neredeyse her film ve dizi, ortak oyuncular üzerinden birbirine bağlanabilir. Aradaki
          mesafe genelde sandığından çok daha kısadır. Dizilink sana rastgele iki yapım verip
          aradaki zinciri kurmanı ister — ve genellikle üç beş hamlede varabildiğini görünce
          şaşırırsın.
        </p>

        <h2 className="section-title">Veri kaynağı</h2>
        <p>
          Tüm film, dizi ve oyuncu bilgileri{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer noopener">
            TMDB
          </a>{' '}
          API'sinden geliyor. Dizilink, TMDB tarafından onaylanmamış veya sertifikalandırılmamış
          bağımsız bir projedir. Poster ve fotoğraf hakları ilgili sahiplerine aittir.
        </p>

        <h2 className="section-title">Verilerin</h2>
        <p>
          Hesap açman gerekmiyor, hiçbir kişisel bilgi toplanmıyor. Skorların yalnızca senin
          tarayıcının yerel deposunda tutulur; istediğin an{' '}
          <Link to="/istatistikler">İstatistikler</Link> sayfasından silebilirsin. Başka bir
          cihazda açtığında skorlarını görmemenin sebebi de bu.
        </p>

        <h2 className="section-title">Teknik</h2>
        <p>
          Arayüz React ve TypeScript ile, sunucu tarafı Python ve FastAPI ile yazıldı. TMDB
          isteklerinin sonuçları sunucuda önbelleğe alınıyor, böylece oyun hızlı açılıyor ve API
          gereksiz yere yorulmuyor.
        </p>
      </section>

      <section className="cta">
        <h2 className="cta-title">Denemek en iyisi</h2>
        <Link to="/oyna" className="btn-primary btn-lg">
          Oynamaya başla
        </Link>
      </section>
    </div>
  )
}
