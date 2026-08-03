import { useState } from 'react'
import type {
  CastMember,
  ChainNode,
  CreditItem,
  GameStatus,
  MediaBrief,
  NewGameResponse,
} from './types'
import { getActorCredits, getMediaCast, getNewGame } from './api'
import GameHeader from './components/GameHeader'
import ChainDisplay from './components/ChainDisplay'
import ActorPicker from './components/ActorPicker'
import MediaPicker from './components/MediaPicker'
import WinBanner from './components/WinBanner'
import './App.css'

function mediaKey(mediaType: string, id: number): string {
  return `${mediaType}:${id}`
}

function creditToMediaBrief(credit: CreditItem): MediaBrief {
  return {
    id: credit.media_id,
    media_type: credit.media_type,
    title: credit.title,
    poster_path: credit.poster_path,
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu'
}

export default function App() {
  const [game, setGame] = useState<NewGameResponse | null>(null)
  const [chain, setChain] = useState<ChainNode[]>([])
  const [currentMedia, setCurrentMedia] = useState<MediaBrief | null>(null)
  const [cast, setCast] = useState<CastMember[]>([])
  const [credits, setCredits] = useState<CreditItem[]>([])
  const [selectedActor, setSelectedActor] = useState<CastMember | null>(null)
  const [status, setStatus] = useState<GameStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const visitedKeys = new Set(
    chain
      .filter((node): node is Extract<ChainNode, { kind: 'media' }> => node.kind === 'media')
      .map((node) => mediaKey(node.media.media_type, node.media.id)),
  )

  async function loadCast(media: MediaBrief) {
    setStatus('loading')
    try {
      const response = await getMediaCast(media.media_type, media.id)
      setCast(response.cast)
      setSelectedActor(null)
      setCredits([])
      setStatus('picking-actor')
    } catch (err) {
      setError(errorMessage(err))
      setStatus('error')
    }
  }

  async function startNewGame() {
    setStatus('loading')
    setError(null)
    try {
      const response = await getNewGame()
      setGame(response)
      setChain([{ kind: 'media', media: response.start }])
      setCurrentMedia(response.start)
      await loadCast(response.start)
    } catch (err) {
      setError(errorMessage(err))
      setStatus('error')
    }
  }

  async function handleSelectActor(actor: CastMember) {
    setStatus('loading')
    try {
      const response = await getActorCredits(actor.person_id)
      const filtered = response.credits.filter(
        (credit) => !visitedKeys.has(mediaKey(credit.media_type, credit.media_id)),
      )
      setSelectedActor(actor)
      setCredits(filtered)
      setStatus('picking-media')
    } catch (err) {
      setError(errorMessage(err))
      setStatus('error')
    }
  }

  async function handleSelectMedia(credit: CreditItem) {
    if (!selectedActor || !game) return
    const media = creditToMediaBrief(credit)
    setChain((prev) => [...prev, { kind: 'actor', actor: selectedActor }, { kind: 'media', media }])
    setCurrentMedia(media)

    const reachedTarget =
      media.id === game.target.id && media.media_type === game.target.media_type
    if (reachedTarget) {
      setStatus('won')
      return
    }
    await loadCast(media)
  }

  function resetGame() {
    setGame(null)
    setChain([])
    setCurrentMedia(null)
    setCast([])
    setCredits([])
    setSelectedActor(null)
    setError(null)
    void startNewGame()
  }

  return (
    <div className="app">
      <h1>Dizilink</h1>
      <GameHeader game={game} onNewGame={() => void startNewGame()} />

      {status === 'error' && error && <p className="error">{error}</p>}

      {game && <ChainDisplay chain={chain} />}

      {status === 'picking-actor' && currentMedia && (
        <ActorPicker
          cast={cast}
          currentTitle={currentMedia.title}
          onSelect={(actor) => void handleSelectActor(actor)}
        />
      )}

      {status === 'picking-media' && selectedActor && (
        <MediaPicker
          credits={credits}
          actorName={selectedActor.name}
          onSelect={(credit) => void handleSelectMedia(credit)}
        />
      )}

      {status === 'won' && game && <WinBanner chain={chain} onPlayAgain={resetGame} />}
    </div>
  )
}
