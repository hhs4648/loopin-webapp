import { useEffect, useMemo, useRef, useState } from 'react'
import {
  EXERCISE_MATCH_TILE_EN_CLASS,
  EXERCISE_MATCH_TILE_KO_CLASS,
} from '../exercise/exercise-typography'
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
  WORD_MATCH_ASSETS,
  MATCH_TILE_SHADOW,
  WORD_MATCH_TILE_COVERS,
  type WordMatchPair,
  type WordPairId,
  type WordTile,
} from './word-match'
import { sessionWordMatchId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import {
  preloadEnglishWordAudio,
  preloadEnglishWords,
  speakEnglishWord,
} from '../word-quiz/word-quiz'
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
    const scoped = retryPairIds
      ? base.filter((pair) => retryPairIds.includes(pair.id))
      : base
    // 필수 짝만 — 예전 섹션 빌더가 pairs에 넣었던 채움(:fill:)은 제외
    return scoped.filter((pair) => !isFillPairId(pair.id))
  }, [pairs, retryPairIds])

  const pool = useMemo(() => {
    const base = fillPool ?? pairs ?? []
    return base.filter((pair) => !isFillPairId(pair.id))
  }, [fillPool, pairs])

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

  /** 실제 출제 영어 — 클릭 전에 클라우드 TTS 받아 두어 즉시 재생 */
  useEffect(() => {
    const english = [
      ...allPairs.map((pair) => pair.english),
      ...pool.map((pair) => pair.english),
      ...pagePairs.map((pair) => pair.english),
    ]
    void preloadEnglishWords(english)
  }, [allPairs, pool, pagePairs])

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

    // 영어 타일: TTS를 탭음보다 먼저 — 클릭 즉시 발음
    if (tile.side === 'en') {
      speakEnglishWord(tile.label, { force: true })
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
        // 채움 짝은 화면용 — 채점·진행도에는 넣지 않음
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

        // 필수 짝을 다 맞춰도, 화면에 남은 채움 짝까지 맞춰야 다음으로 넘어감
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
    <FigmaAssetFrame backButtonMask={BACK_MASK_WHITE_HEADER} src={WORD_MATCH_ASSETS.base} alt="단어 매칭" bgClassName="bg-white">
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
              className={`absolute z-[2] flex items-center justify-center px-3 text-center ${tileFrameClass(state)} ${completed ? 'cursor-default' : 'cursor-pointer'}`}
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

