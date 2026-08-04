import { useGame } from '../game/GameContext'
import ChainDisplay from './ChainDisplay'
import ActorPicker from './ActorPicker'
import MediaPicker from './MediaPicker'
import SkeletonGrid from './SkeletonGrid'

interface GameBoardProps {
  /** Hata durumunda "tekrar dene" hangi oyunu başlatsın */
  onRetry: () => void
  /** İlk yükleme ekranında gösterilecek metin */
  loadingLabel?: string
}

/**
 * Oyun tahtası: zincir + seçim ızgaraları. Serbest oyun ve günlük bulmaca
 * aynı tahtayı kullanır, sadece üstteki başlık/HUD kısmı farklıdır.
 */
export default function GameBoard({ onRetry, loadingLabel }: GameBoardProps) {
  const {
    game,
    chain,
    currentMedia,
    cast,
    directors,
    credits,
    selectedActor,
    status,
    error,
    selectActor,
    selectMedia,
  } = useGame()

  return (
    <>
      {status === 'error' && error && (
        <div className="alert" role="alert">
          <span className="alert-icon" aria-hidden="true">
            !
          </span>
          <div className="alert-body">
            <strong>Bir şeyler ters gitti</strong>
            <span>{error}</span>
          </div>
          <button className="btn-ghost" onClick={onRetry}>
            Tekrar dene
          </button>
        </div>
      )}

      {game !== null && status !== 'won' && status !== 'gave-up' && chain.length > 0 && (
        <ChainDisplay chain={chain} />
      )}

      {status === 'loading' && game && <SkeletonGrid />}

      {status === 'picking-actor' && currentMedia && (
        <ActorPicker
          cast={cast}
          directors={directors}
          currentTitle={currentMedia.title}
          onSelect={selectActor}
        />
      )}

      {status === 'picking-media' && selectedActor && (
        <MediaPicker
          credits={credits}
          actorName={selectedActor.name}
          isDirector={selectedActor.is_director}
          onSelect={selectMedia}
        />
      )}

      {status === 'loading' && !game && (
        <div className="page-loading">
          <span className="brand-mark brand-mark--spin" aria-hidden="true" />
          <p>{loadingLabel ?? 'Yeni bir eşleşme hazırlanıyor…'}</p>
        </div>
      )}
    </>
  )
}
