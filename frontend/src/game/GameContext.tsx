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
import { readPrefs, writePrefs } from '../prefs'

/** Default for the setup screen shown when entering the game — can be changed. */
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
  return err instanceof Error ? err.message : 'An unexpected error occurred'
}

/** 'free' = unlimited random games, 'daily' = the daily puzzle */
export type GameMode = 'free' | 'daily'

/** The next step of the shortest path from the title the player is on. */
export interface Hint {
  /** `${media_type}:${id}` of the title the hint was computed from */
  fromKey: string
  actor: CastMember
  media: MediaBrief
}

/** 'unavailable' = no known path from the current title (it's outside our title pool). */
export type HintStatus = 'idle' | 'loading' | 'unavailable'

function mediaKey(media: { media_type: string; id: number }): string {
  return `${media.media_type}:${media.id}`
}

interface GameContextValue {
  game: NewGameResponse | null
  mode: GameMode
  /** Only set in daily mode: number, par, date */
  daily: DailyGameResponse | null
  chain: ChainNode[]
  currentMedia: MediaBrief | null
  cast: CastMember[]
  /** The rest of the current title's cast — searchable, hidden until asked for */
  moreCast: CastMember[]
  directors: CastMember[]
  credits: CreditItem[]
  selectedActor: CastMember | null
  status: GameStatus
  error: string | null
  moves: number
  elapsed: number
  /** Time limit chosen for free play; null means unlimited. */
  durationSeconds: number | null
  /** Updates the time-limit choice on the setup screen — doesn't start the game. */
  setDurationSeconds: (value: number | null) => void
  /** Time left — null when durationSeconds is null. */
  timeLeft: number | null
  isActive: boolean
  /** Example solution filled in on give-up or win; stays null if it couldn't be fetched. */
  solution: SolutionResponse | null
  /** Badges newly unlocked by the last win — the ticket celebrates these. */
  newlyUnlockedBadges: Badge[]
  /** Setup-screen choice: leave animated titles out of free play. Remembered per browser. */
  excludeAnimation: boolean
  setExcludeAnimation: (value: boolean) => void
  /** Whether the game in progress was started with animation left out */
  gameExcludesAnimation: boolean
  hint: Hint | null
  hintStatus: HintStatus
  hintsUsed: number
  /** Shows the next step toward the target. Each new hint counts against the result. */
  requestHint: () => void
  /** From the title list, go back to the current title's cast without making a move. */
  backToCast: () => void
  /** Starts a timed free-play game. Pass a null duration to play without a limit. */
  startNewGame: (duration?: number | null) => void
  startDailyGame: () => void
  /** Abandons the current game and returns to the setup screen — to change the time limit. */
  resetToSetup: () => void
  selectActor: (actor: CastMember) => void
  selectMedia: (credit: CreditItem) => void
  giveUp: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

/**
 * Game state lives above the router: if the user visits the rules or
 * stats and comes back, the unfinished game isn't lost.
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<NewGameResponse | null>(null)
  const [mode, setMode] = useState<GameMode>('free')
  const [daily, setDaily] = useState<DailyGameResponse | null>(null)
  const [chain, setChain] = useState<ChainNode[]>([])
  const [currentMedia, setCurrentMedia] = useState<MediaBrief | null>(null)
  const [cast, setCast] = useState<CastMember[]>([])
  const [moreCast, setMoreCast] = useState<CastMember[]>([])
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
  const [excludeAnimation, setExcludeAnimationState] = useState(() => readPrefs().excludeAnimation)
  const [gameExcludesAnimation, setGameExcludesAnimation] = useState(false)
  const [hint, setHint] = useState<Hint | null>(null)
  const [hintStatus, setHintStatus] = useState<HintStatus>('idle')
  const [hintsUsed, setHintsUsed] = useState(0)

  const setExcludeAnimation = useCallback((value: boolean) => {
    setExcludeAnimationState(value)
    writePrefs({ ...readPrefs(), excludeAnimation: value })
  }, [])

  const moves = chain.filter((node) => node.kind === 'actor').length
  const isFinished = status === 'won' || status === 'gave-up' || status === 'timeout'
  // The "game in progress" dot in the menu refers to free play; the daily
  // has its own marker.
  const isActive = game !== null && !isFinished && mode === 'free'
  const timeLeft = durationSeconds !== null ? Math.max(durationSeconds - elapsed, 0) : null

  // Prevents racing timer triggers while a game is ending/starting.
  const endingRef = useRef(false)

  useEffect(() => {
    if (startedAt === null || isFinished || status === 'idle') return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startedAt, status, isFinished])

  // To read the latest chain without closing over it in callbacks
  const chainRef = useRef(chain)
  chainRef.current = chain
  const gameRef = useRef(game)
  gameRef.current = game

  const loadCast = useCallback(async (media: MediaBrief) => {
    setStatus('loading')
    try {
      const response = await getMediaCast(media.media_type, media.id)
      setCast(response.cast)
      setMoreCast(response.more_cast ?? [])
      setDirectors(response.directors)
      setSelectedActor(null)
      setCredits([])
      setStatus('picking-actor')
    } catch (err) {
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [])

  /** Both modes share the same flow; the only difference is where the matchup comes from. */
  const resetHints = useCallback(() => {
    setHint(null)
    setHintStatus('idle')
    setHintsUsed(0)
  }, [])

  const startGame = useCallback(
    (
      fetchGame: () => Promise<NewGameResponse>,
      nextMode: GameMode,
      duration: number | null,
      skipAnimation: boolean,
    ) => {
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
        resetHints()
        setGameExcludesAnimation(skipAnimation)
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
    [loadCast, resetHints],
  )

  const startNewGame = useCallback(
    (duration: number | null = durationSeconds) =>
      startGame(() => getNewGame(excludeAnimation), 'free', duration, excludeAnimation),
    [startGame, durationSeconds, excludeAnimation],
  )
  // The daily is the same puzzle for everyone, so it never leaves anything out.
  const startDailyGame = useCallback(() => startGame(getDailyGame, 'daily', null, false), [startGame])

  /** To change the setup: abandons the game and returns to the /play setup screen. */
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
    resetHints()
    setStatus('idle')
  }, [resetHints])

  const selectActor = useCallback(
    (actor: CastMember) => {
      void (async () => {
        setStatus('loading')
        try {
          const response = await getActorCredits(actor.person_id, actor.is_director ? 'director' : 'cast')
          setSelectedActor(actor)
          // Titles already visited are no longer removed from the list — the player
          // can bring the chain back to the same title if they want.
          setCredits(
            gameExcludesAnimation
              ? response.credits.filter((credit) => !credit.is_animation)
              : response.credits,
          )
          setStatus('picking-media')
        } catch (err) {
          setError(errorMessage(err))
          setStatus('error')
        }
      })()
    },
    [gameExcludesAnimation],
  )

  const backToCast = useCallback(() => {
    if (status !== 'picking-media') return
    setSelectedActor(null)
    setCredits([])
    setStatus('picking-actor')
  }, [status])

  const requestHint = useCallback(() => {
    const current = gameRef.current
    if (!current || !currentMedia || hintStatus === 'loading') return
    if (status !== 'picking-actor' && status !== 'picking-media') return

    const fromKey = mediaKey(currentMedia)
    // Already holding a hint for this title: just make sure it's visible, no extra cost.
    if (hint && hint.fromKey === fromKey) {
      if (status === 'picking-media' && selectedActor?.person_id !== hint.actor.person_id) backToCast()
      return
    }

    // A hint is about which actor to pick, so it's shown on the cast screen.
    if (status === 'picking-media') backToCast()
    setHintStatus('loading')
    void (async () => {
      try {
        const path = await getSolution(currentMedia, current.target, gameExcludesAnimation)
        const step = path.steps[0]
        if (!step) {
          setHintStatus('unavailable')
          return
        }
        setHint({ fromKey, actor: step.actor, media: step.media })
        setHintsUsed((count) => count + 1)
        setHintStatus('idle')
      } catch {
        setHintStatus('unavailable')
      }
    })()
  }, [currentMedia, hint, hintStatus, status, selectedActor, backToCast, gameExcludesAnimation])

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
      setHint(null)
      setHintStatus('idle')

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

        // Grab the badges unlocked before saving so we can tell which ones are "new" afterwards.
        const beforeIds = new Set(evaluateUnlockedBadges().map((badge) => badge.id))

        recordWin({
          moves: finalMoves,
          seconds,
          startTitle: game.start.title,
          targetTitle: game.target.title,
          at: winAt,
          usedDirector,
          hints: hintsUsed,
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
            hints: hintsUsed,
          })
        }

        const afterSync = evaluateUnlockedBadges()
        setNewlyUnlockedBadges(afterSync.filter((badge) => !beforeIds.has(badge.id)))
        const knownIds = new Set(afterSync.map((badge) => badge.id))

        // Fetch the shortest solution in the background — the win screen opens without
        // waiting, and the comparison appears once it's ready. The "Shortest Path" badge
        // can only be known after this arrives, so it's evaluated here.
        void (async () => {
          try {
            const sol = await getSolution(game.start, game.target, gameExcludesAnimation)
            setSolution(sol)
            // A hinted game was shown the way, so it doesn't earn the "Shortest Path" badge.
            if (sol && sol.hops === finalMoves && hintsUsed === 0) {
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
    [selectedActor, game, daily, startedAt, elapsed, loadCast, hintsUsed, gameExcludesAnimation],
  )

  /**
   * Ends the game with a solution — used on give-up or when time runs out.
   * The game ends even if the solution can't be fetched: not showing the answer
   * is better than leaving the player stuck in the game.
   */
  const finishWithSolution = useCallback(
    async (nextStatus: 'gave-up' | 'timeout') => {
      const current = gameRef.current
      if (!current || endingRef.current) return
      endingRef.current = true
      setStatus('loading')
      try {
        setSolution(await getSolution(current.start, current.target, gameExcludesAnimation))
      } catch {
        setSolution(null)
      }
      setStatus(nextStatus)
    },
    [gameExcludesAnimation],
  )

  const giveUp = useCallback(() => {
    void finishWithSolution('gave-up')
  }, [finishWithSolution])

  // Ends the game automatically when the time limit runs out.
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
      moreCast,
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
      excludeAnimation,
      setExcludeAnimation,
      gameExcludesAnimation,
      hint,
      hintStatus,
      hintsUsed,
      requestHint,
      backToCast,
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
      moreCast,
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
      excludeAnimation,
      setExcludeAnimation,
      gameExcludesAnimation,
      hint,
      hintStatus,
      hintsUsed,
      requestHint,
      backToCast,
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
  if (!context) throw new Error('useGame must be used inside GameProvider')
  return context
}
