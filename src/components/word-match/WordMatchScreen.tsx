import { useEffect, useRef, useState } from 'react'
import {
  COLOR_CORRECT_BG,
  EXERCISE_CTA_CLASS,
  EXERCISE_MATCH_TILE_EN_CLASS,
  EXERCISE_MATCH_TILE_KO_CLASS,
  exerciseFeedbackTitleClass,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  FEEDBACK_MS,
  figmaRectStyle,
  isMatchingPair,
  WORD_MATCH_ASSETS,
  WORD_MATCH_COMPLETE_SHEET,
  WORD_TILES,
  type WordPairId,
  type WordTile,
} from './word-match'
import { sessionWordMatchId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import { useEnterToContinue } from '../exercise/use-enter-to-continue'
import type { RetryWrongExerciseProps } from '../exercise/retry-wrong-ui'

type WordMatchScreenProps = {
  sessionOffset: number
  retryPairIds?: WordPairId[]
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

function WordMatchCompleteSheet({ onContinue }: { onContinue?: () => void }) {
  const handleContinue = () => {
    playTapSfx()
    onContinue?.()
  }

  useEnterToContinue(onContinue ? handleContinue : undefined)

  return (
    <div className="absolute z-20" style={figmaRectStyle(WORD_MATCH_COMPLETE_SHEET)}>
      <div className="flex h-full flex-col rounded-t-[24px] border-t border-[#E4E7EA] bg-white px-[30px] pb-[41px] pt-[30px] shadow-[0_-10px_24px_rgba(0,0,0,0.06)]">
        <p className={exerciseFeedbackTitleClass(true)}>맞았어요!</p>
        {onContinue && (
          <button
            type="button"
            aria-label="계속하기"
            className={`mt-auto flex h-[60px] w-full cursor-pointer items-center justify-center rounded-2xl border border-white ${COLOR_CORRECT_BG} ${EXERCISE_CTA_CLASS} text-white`}
            onClick={handleContinue}
          >
            계속하기
          </button>
        )}
      </div>
    </div>
  )
}

export function WordMatchScreen({
  sessionOffset,
  retryPairIds,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  onRetryFlowHome,
}: WordMatchScreenProps) {
  const activeTiles = retryPairIds
    ? WORD_TILES.filter((tile) => retryPairIds.includes(tile.pairId))
    : WORD_TILES
  const requiredPairCount =
    retryPairIds !== undefined ? retryPairIds.length : WORD_TILES.length / 2

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(() => new Set())
  const pairHadWrongRef = useRef<Set<string>>(new Set())
  const [completed, setCompleted] = useState(false)
  const [feedback, setFeedback] = useState<{
    kind: 'correct' | 'wrong'
    tileIds: string[]
  } | null>(null)
  const [locked, setLocked] = useState(false)
  const feedbackTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  const getTileState = (tile: WordTile): TileVisualState => {
    if (matchedPairIds.has(tile.pairId)) return 'disabled'
    if (feedback?.tileIds.includes(tile.id)) return feedback.kind
    if (selectedIds.includes(tile.id)) return 'selected'
    return 'idle'
  }

  const handleTileClick = (tile: WordTile) => {
    if (completed || locked || matchedPairIds.has(tile.pairId)) return

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

    if (isMatchingPair(first, tile)) {
      setLocked(true)
      playAnswerSfx(true)
      setFeedback({ kind: 'correct', tileIds: [first.id, tile.id] })
      setSelectedIds([])

      feedbackTimerRef.current = window.setTimeout(() => {
        const pairId = tile.pairId
        const isCorrect = !pairHadWrongRef.current.has(pairId)
        onAnswer?.(sessionWordMatchId(pairId), isCorrect)

        setMatchedPairIds((prev) => {
          const nextMatched = new Set(prev).add(pairId)
          if (nextMatched.size >= requiredPairCount) {
            setCompleted(true)
          }
          return nextMatched
        })
        setFeedback(null)
        setLocked(false)
      }, FEEDBACK_MS)
      return
    }

    setLocked(true)
    playAnswerSfx(false)
    setFeedback({ kind: 'wrong', tileIds: [first.id, tile.id] })
    pairHadWrongRef.current = new Set(pairHadWrongRef.current).add(first.pairId)
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
            completedInSection={matchedPairIds.size}
          />
        )}

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
      {completed && !isFinalRetrySection && (
        <WordMatchCompleteSheet onContinue={onComplete} />
      )}
    </FigmaAssetFrame>
  )
}
