import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  CastMember,
  ChainNode,
  CreditItem,
  DailyGameResponse,
  GameStatus,
  MediaBrief,
  NewGameResponse,
  SolutionResponse,
} from '../types'
import { getActorCredits, getDailyGame, getMediaCast, getNewGame, getSolution } from '../api'
import { patchWin, recordStart, recordWin } from '../stats'
import { patchDailyResult, recordDailyResult } from '../daily'
import type { Badge } from '../achievements'
import { evaluateUnlockedBadges } from '../achievements'

/** Oyuna girince gösterilen kurulum ekranının varsayılanı — istenirse değiştirilir. */
export const DEFAULT_DURATION_SECONDS = 180

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

/** 'free' = sınırsız rastgele oyun, 'daily' = günün bulmacası */
export type GameMode = 'free' | 'daily'

interface GameContextValue {
  game: NewGameResponse | null
  mode: GameMode
  /** Sadece günlük modda dolu: numara, par, tarih */
  daily: DailyGameResponse | null
  chain: ChainNode[]
  currentMedia: MediaBrief | null
  cast: CastMember[]
  directors: CastMember[]
  credits: CreditItem[]
  selectedActor: CastMember | null
  status: GameStatus
  error: string | null
  moves: number
  elapsed: number
  /** Serbest oyunda seçilen süre sınırı; null ise sınırsız. */
  durationSeconds: number | null
  /** Kurulum ekranında süre seçimini günceller — oyunu başlatmaz. */
  setDurationSeconds: (value: number | null) => void
  /** Kalan süre — durationSeconds null ise null. */
  timeLeft: number | null
  isActive: boolean
  /** Pes edildiğinde ya da kazanıldığında dolan örnek çözüm; alınamadıysa null kalır. */
  solution: SolutionResponse | null
  /** Son kazanımda yeni açılan rozetler — bilet bunu kutlar. */
  newlyUnlockedBadges: Badge[]
  /** Süre limitli serbest oyun başlatır. duration null verilirse sınırsız oynanır. */
  startNewGame: (duration?: number | null) => void
  startDailyGame: () => void
  /** Devam eden oyunu bırakıp kurulum ekranına döner — süreyi değiştirmek için. */
  resetToSetup: () => void
  selectActor: (actor: CastMember) => void
  selectMedia: (credit: CreditItem) => void
  giveUp: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

/**
 * Oyun state'i router'ın üstünde durur: kullanıcı kurallara ya da
 * istatistiklere gidip geri döndüğünde yarım kalan oyun kaybolmaz.
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<NewGameResponse | null>(null)
  const [mode, setMode] = useState<GameMode>('free')
  const [daily, setDaily] = useState<DailyGameResponse | null>(null)
  const [chain, setChain] = useState<ChainNode[]>([])
  const [currentMedia, setCurrentMedia] = useState<MediaBrief | null>(null)
  const [cast, setCast] = useState<CastMember[]>([])
  const [directors, setDirectors] = useState<CastMember[]>([])
  const [credits, setCredits] = useState<CreditItem[]>([])
  const [selectedActor, setSelectedActor] = useState<CastMember | null>(null)
  const [status, setStatus] = useState<GameStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(DEFAULT_DURATION_SECONDS)
  const [solution, setSolution] = useState<SolutionResponse | null>(null)
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<Badge[]>([])

  const moves = chain.filter((node) => node.kind === 'actor').length
  const isFinished = status === 'won' || status === 'gave-up' || status === 'timeout'
  // Menüdeki "devam eden oyun" noktası serbest oyuna işaret eder; günlüğün
  // kendi rozeti var.
  const isActive = game !== null && !isFinished && mode === 'free'
  const timeLeft = durationSeconds !== null ? Math.max(durationSeconds - elapsed, 0) : null

  // Oyun bitirme/başlatma sırasında yarışan zamanlayıcı tetiklemelerini önler.
  const endingRef = useRef(false)

  useEffect(() => {
    if (startedAt === null || isFinished || status === 'idle') return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startedAt, status, isFinished])

  // Zincirin güncel halini callback'lere kapatmadan okumak için
  const chainRef = useRef(chain)
  chainRef.current = chain
  const gameRef = useRef(game)
  gameRef.current = game

  const loadCast = useCallback(async (media: MediaBrief) => {
    setStatus('loading')
    try {
      const response = await getMediaCast(media.media_type, media.id)
      setCast(response.cast)
      setDirectors(response.directors)
      setSelectedActor(null)
      setCredits([])
      setStatus('picking-actor')
    } catch (err) {
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [])

  /** İki mod da aynı akışı kullanır, tek fark eşleşmenin nereden geldiği. */
  const startGame = useCallback(
    (fetchGame: () => Promise<NewGameResponse>, nextMode: GameMode, duration: number | null) => {
      void (async () => {
        endingRef.current = false
        setStatus('loading')
        setError(null)
        setChain([])
        setSelectedActor(null)
        setCredits([])
        setElapsed(0)
        setStartedAt(null)
        setMode(nextMode)
        setDaily(null)
        setSolution(null)
        setNewlyUnlockedBadges([])
        setDurationSeconds(nextMode === 'daily' ? null : duration)
        try {
          const response = await fetchGame()
          setGame(response)
          if (nextMode === 'daily') setDaily(response as DailyGameResponse)
          setChain([{ kind: 'media', media: response.start }])
          setCurrentMedia(response.start)
          setStartedAt(Date.now())
          recordStart()
          await loadCast(response.start)
        } catch (err) {
          setError(errorMessage(err))
          setStatus('error')
        }
      })()
    },
    [loadCast],
  )

  const startNewGame = useCallback(
    (duration: number | null = durationSeconds) => startGame(getNewGame, 'free', duration),
    [startGame, durationSeconds],
  )
  const startDailyGame = useCallback(() => startGame(getDailyGame, 'daily', null), [startGame])

  /** Kurulumu değiştirmek için: oyunu bırakır, /oyna kurulum ekranına döner. */
  const resetToSetup = useCallback(() => {
    endingRef.current = false
    setGame(null)
    setMode('free')
    setDaily(null)
    setChain([])
    setSelectedActor(null)
    setCredits([])
    setElapsed(0)
    setStartedAt(null)
    setSolution(null)
    setNewlyUnlockedBadges([])
    setStatus('idle')
  }, [])

  const selectActor = useCallback((actor: CastMember) => {
    void (async () => {
      setStatus('loading')
      try {
        const response = await getActorCredits(actor.person_id, actor.is_director ? 'director' : 'cast')
        setSelectedActor(actor)
        // Daha önce uğranmış bir yapım listeden çıkarılmıyor artık — oyuncu
        // isterse zinciri aynı filme geri döndürebilir.
        setCredits(response.credits)
        setStatus('picking-media')
      } catch (err) {
        setError(errorMessage(err))
        setStatus('error')
      }
    })()
  }, [])

  const selectMedia = useCallback(
    (credit: CreditItem) => {
      if (!selectedActor || !game) return
      const media = creditToMediaBrief(credit)
      const nextChain: ChainNode[] = [
        ...chainRef.current,
        { kind: 'actor', actor: selectedActor },
        { kind: 'media', media },
      ]
      setChain(nextChain)
      setCurrentMedia(media)

      const reachedTarget =
        media.id === game.target.id && media.media_type === game.target.media_type

      if (reachedTarget) {
        endingRef.current = true
        const seconds = startedAt !== null ? Math.floor((Date.now() - startedAt) / 1000) : elapsed
        const finalMoves = nextChain.filter((node) => node.kind === 'actor').length
        const usedDirector = nextChain.some(
          (node) => node.kind === 'actor' && node.actor.is_director,
        )
        const winAt = Date.now()
        setElapsed(seconds)
        setStatus('won')

        // Kayıttan önceki açık rozetleri al ki kaydettikten sonra "yeni" olanı ayırt edelim.
        const beforeIds = new Set(evaluateUnlockedBadges().map((badge) => badge.id))

        recordWin({
          moves: finalMoves,
          seconds,
          startTitle: game.start.title,
          targetTitle: game.target.title,
          at: winAt,
          usedDirector,
        })
        if (daily) {
          recordDailyResult({
            date: daily.date,
            number: daily.number,
            par: daily.par,
            moves: finalMoves,
            seconds,
            startTitle: daily.start.title,
            targetTitle: daily.target.title,
            at: winAt,
            usedDirector,
          })
        }

        const afterSync = evaluateUnlockedBadges()
        setNewlyUnlockedBadges(afterSync.filter((badge) => !beforeIds.has(badge.id)))
        const knownIds = new Set(afterSync.map((badge) => badge.id))

        // En kısa çözümü arka planda getir — kazanma ekranı beklemeden açılır,
        // karşılaştırma hazır olduğunda kendiliğinden belirir. "En kısa yolu buldun"
        // rozeti de ancak bu geldikten sonra bilinebildiği için burada değerlendirilir.
        void (async () => {
          try {
            const sol = await getSolution(game.start, game.target)
            setSolution(sol)
            if (sol && sol.hops === finalMoves) {
              patchWin(winAt, { optimal: true })
              if (daily) patchDailyResult(daily.date, { optimal: true })
              const afterAsync = evaluateUnlockedBadges().filter(
                (badge) => !knownIds.has(badge.id),
              )
              if (afterAsync.length > 0) {
                setNewlyUnlockedBadges((prev) => [...prev, ...afterAsync])
              }
            }
          } catch {
            setSolution(null)
          }
        })()
        return
      }
      void loadCast(media)
    },
    [selectedActor, game, daily, startedAt, elapsed, loadCast],
  )

  /**
   * Oyunu bir çözümle kapatır — pes edildiğinde ya da süre dolduğunda kullanılır.
   * Çözüm alınamasa bile oyun kapanır: cevabı gösterememek, oyuncuyu oyunda
   * kilitli bırakmaktan iyidir.
   */
  const finishWithSolution = useCallback(
    async (nextStatus: 'gave-up' | 'timeout') => {
      const current = gameRef.current
      if (!current || endingRef.current) return
      endingRef.current = true
      setStatus('loading')
      try {
        setSolution(await getSolution(current.start, current.target))
      } catch {
        setSolution(null)
      }
      setStatus(nextStatus)
    },
    [],
  )

  const giveUp = useCallback(() => {
    void finishWithSolution('gave-up')
  }, [finishWithSolution])

  // Süre sınırı dolunca oyunu otomatik bitirir.
  useEffect(() => {
    if (durationSeconds === null || isFinished || status === 'idle' || endingRef.current) return
    if (elapsed >= durationSeconds) {
      void finishWithSolution('timeout')
    }
  }, [elapsed, durationSeconds, isFinished, status, finishWithSolution])

  const value = useMemo<GameContextValue>(
    () => ({
      game,
      mode,
      daily,
      chain,
      currentMedia,
      cast,
      directors,
      credits,
      selectedActor,
      status,
      error,
      moves,
      elapsed,
      durationSeconds,
      setDurationSeconds,
      timeLeft,
      isActive,
      solution,
      newlyUnlockedBadges,
      startNewGame,
      startDailyGame,
      resetToSetup,
      selectActor,
      selectMedia,
      giveUp,
    }),
    [
      game,
      mode,
      daily,
      chain,
      currentMedia,
      cast,
      directors,
      credits,
      selectedActor,
      status,
      error,
      moves,
      elapsed,
      durationSeconds,
      timeLeft,
      isActive,
      solution,
      newlyUnlockedBadges,
      startNewGame,
      startDailyGame,
      resetToSetup,
      selectActor,
      selectMedia,
      giveUp,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame, GameProvider içinde kullanılmalı')
  return context
}
