import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  COLOR_CORRECT_BG,
  COLOR_WRONG_BG,
  EXERCISE_CTA_CLASS,
  EXERCISE_EMPTY_HINT_CLASS,
  EXERCISE_FEEDBACK_HINT_CLASS,
  EXERCISE_OPTION_EN_CLASS,
  EXERCISE_PASSAGE_EN_CLASS,
  exerciseFeedbackTitleClass,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  BODY_TEXT_A_ASSET,
  BODY_TEXT_A_FEEDBACK_SHEET,
  BODY_TEXT_A_PASSAGE,
  BODY_TEXT_A_QUESTIONS,
  BODY_TEXT_A_SENTENCE_BOX,
  BODY_TEXT_A_SPEAKER_HIT,
  BODY_TEXT_A_SUBMIT_BTN,
  BODY_TEXT_A_TILES_MASK,
  buildBodyTextATiles,
  figmaRectStyle,
  getBodyTextATile,
  matchesBodyTextAnswer,
  type BodyTextAQuestion,
  type BodyTextATile,
} from './body-text-a'
import { sessionBodyTextAId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import { speakEnglishText, preloadEnglishWordAudio } from '../word-quiz/word-quiz'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import { useEnterToContinue } from '../exercise/use-enter-to-continue'
import type { RetryWrongExerciseProps } from '../exercise/retry-wrong-ui'

type BodyTextAScreenProps = {
  sessionOffset: number
  questions?: BodyTextAQuestion[]
  onAnswer?: (stepId: string, isCorrect: boolean) => void
  onComplete?: () => void
} & RetryWrongExerciseProps

type BodyResult = 'playing' | 'correct' | 'wrong'

function segmentTileClass() {
  return 'rounded-[12px] border-[1.5px] border-[#C9D9EE] bg-white px-3 py-2 shadow-[0_2px_6px_rgba(80,120,180,0.08)]'
}

function placedSegmentClass(isDragging: boolean) {
  return `rounded-lg border bg-white px-2 py-1 shadow-[0_1px_4px_rgba(60,134,255,0.1)] ${
    isDragging
      ? 'cursor-grabbing border-[#3C86FF] opacity-60'
      : 'cursor-grab border-[#3C86FF]'
  }`
}

function BodyTextAFeedbackSheet({
  kind,
  exampleKo,
  onContinue,
}: {
  kind: 'correct' | 'wrong'
  exampleKo?: string
  onContinue?: () => void
}) {
  const isCorrect = kind === 'correct'
  useEnterToContinue(onContinue)

  return (
    <div className="absolute z-20" style={figmaRectStyle(BODY_TEXT_A_FEEDBACK_SHEET)}>
      <div className="flex h-full flex-col rounded-t-[24px] border-t border-[#E4E7EA] bg-white px-[30px] pb-[41px] pt-[30px] shadow-[0_-10px_24px_rgba(0,0,0,0.06)]">
        <p className={exerciseFeedbackTitleClass(isCorrect)}>
          {isCorrect ? '정답입니다.' : '오답입니다.'}
        </p>
        {exampleKo && (
          <p className={EXERCISE_FEEDBACK_HINT_CLASS}>
            예문 뜻은 {exampleKo}
          </p>
        )}
        {onContinue && (
          <button
            type="button"
            aria-label="계속하기"
            className={`mt-auto flex h-[60px] w-full cursor-pointer items-center justify-center rounded-2xl border border-white ${EXERCISE_CTA_CLASS} ${
              isCorrect ? COLOR_CORRECT_BG : COLOR_WRONG_BG
            }`}
            onClick={onContinue}
          >
            계속하기
          </button>
        )}
      </div>
    </div>
  )
}

export function BodyTextAScreen({
  sessionOffset,
  questions,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  onRetryFlowHome,
}: BodyTextAScreenProps) {
  const activeQuestions = questions ?? BODY_TEXT_A_QUESTIONS
  const [questionIndex, setQuestionIndex] = useState(0)
  const question = activeQuestions[questionIndex]
  const isLastQuestion = questionIndex + 1 >= activeQuestions.length

  const [tiles, setTiles] = useState(() => buildBodyTextATiles(question))
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [result, setResult] = useState<BodyResult>('playing')
  const didDragRef = useRef(false)

  const selectedTiles = useMemo(
    () =>
      selectedIds
        .map((id) => getBodyTextATile(tiles, id))
        .filter((tile): tile is BodyTextATile => tile !== undefined),
    [selectedIds, tiles],
  )

  const allFilled = selectedIds.length === tiles.length
  const isPlaying = result === 'playing'
  const showFeedback = result === 'correct' || result === 'wrong'
  const completedInSection = questionIndex + (showFeedback ? 1 : 0)

  useEffect(() => {
    void preloadEnglishWordAudio()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      speakEnglishText(question.exampleEn, { audioKey: question.id })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [question.id, question.exampleEn])

  const resetQuestionState = (nextQuestion: BodyTextAQuestion) => {
    setTiles(buildBodyTextATiles(nextQuestion))
    setSelectedIds([])
    setDragIndex(null)
    didDragRef.current = false
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
      onAnswer?.(sessionBodyTextAId(question.id), true)
      playAnswerSfx(true)
      setResult('correct')
      return
    }

    onAnswer?.(sessionBodyTextAId(question.id), false)
    playAnswerSfx(false)
    setResult('wrong')
  }

  const handleFeedbackContinue = () => {
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

  return (
    <FigmaAssetFrame src={BODY_TEXT_A_ASSET} alt="본문 A" bgClassName="bg-white">
      <div className={`absolute inset-0 z-10 ${showFeedback ? 'pointer-events-none' : ''}`}>
        {hideProgressBar ? (
          <BakedProgressBarMask />
        ) : (
          <ExerciseProgressBar
            sessionOffset={sessionOffset}
            completedInSection={completedInSection}
          />
        )}

        <button
          type="button"
          aria-label="예문 듣기"
          className="absolute cursor-pointer rounded-full bg-transparent"
          style={figmaRectStyle(BODY_TEXT_A_SPEAKER_HIT)}
          onClick={() => {
            playTapSfx()
            speakEnglishText(question.exampleEn, {
              force: true,
              audioKey: question.id,
            })
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute bg-white"
          style={figmaRectStyle(BODY_TEXT_A_PASSAGE)}
        />
        <div
          className="pointer-events-none absolute flex items-center px-5"
          style={figmaRectStyle(BODY_TEXT_A_PASSAGE)}
        >
          <p className={`line-clamp-2 ${EXERCISE_PASSAGE_EN_CLASS}`}>
            {question.exampleEn}
          </p>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bg-[#F6F9FD]"
          style={figmaRectStyle(BODY_TEXT_A_SENTENCE_BOX)}
        />
        <div
          className="absolute overflow-y-auto px-4 py-3"
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
                  className={`whitespace-nowrap ${placedSegmentClass(dragIndex === index)}`}
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
      </div>

      {showRetryComplete && <RetryWrongCompleteSheet onHome={onRetryFlowHome} />}
      {showFeedback && !showRetryComplete && (
        <BodyTextAFeedbackSheet
          kind={result === 'correct' ? 'correct' : 'wrong'}
          exampleKo={question.exampleKo}
          onContinue={handleFeedbackContinue}
        />
      )}
    </FigmaAssetFrame>
  )
}
