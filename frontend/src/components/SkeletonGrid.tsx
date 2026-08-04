/** Veri gelene kadar gridin yerini tutar — sayfanın zıplamasını önler. */
export default function SkeletonGrid() {
  return (
    <div className="picker" aria-busy="true" aria-live="polite">
      <div className="window-bar">
        <span className="window-title">YUKLENIYOR…</span>
        <span className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
      <div className="picker-body">
      <div className="picker-head">
        <div className="skeleton skeleton-line" style={{ width: '260px', height: '26px' }} />
      </div>
      <div className="skeleton skeleton-line skeleton-search" />
      <div className="card-grid">
        {Array.from({ length: 12 }, (_, index) => (
          <div className="pick-card pick-card--skeleton" key={index}>
            <div className="skeleton pick-card-poster" />
            <div className="skeleton skeleton-line" style={{ width: '80%', height: '11px' }} />
            <div className="skeleton skeleton-line" style={{ width: '55%', height: '9px' }} />
          </div>
        ))}
      </div>
        <span className="sr-only">Yükleniyor</span>
      </div>
    </div>
  )
}
