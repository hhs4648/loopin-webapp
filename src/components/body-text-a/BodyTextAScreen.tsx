import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { shuffleArray } from '../../lib/shuffle'
import {
  EXERCISE_COACH_LINE_CLASS,
  EXERCISE_CTA_CLASS,
  EXERCISE_EMPTY_HINT_CLASS,
  EXERCISE_OPTION_EN_CLASS,
  EXERCISE_PASSAGE_EN_CLASS,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { ExerciseContinueButton } from '../exercise/ExerciseContinueButton'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  BODY_TEXT_A_ASSET,
  BODY_TEXT_A_PASSAGE,
  BODY_TEXT_A_PASSAGE_BAKE_MASK,
  BODY_TEXT_A_COACH_BUBBLE,
  BODY_TEXT_A_COACH_IMAGE,
  BODY_TEXT_A_HINT_GAP_MASK,
  BODY_TEXT_A_QUESTIONS,
  BODY_TEXT_A_SENTENCE_BOX,
  BODY_TEXT_A_SPEAKER_HIT,
  BODY_TEXT_A_SUBMIT_BTN,
  BODY_TEXT_A_TILES_MASK,
  BODY_TEXT_COACH_RETRY,
  BODY_TEXT_RETRY_WRONG_LIMIT,
  LOOPIN_COACH_BLUSH_ASSET,
  LOOPIN_COACH_SAD_ASSET,
  buildBodyTextATiles,
  countBodyTextWrongPositions,
  figmaRectStyle,
  formatBodyTextAAnswer,
  getBodyTextATile,
  matchesBodyTextAnswer,
  type BodyTextAQuestion,
  type BodyTextATile,
} from './body-text-a'
import { sessionBodyTextAId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import { speakEnglishText, preloadEnglishWordAudio, stopEnglishWordAudio } from '../word-quiz/word-quiz'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import {
  useAdvanceWhenNoQuestions,
  type RetryWrongExerciseProps,
} from '../exercise/retry-wrong-ui'

type BodyTextAScreenProps = {
  sessionOffset: number
  questions?: BodyTextAQuestion[]
  answerIdForQuestion?: (questionId: string) => string
  onAnswer?: (stepId: string, isCorrect: boolean) => void
  onComplete?: () => void
} & RetryWrongExerciseProps

type BodyResult = 'playing' | 'retry' | 'correct' | 'wrong'

function segmentTileClass() {
  return 'rounded-[12px] border-[1.5px] border-[#C9D9EE] bg-white px-3 py-2 shadow-[0_2px_6px_rgba(80,120,180,0.08)]'
}

function placedSegmentClass(isDragging: boolean, isMarkedWrong = false) {
  const border = isMarkedWrong ? 'border-[#FF8AC8]' : 'border-[#3C86FF]'
  return `rounded-lg border bg-white px-2 py-1 shadow-[0_1px_4px_rgba(60,134,255,0.1)] ${
    isDragging ? `cursor-grabbing ${border} opacity-60` : `cursor-grab ${border}`
  }`
}

export function BodyTextAScreen({
  sessionOffset,
  questions,
  answerIdForQuestion = sessionBodyTextAId,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  sessionTotalSteps,
  onRetryFlowHome,
}: BodyTextAScreenProps) {
  // questions === [] → 오답 없음(스킵). undefined → 전체 은행.
  const [activeQuestions] = useState(() =>
    shuffleArray([...(questions ?? BODY_TEXT_A_QUESTIONS)]),
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const question = activeQuestions[questionIndex]
  const isLastQuestion = questionIndex + 1 >= activeQuestions.length

  useAdvanceWhenNoQuestions(activeQuestions.length, () => {
    onComplete?.()
  })

  const [tiles, setTiles] = useState(() =>
    question ? buildBodyTextATiles(question) : [],
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [result, setResult] = useState<BodyResult>('playing')
  const [retryUsed, setRetryUsed] = useState(false)
  /** 재시도 진입 시 틀린 조각 id — 재배열해도 테두리 고정(정답 미리보기 방지) */
  const [frozenWrongIds, setFrozenWrongIds] = useState<Set<string>>(() => new Set())
  const didDragRef = useRef(false)

  const selectedTiles = useMemo(
    () =>
      selectedIds
        .map((id) => getBodyTextATile(tiles, id))
        .filter((tile): tile is BodyTextATile => tile !== undefined),
    [selectedIds, tiles],
  )

  const allFilled = selectedIds.length === tiles.length
  const isPlaying = result === 'playing' || result === 'retry'
  const showFeedback = result === 'correct' || result === 'wrong'
  const completedInSection = questionIndex + (showFeedback ? 1 : 0)

  const coachText = useMemo(() => {
    if (result === 'correct') return '정답이야! 완전 잘했는데?'
    if (result === 'retry') return BODY_TEXT_COACH_RETRY
    if (result === 'wrong') return ''

    const picked = selectedIds.length
    const total = tiles.length
    if (picked === 0) return '이 문장, 영어로 배열해봐!'
    if (picked === total) return '다 됐으면 제출 눌러봐!'

    const half = Math.floor(total / 2)
    if (picked === half) return '절반 왔어! 그 느낌 그대로!'
    return '좋아 좋아, 잘하고 있어!'
  }, [result, selectedIds.length, tiles.length])

  const coachImgSrc =
    result === 'wrong' || result === 'retry'
      ? LOOPIN_COACH_SAD_ASSET
      : LOOPIN_COACH_BLUSH_ASSET

  const [coachAnimNonce, setCoachAnimNonce] = useState(0)
  useEffect(() => {
    if (result === 'correct' || result === 'wrong' || result === 'retry') {
      setCoachAnimNonce((n) => n + 1)
    }
  }, [result])

  const coachAnimation =
    result === 'correct'
      ? 'coach-bounce 0.8s ease'
      : result === 'wrong' || result === 'retry'
        ? 'coach-shake 0.5s ease'
        : undefined

  useEffect(() => {
    void preloadEnglishWordAudio()
  }, [])

  useEffect(() => {
    if (!question) return
    const timer = window.setTimeout(() => {
      speakEnglishText(question.exampleEn, { audioKey: question.id })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [question?.id, question?.exampleEn])

  const resetQuestionState = (nextQuestion: BodyTextAQuestion) => {
    setTiles(buildBodyTextATiles(nextQuestion))
    setSelectedIds([])
    setDragIndex(null)
    didDragRef.current = false
    setRetryUsed(false)
    setFrozenWrongIds(new Set())
    setResult('playing')
  }

  const handleSegmentTileClick = (tile: BodyTextATile) => {
    if (!isPlaying || selectedIds.includes(tile.id)) return
    playTapSfx()
    setSelectedIds((prev) => [...prev, tile.id])
  }

  const handlePlacedSegmentClick = (index: number) => {
    if (!isPlaying || didDragRef.current) {
      didDragRef.current = false
      return
    }
    playTapSfx()
    setSelectedIds((prev) => prev.slice(0, index))
  }

  const reorderSelectedIds = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setSelectedIds((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const handleDragStart = (event: DragEvent, index: number) => {
    if (!isPlaying) return
    didDragRef.current = false
    setDragIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  const handleDrag = () => {
    didDragRef.current = true
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (targetIndex: number) => {
    if (!isPlaying || dragIndex === null) return
    reorderSelectedIds(dragIndex, targetIndex)
    setDragIndex(null)
  }

  const handleSubmit = () => {
    if (!isPlaying || !allFilled) return

    playTapSfx()

    if (matchesBodyTextAnswer(selectedTiles, question)) {
      onAnswer?.(answerIdForQuestion(question.id), true)
      playAnswerSfx(true)
      setResult('correct')
      return
    }

    const wrongCount = countBodyTextWrongPositions(selectedTiles)
    if (!retryUsed && wrongCount <= BODY_TEXT_RETRY_WRONG_LIMIT) {
      playAnswerSfx(false)
      setRetryUsed(true)
      setFrozenWrongIds(
        new Set(
          selectedTiles
            .filter((tile, index) => tile.segmentIndex !== index)
            .map((tile) => tile.id),
        ),
      )
      setResult('retry')
      return
    }

    onAnswer?.(answerIdForQuestion(question.id), false)
    playAnswerSfx(false)
    setResult('wrong')
  }

  const handleFeedbackContinue = () => {
    stopEnglishWordAudio()
    playTapSfx()
    if (isLastQuestion) {
      if (!isFinalRetrySection) {
        onComplete?.()
      }
      return
    }

    const nextIndex = questionIndex + 1
    setQuestionIndex(nextIndex)
    resetQuestionState(activeQuestions[nextIndex])
  }

  const showRetryComplete = showFeedback && isLastQuestion && isFinalRetrySection

  if (!question) {
    return null
  }

  return (
    <FigmaAssetFrame src={BODY_TEXT_A_ASSET} alt="본문 A" bgClassName="bg-white">
      <div className={`absolute inset-0 z-10 ${showFeedback ? 'pointer-events-none' : ''}`}>
        {hideProgressBar ? (
          <BakedProgressBarMask />
        ) : (
          <ExerciseProgressBar
            sessionOffset={sessionOffset}
            completedInSection={completedInSection}
            totalSteps={sessionTotalSteps}
          />
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute bg-white"
          style={figmaRectStyle(BODY_TEXT_A_PASSAGE_BAKE_MASK)}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute z-[2] bg-white"
          style={figmaRectStyle(BODY_TEXT_A_HINT_GAP_MASK)}
        />
        {/* 앱 전체 폭 기준 가운데 — 스피커는 위쪽 별도 행 */}
        <div
          className="pointer-events-none absolute z-[3] flex items-center justify-center px-2 py-1"
          style={figmaRectStyle(BODY_TEXT_A_PASSAGE)}
        >
          <p
            className={`w-full whitespace-normal ${EXERCISE_PASSAGE_EN_CLASS}`}
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 4,
              overflow: 'hidden',
              overflowWrap: 'anywhere',
            }}
          >
            {question.exampleEn}
          </p>
        </div>

        <button
          type="button"
          aria-label="예문 듣기"
          className="absolute z-[5] flex cursor-pointer items-center justify-center rounded-full border-0 bg-[#E3F2FD] p-0 shadow-none"
          style={figmaRectStyle(BODY_TEXT_A_SPEAKER_HIT)}
          onClick={() => {
            playTapSfx()
            speakEnglishText(question.exampleEn, {
              force: true,
              audioKey: question.id,
            })
          }}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-[58%] w-[58%]"
          >
            <path
              fill="#1E88E5"
              d="M4.5 9.2h3.1L12 5.5v13l-4.4-3.7H4.5c-.7 0-1.3-.6-1.3-1.3V10.5c0-.7.6-1.3 1.3-1.3z"
            />
            <path
              d="M14.2 9.1c1.1.9 1.8 2.2 1.8 3.7s-.7 2.8-1.8 3.7"
              fill="none"
              stroke="#1E88E5"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M16.6 7c1.8 1.4 2.9 3.5 2.9 5.8s-1.1 4.4-2.9 5.8"
              fill="none"
              stroke="#1E88E5"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div
          aria-hidden
          className="pointer-events-none absolute bg-[#F6F9FD]"
          style={figmaRectStyle(BODY_TEXT_A_SENTENCE_BOX)}
        />
        <div
          className="absolute flex items-center justify-center overflow-y-auto px-4 py-3"
          style={figmaRectStyle(BODY_TEXT_A_SENTENCE_BOX)}
        >
          {selectedTiles.length > 0 ? (
            <div
              className="flex flex-wrap items-center justify-center gap-1.5"
              onDragOver={handleDragOver}
            >
              {selectedTiles.map((tile, index) => (
                <button
                  key={`placed-${tile.id}-${index}`}
                  type="button"
                  draggable={isPlaying}
                  aria-label={`${index + 1}번째 조각 ${tile.label}`}
                  className={`whitespace-nowrap ${placedSegmentClass(
                    dragIndex === index,
                    result === 'retry' && frozenWrongIds.has(tile.id),
                  )}`}
                  onClick={() => handlePlacedSegmentClick(index)}
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                >
                  <span className={EXERCISE_OPTION_EN_CLASS}>{tile.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className={`text-center ${EXERCISE_EMPTY_HINT_CLASS}`}>
              예문 뜻 조각을 순서대로 눌러 문장을 완성하세요
            </p>
          )}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bg-white"
          style={figmaRectStyle(BODY_TEXT_A_TILES_MASK)}
        />
        <div
          className="absolute overflow-y-auto px-3 py-2"
          style={figmaRectStyle(BODY_TEXT_A_TILES_MASK)}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            {tiles.map((tile) => {
              const isSelected = selectedIds.includes(tile.id)

              return (
                <button
                  key={tile.id}
                  type="button"
                  aria-label={`예문 뜻 ${tile.label}`}
                  aria-hidden={isSelected}
                  tabIndex={isSelected ? -1 : 0}
                  disabled={isSelected}
                  className={`whitespace-nowrap ${segmentTileClass()} ${
                    isSelected
                      ? 'invisible pointer-events-none'
                      : 'cursor-pointer'
                  }`}
                  onClick={() => handleSegmentTileClick(tile)}
                >
                  <span className={EXERCISE_OPTION_EN_CLASS}>
                    {tile.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 루핀 미니 코치(말풍선+캐릭터) — 오답은 계속하기 버튼 위로 말풍선 확장 */}
        <div
          aria-hidden
          className={`pointer-events-none absolute z-[11] flex items-center overflow-hidden rounded-[14px] rounded-br-[4px] bg-[#F2F7FF] px-3 py-2 ${EXERCISE_COACH_LINE_CLASS}`}
          style={
            result === 'wrong'
              ? figmaRectStyle({ x: 18, y: 600, w: 275, h: 136 })
              : result === 'retry'
                ? figmaRectStyle({ x: 18, y: 640, w: 275, h: 100 })
                : figmaRectStyle(BODY_TEXT_A_COACH_BUBBLE)
          }
        >
          {result === 'wrong' ? (
            <div className={`w-full ${EXERCISE_COACH_LINE_CLASS}`}>
              <p>정답은</p>
              <p className="mt-0.5 text-[#22C55E]">
                {formatBodyTextAAnswer(question)}
              </p>
              <p className="mt-1.5">다음에 잘할수있어!</p>
            </div>
          ) : (
            <p className={`w-full ${EXERCISE_COACH_LINE_CLASS}`}>{coachText}</p>
          )}
        </div>

        <div
          aria-hidden
          key={coachAnimNonce}
          className="pointer-events-none absolute z-[11]"
          style={{
            ...figmaRectStyle(BODY_TEXT_A_COACH_IMAGE),
            animation: coachAnimation,
            animationIterationCount: coachAnimation ? 1 : undefined,
          }}
        >
          <img
            src={coachImgSrc}
            alt=""
            draggable={false}
            className="h-full w-full object-contain select-none"
          />
        </div>

        {!showFeedback ? (
          <button
            type="button"
            aria-label="제출하기"
            disabled={!allFilled}
            className={`absolute flex items-center justify-center rounded-2xl ${EXERCISE_CTA_CLASS} text-white ${
              allFilled
                ? 'cursor-pointer border border-white bg-[#3C86FF]'
                : 'cursor-default bg-transparent'
            }`}
            style={figmaRectStyle(BODY_TEXT_A_SUBMIT_BTN)}
            onClick={handleSubmit}
          >
            {allFilled && '제출하기'}
          </button>
        ) : null}
      </div>

      {showRetryComplete && <RetryWrongCompleteSheet onHome={onRetryFlowHome} />}
      {showFeedback && !showRetryComplete ? (
        <ExerciseContinueButton
          kind={result === 'correct' ? 'correct' : 'wrong'}
          rect={BODY_TEXT_A_SUBMIT_BTN}
          onContinue={handleFeedbackContinue}
        />
      ) : null}
    </FigmaAssetFrame>
  )
}
