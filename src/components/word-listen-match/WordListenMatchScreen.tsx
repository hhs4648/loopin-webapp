import { useEffect, useMemo, useRef, useState } from 'react'
import { EXERCISE_MATCH_TILE_KO_CLASS } from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { BACK_MASK_WHITE_HEADER } from '../navigation/figma-navigation'
import {
  buildTilesFromPairs,
  FEEDBACK_MS,
  figmaRectStyle,
  isFillPairId,
  isMatchingPair,
  pickNextPage,
  WORD_LISTEN_MATCH_ASSETS,
  WORD_LISTEN_MATCH_PROMPT,
  WORD_LISTEN_MATCH_PROMPT_COPY,
  MATCH_TILE_SHADOW,
  WORD_MATCH_TILE_COVERS,
  type WordMatchPair,
  type WordPairId,
  type WordTile,
} from './word-listen-match'
import { sessionWordListenMatchId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import {
  preloadEnglishWordAudio,
  preloadEnglishWords,
  speakEnglishWord,
  stopEnglishWordAudio,
} from '../word-quiz/word-quiz'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import type { RetryWrongExerciseProps } from '../exercise/retry-wrong-ui'

type WordListenMatchScreenProps = {
  sessionOffset: number
  pairs?: WordMatchPair[]
  fillPool?: WordMatchPair[]
  retryPairIds?: WordPairId[]
  answerIdForPair?: (pairId: string) => string
  onAnswer?: (stepId: string, isCorrect: boolean) => void
  onComplete?: () => void
} & RetryWrongExerciseProps

type TileVisualState = 'idle' | 'selected' | 'correct' | 'wrong' | 'disabled'

function tileFrameClass(state: TileVisualState) {
  const base = `box-border border-[3px] ${MATCH_TILE_SHADOW}`

  switch (state) {
    case 'selected':
      return `${base} rounded-2xl border-[#4177FF] bg-[#EFF4FF]`
    case 'correct':
      return `${base} rounded-2xl border-[#22C55E] bg-[#F0FDF4]`
    case 'wrong':
      return `${base} rounded-2xl border-[#EF4444] bg-[#FEF2F2]`
    case 'disabled':
      return `${base} rounded-2xl border-transparent bg-[#EBEBEB]`
    default:
      return `${base} rounded-2xl border-transparent bg-[#FEFEFE]`
  }
}

function tileLabelClass(state: TileVisualState) {
  switch (state) {
    case 'selected':
      return `${EXERCISE_MATCH_TILE_KO_CLASS} text-[#4177FF]`
    case 'correct':
      return `${EXERCISE_MATCH_TILE_KO_CLASS} text-[#22C55E]`
    case 'wrong':
      return `${EXERCISE_MATCH_TILE_KO_CLASS} text-[#EF4444]`
    case 'disabled':
      return `${EXERCISE_MATCH_TILE_KO_CLASS} text-[#9E9FA7]`
    default:
      return `${EXERCISE_MATCH_TILE_KO_CLASS} text-[#1E1E1E]`
  }
}

function audioIconColor(state: TileVisualState) {
  switch (state) {
    case 'selected':
      return '#4177FF'
    case 'correct':
      return '#22C55E'
    case 'wrong':
      return '#EF4444'
    case 'disabled':
      return '#C4C4C8'
    default:
      return '#7A7B83'
  }
}

/** Figma TTS 타일 — 스피커·파형 간격 넓게, 파형 ~13칸 버스트, 칸 안 여백 */
function AudioTileGlyph({ color }: { color: string }) {
  // 지그재그(<> <>) — 여러 피크를 오가는 불규칙 파형
  const barHeights = [7, 14, 28, 12, 32, 18, 36, 10, 30, 16, 34, 11, 26, 8, 20]
  const barW = 2.2
  const barGap = 2.8
  const waveStartX = 46
  const midY = 22

  return (
    <svg
      aria-hidden
      viewBox="0 0 124 44"
      className="h-[44%] w-auto max-h-10"
    >
      {/* volume 스피커 */}
      <path
        fill={color}
        d="M6 16.5h5l8.2-7v25l-8.2-7H6c-1 0-1.8-.8-1.8-1.8v-7.4c0-1 .8-1.8 1.8-1.8z"
      />
      <path
        d="M23.5 15.5c2.2 1.7 3.5 4.4 3.5 7.3s-1.3 5.6-3.5 7.3"
        fill="none"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M28.5 11.5c3.5 2.7 5.6 6.8 5.6 11.3s-2.1 8.6-5.6 11.3"
        fill="none"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      {/* 파형 — 스피커와 간격 확보 후 배치 */}
      {barHeights.map((h, i) => (
        <rect
          key={i}
          x={waveStartX + i * (barW + barGap)}
          y={midY - h / 2}
          width={barW}
          height={h}
          rx={1.1}
          fill={color}
        />
      ))}
    </svg>
  )
}

export function WordListenMatchScreen({
  sessionOffset,
  pairs,
  fillPool,
  retryPairIds,
  answerIdForPair = sessionWordListenMatchId,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  sessionTotalSteps,
  onRetryFlowHome,
}: WordListenMatchScreenProps) {
  const allPairs = useMemo(() => {
    const base = pairs ?? []
    const scoped = retryPairIds
      ? base.filter((pair) => retryPairIds.includes(pair.id))
      : base
    return scoped.filter((pair) => !isFillPairId(pair.id))
  }, [pairs, retryPairIds])

  const pool = useMemo(() => {
    const base = fillPool ?? pairs ?? []
    return base.filter((pair) => !isFillPairId(pair.id))
  }, [fillPool, pairs])

  const totalPairCount = allPairs.length
  const pageKeyRef = useRef(0)

  const [globalMatchedIds, setGlobalMatchedIds] = useState<Set<string>>(() => new Set())
  const wrongPairIdsRef = useRef<Set<string>>(new Set())
  const [pagePairs, setPagePairs] = useState<WordMatchPair[]>(() =>
    pickNextPage(allPairs, new Set(), new Set(), pool, pageKeyRef.current),
  )
  const activeTiles = useMemo(() => buildTilesFromPairs(pagePairs), [pagePairs])

  const [pageMatchedIds, setPageMatchedIds] = useState<Set<string>>(() => new Set())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const pairHadWrongRef = useRef<Set<string>>(new Set())
  const [completed, setCompleted] = useState(false)
  const [feedback, setFeedback] = useState<{
    kind: 'correct' | 'wrong'
    tileIds: string[]
  } | null>(null)
  const [locked, setLocked] = useState(false)
  const feedbackTimerRef = useRef<number | null>(null)

  useEffect(() => {
    void preloadEnglishWordAudio()
    return () => {
      stopEnglishWordAudio()
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  /** 짝이 없으면 다음 섹션으로 바로 넘김 */
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  useEffect(() => {
    if (totalPairCount > 0) return
    onCompleteRef.current?.()
  }, [totalPairCount])

  useEffect(() => {
    const words = [
      ...pagePairs.map((pair) => pair.english),
      ...allPairs.map((pair) => pair.english),
      ...pool.map((pair) => pair.english),
    ]
    void preloadEnglishWords(words)
  }, [pagePairs, allPairs, pool])

  const advanceToNextPage = (nextGlobalMatched: Set<string>) => {
    pageKeyRef.current += 1
    const nextPage = pickNextPage(
      allPairs,
      nextGlobalMatched,
      wrongPairIdsRef.current,
      pool,
      pageKeyRef.current,
    )
    if (nextPage.length === 0) {
      setCompleted(true)
      return
    }
    setPagePairs(nextPage)
    setPageMatchedIds(new Set())
    setSelectedIds([])
    pairHadWrongRef.current = new Set()
    setFeedback(null)
    setLocked(false)
  }

  const getTileState = (tile: WordTile): TileVisualState => {
    if (pageMatchedIds.has(tile.pairId)) return 'disabled'
    if (feedback?.tileIds.includes(tile.id)) return feedback.kind
    if (selectedIds.includes(tile.id)) return 'selected'
    return 'idle'
  }

  const playPairAudio = (pairId: string) => {
    const pair = pagePairs.find((entry) => entry.id === pairId)
    if (pair?.english) {
      speakEnglishWord(pair.english, { force: true })
    }
  }

  const handleTileClick = (tile: WordTile) => {
    if (completed || locked || pageMatchedIds.has(tile.pairId)) return

    // 오디오 타일: TTS를 탭음보다 먼저 — 즉각 재생
    if (tile.side === 'en') {
      playPairAudio(tile.pairId)
    } else {
      playTapSfx()
    }

    if (selectedIds.includes(tile.id)) {
      setSelectedIds((ids) => ids.filter((id) => id !== tile.id))
      return
    }

    if (selectedIds.length === 0) {
      setSelectedIds([tile.id])
      return
    }

    const first = activeTiles.find((entry) => entry.id === selectedIds[0])
    if (!first) {
      setSelectedIds([tile.id])
      return
    }

    if (first.side === tile.side) {
      setSelectedIds([tile.id])
      return
    }

    if (isMatchingPair(first, tile)) {
      setLocked(true)
      playAnswerSfx(true)
      setFeedback({ kind: 'correct', tileIds: [first.id, tile.id] })
      setSelectedIds([])

      feedbackTimerRef.current = window.setTimeout(() => {
        const pairId = tile.pairId
        const isFill = isFillPairId(pairId)
        const isCorrect = !pairHadWrongRef.current.has(pairId)
        if (!isFill) {
          onAnswer?.(answerIdForPair(pairId), isCorrect)
        }

        const nextPageMatched = new Set(pageMatchedIds).add(pairId)
        setPageMatchedIds(nextPageMatched)

        const nextGlobalMatched = new Set(globalMatchedIds).add(pairId)
        setGlobalMatchedIds(nextGlobalMatched)

        setFeedback(null)
        setLocked(false)

        const requiredDone = allPairs.every((pair) =>
          nextGlobalMatched.has(pair.id),
        )
        const pageDone = nextPageMatched.size >= pagePairs.length

        if (requiredDone && pageDone) {
          if (isFinalRetrySection) {
            setCompleted(true)
          } else {
            onComplete?.()
          }
          return
        }

        if (pageDone) {
          advanceToNextPage(nextGlobalMatched)
        }
      }, FEEDBACK_MS)
      return
    }

    setLocked(true)
    playAnswerSfx(false)
    setFeedback({ kind: 'wrong', tileIds: [first.id, tile.id] })
    pairHadWrongRef.current = new Set(pairHadWrongRef.current).add(first.pairId)
    wrongPairIdsRef.current = new Set(wrongPairIdsRef.current).add(first.pairId)
    setSelectedIds([])

    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null)
      setLocked(false)
    }, FEEDBACK_MS)
  }

  return (
    <FigmaAssetFrame backButtonMask={BACK_MASK_WHITE_HEADER}
      src={WORD_LISTEN_MATCH_ASSETS.base}
      alt="단어 TTS 뜻 짝맞추기"
      bgClassName="bg-white"
    >
      <div className="absolute inset-0 z-10">
        {hideProgressBar ? (
          <BakedProgressBarMask />
        ) : (
          <ExerciseProgressBar
            sessionOffset={sessionOffset}
            completedInSection={allPairs.filter((pair) => globalMatchedIds.has(pair.id)).length}
            totalSteps={sessionTotalSteps}
          />
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute z-[2] flex items-center justify-center px-4"
          style={figmaRectStyle(WORD_LISTEN_MATCH_PROMPT)}
        >
          <p className="font-sans text-center text-[16px] font-semibold leading-none tracking-[-0.01em] text-[#1E1E1E]">
            {WORD_LISTEN_MATCH_PROMPT_COPY}
          </p>
        </div>

        {WORD_MATCH_TILE_COVERS.map((cover) => (
          <div
            key={cover.id}
            aria-hidden
            className="pointer-events-none absolute rounded-2xl bg-[#FEFEFE]"
            style={figmaRectStyle(cover)}
          />
        ))}

        {activeTiles.map((tile) => {
          const state = getTileState(tile)
          const isAudio = tile.side === 'en'

          return (
            <button
              key={tile.id}
              type="button"
              aria-label={isAudio ? '영어 발음 듣기' : tile.label}
              disabled={completed}
              className={`absolute z-[2] flex items-center justify-center px-3 text-center ${tileFrameClass(state)} ${completed ? 'cursor-default' : 'cursor-pointer'}`}
              style={figmaRectStyle(tile)}
              onClick={() => handleTileClick(tile)}
            >
              {isAudio ? (
                <AudioTileGlyph color={audioIconColor(state)} />
              ) : (
                <span className={tileLabelClass(state)}>{tile.label}</span>
              )}
            </button>
          )
        })}
      </div>
      {completed && isFinalRetrySection && (
        <RetryWrongCompleteSheet onHome={onRetryFlowHome} />
      )}
    </FigmaAssetFrame>
  )
}

