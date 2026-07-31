import { useEffect, useMemo, useRef, useState } from 'react'
import {
  EXERCISE_MATCH_TILE_EN_CLASS,
  EXERCISE_MATCH_TILE_KO_CLASS,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  buildTilesFromPairs,
  FEEDBACK_MS,
  figmaRectStyle,
  isMatchingPair,
  pickNextPage,
  WORD_MATCH_ASSETS,
  WORD_MATCH_TILE_COVERS,
  type WordMatchPair,
  type WordPairId,
  type WordTile,
} from './word-match'
import { sessionWordMatchId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import { preloadEnglishWordAudio, speakEnglishWord } from '../word-quiz/word-quiz'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import type { RetryWrongExerciseProps } from '../exercise/retry-wrong-ui'

type WordMatchScreenProps = {
  sessionOffset: number
  /** 이번 섹션/라운드에서 맞춰야 할 짝. 없으면 빈 화면(데모 단어 폴백 없음). */
  pairs?: WordMatchPair[]
  /** 4짝 미만일 때 채울 출제 단어 풀. 기본값은 pairs. */
  fillPool?: WordMatchPair[]
  retryPairIds?: WordPairId[]
  /** Defaults to sessionWordMatchId for demo retry tracking. */
  answerIdForPair?: (pairId: string) => string
  onAnswer?: (stepId: string, isCorrect: boolean) => void
  onComplete?: () => void
} & RetryWrongExerciseProps

type TileVisualState = 'idle' | 'selected' | 'correct' | 'wrong' | 'disabled'

function tileFrameClass(state: TileVisualState) {
  const base = 'box-border border-[3px]'

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

function tileLabelClass(state: TileVisualState, side: WordTile['side']) {
  const baseClass = side === 'en' ? EXERCISE_MATCH_TILE_EN_CLASS : EXERCISE_MATCH_TILE_KO_CLASS

  switch (state) {
    case 'selected':
      return `${baseClass} text-[#4177FF]`
    case 'correct':
      return `${baseClass} text-[#22C55E]`
    case 'wrong':
      return `${baseClass} text-[#EF4444]`
    case 'disabled':
      return `${baseClass} text-[#9E9FA7]`
    default:
      return `${baseClass} text-[#1E1E1E]`
  }
}

export function WordMatchScreen({
  sessionOffset,
  pairs,
  fillPool,
  retryPairIds,
  answerIdForPair = sessionWordMatchId,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  sessionTotalSteps,
  onRetryFlowHome,
}: WordMatchScreenProps) {
  const allPairs = useMemo(() => {
    const base = pairs ?? []
    if (!retryPairIds) return base
    return base.filter((pair) => retryPairIds.includes(pair.id))
  }, [pairs, retryPairIds])

  const pool = useMemo(() => fillPool ?? allPairs, [fillPool, allPairs])

  const totalPairCount = allPairs.length
  const pageKeyRef = useRef(0)

  // --- multi-round state ---
  const [globalMatchedIds, setGlobalMatchedIds] = useState<Set<string>>(() => new Set())
  const wrongPairIdsRef = useRef<Set<string>>(new Set())
  const [pagePairs, setPagePairs] = useState<WordMatchPair[]>(() =>
    pickNextPage(allPairs, new Set(), new Set(), pool, pageKeyRef.current),
  )
  const activeTiles = useMemo(() => buildTilesFromPairs(pagePairs), [pagePairs])

  // --- per-page state ---
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
  }, [])

  /** 짝이 없으면(데모 word-match 0문항) 다음 섹션으로 바로 넘김 */
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  useEffect(() => {
    if (totalPairCount > 0) return
    onCompleteRef.current?.()
  }, [totalPairCount])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

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

  const handleTileClick = (tile: WordTile) => {
    if (completed || locked || pageMatchedIds.has(tile.pairId)) return

    playTapSfx()

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
      const englishWord = [first, tile].find((entry) => entry.side === 'en')?.label
      if (englishWord) {
        speakEnglishWord(englishWord, { force: true })
      }
      playAnswerSfx(true)
      setFeedback({ kind: 'correct', tileIds: [first.id, tile.id] })
      setSelectedIds([])

      feedbackTimerRef.current = window.setTimeout(() => {
        const pairId = tile.pairId
        const isCorrect = !pairHadWrongRef.current.has(pairId)
        onAnswer?.(answerIdForPair(pairId), isCorrect)

        const nextPageMatched = new Set(pageMatchedIds).add(pairId)
        setPageMatchedIds(nextPageMatched)

        const nextGlobalMatched = new Set(globalMatchedIds).add(pairId)
        setGlobalMatchedIds(nextGlobalMatched)

        setFeedback(null)
        setLocked(false)

        if (nextGlobalMatched.size >= totalPairCount) {
          // 마지막 짝까지 다 맞추면 "계속하기" 버튼 없이 스무스하게 다음 화면으로 넘어간다.
          // (최종 오답 재도전 섹션은 예외 — 완료 시트에서 홈으로 이동하는 버튼이 필요함)
          if (isFinalRetrySection) {
            setCompleted(true)
          } else {
            onComplete?.()
          }
          return
        }

        if (nextPageMatched.size >= pagePairs.length) {
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
    <FigmaAssetFrame src={WORD_MATCH_ASSETS.base} alt="단어 매칭" bgClassName="bg-white">
      <div className="absolute inset-0 z-10">
        {hideProgressBar ? (
          <BakedProgressBarMask />
        ) : (
          <ExerciseProgressBar
            sessionOffset={sessionOffset}
            completedInSection={globalMatchedIds.size}
            totalSteps={sessionTotalSteps}
          />
        )}

        {/* Figma에 구워진 데모 단어(wave/latest 등)가 비치지 않게 8칸을 항상 덮음 */}
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

          return (
            <button
              key={tile.id}
              type="button"
              aria-label={tile.label}
              disabled={completed}
              className={`absolute flex items-center justify-center px-3 text-center ${tileFrameClass(state)} ${completed ? 'cursor-default' : 'cursor-pointer'}`}
              style={figmaRectStyle(tile)}
              onClick={() => handleTileClick(tile)}
            >
              <span className={tileLabelClass(state, tile.side)}>{tile.label}</span>
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
