import { Link } from 'react-router-dom'

const RULES = [
  {
    title: 'Başlangıç ve hedef',
    body: 'Her oyunda sana rastgele iki yapım verilir: solda başlangıç (pembe), sağda hedef (mint yeşil). Amacın soldakinden sağdakine bir zincir kurmak.',
  },
  {
    title: 'Adım 1 — Oyuncu seç',
    body: 'Elindeki yapımın kadrosunu görürsün. Birini seçersin. Seçtiğin oyuncu zincire eklenir.',
  },
  {
    title: 'Adım 2 — Yapım seç',
    body: 'Seçtiğin oyuncunun oynadığı diğer yapımlar listelenir. Birini seçersin ve artık oradasın. Zincirin bir halka uzadı.',
  },
  {
    title: 'Tekrar et',
    body: 'Yeni yapımın kadrosundan yine bir oyuncu seçersin. Hedefe varana kadar bu böyle sürer.',
  },
  {
    title: 'Kazanma',
    body: 'Hedef yapımı seçtiğin anda oyun biter. Kaç hamle harcadığın ve ne kadar sürdüğü kaydedilir.',
  },
]

const TIPS = [
  {
    title: 'Çok oynayan oyuncuları seç',
    body: 'Uzun kariyerli, hem film hem dizi yapmış oyuncular sana en çok kapıyı açar. Kadronun başındaki isimler genelde daha bağlantılıdır.',
  },
  {
    title: 'Hedefin türünü düşün',
    body: 'Hedef bir Türk dizisiyse Türk oyuncular üzerinden ilerlemek mantıklı. Hedef bir Marvel filmiyse yan karakterler bile seni oraya taşıyabilir.',
  },
  {
    title: 'Takılırsan pes edebilirsin',
    body: '"Pes et" oyunu bitirir ve örnek bir çözüm gösterir — hangi oyuncunun hangi yapımı bağladığını görürsün.',
  },
  {
    title: 'Aynı yapıma iki kez gidilmez',
    body: 'Zincirde daha önce uğradığın yapımlar listeden otomatik çıkarılır — döngüye girmezsin.',
  },
]

export default function HowToPlay() {
  return (
    <div className="page page--doc">
      <header className="page-head">
        <span className="page-eyebrow">Kurallar</span>
        <h1 className="page-title">Nasıl oynanır</h1>
        <p className="page-lead">
          Kuralları öğrenmek bir dakika sürer. İyi oynamak biraz sinema bilgisi ister.
        </p>
      </header>

      <section className="doc-section">
        <h2 className="section-title">Oyunun akışı</h2>
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
        <h2 className="section-title">Renkleri oku</h2>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-swatch legend-swatch--pink" aria-hidden="true" />
            <div>
              <strong>Pembe</strong>
              <span>Başlangıç noktası ve oyuncu seçme adımı</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-swatch legend-swatch--mint" aria-hidden="true" />
            <div>
              <strong>Mint yeşil</strong>
              <span>Hedef yapım ve yapım seçme adımı</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-swatch legend-swatch--grad" aria-hidden="true" />
            <div>
              <strong>Geçiş</strong>
              <span>Zincirin rengi hedefe yaklaştıkça pembeden yeşile döner</span>
            </div>
          </div>
        </div>
      </section>

      <section className="doc-section">
        <h2 className="section-title">Günlük bulmaca</h2>
        <div className="tip-grid">
          <article className="tip-card">
            <h3 className="tip-title">Herkese aynı eşleşme</h3>
            <p className="tip-body">
              Her gün tek bir başlangıç–hedef çifti yayınlanır ve o gün oynayan herkes aynısını
              oynar. Bulmaca gece yarısı (TSİ) yenilenir.
            </p>
          </article>
          <article className="tip-card">
            <h3 className="tip-title">Günde bir hak</h3>
            <p className="tip-body">
              Zinciri tamamladığında o günün sonucu kilitlenir. Daha fazla oynamak istersen serbest
              oyun sınırsız.
            </p>
          </article>
          <article className="tip-card">
            <h3 className="tip-title">Hedef hamle sayısı</h3>
            <p className="tip-body">
              Her bulmacanın bir hedef hamle sayısı var: bizim popüler yapım havuzumuzda bulunan en
              kısa yol. O sayıyı yakalarsan ya da kırarsan gün "kusursuz" sayılır.
            </p>
          </article>
          <article className="tip-card">
            <h3 className="tip-title">Seri ve paylaşım</h3>
            <p className="tip-body">
              Üst üste oynadığın günler seri olarak sayılır. Sonucunu spoiler vermeyen bir metinle
              paylaşabilirsin.
            </p>
          </article>
        </div>
        <p className="doc-link-row">
          <Link to="/gunluk" className="text-link">
            Bugünün bulmacasına git →
          </Link>
        </p>
      </section>

      <section className="doc-section">
        <h2 className="section-title">Strateji ipuçları</h2>
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
        <h2 className="cta-title">Anladın mı? Dene bakalım.</h2>
        <Link to="/oyna" className="btn-primary btn-lg">
          Oynamaya başla
        </Link>
      </section>
    </div>
  )
}
