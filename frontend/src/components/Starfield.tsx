import './starfield.css'

/** Drifting night sky behind every page: three layers of tiny pixel stars. Purely decorative. */
export default function Starfield() {
  return (
    <div className="starfield" aria-hidden="true">
      <div className="starfield-layer starfield-layer--1" />
      <div className="starfield-layer starfield-layer--2" />
      <div className="starfield-layer starfield-layer--3" />
    </div>
  )
}
