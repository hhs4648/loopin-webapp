import { useState } from 'react'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import {
  COLOR_CORRECT_BG,
  COLOR_WRONG_BG,
  EXERCISE_CTA_CLASS,
  exerciseFeedbackTitleClass,
  exerciseOptionEnStateClass,
} from '../exercise/exercise-typography'
import {
  GRAMMAR_PASSAGE_BLANK_CLASS,
  GRAMMAR_PASSAGE_TEXT_CLASS,
} from '../grammar/grammar-typography'
import {
  figmaRectStyle,
  GRAMMAR_TYPE_1_ASSET,
  GRAMMAR_TYPE_1_FEEDBACK_SHEET,
  GRAMMAR_TYPE_1_OPTION_BOXES,
  GRAMMAR_TYPE_1_PASSAGE,
  GRAMMAR_TYPE_1_PASSAGE_ENGLISH,
  GRAMMAR_TYPE_1_QUESTIONS,
  type GrammarType1Question,
} from './grammar-type-1'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import { useEnterToContinue } from '../exercise/use-enter-to-continue'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import type { RetryWrongExerciseProps } from '../exercise/retry-wrong-ui'

type GrammarType1ScreenProps = {
  sessionOffset: number
  questions?: GrammarType1Question[]
  onAnswer?: (questionId: string, isCorrect: boolean) => void
  onComplete?: () => void
} & RetryWrongExerciseProps

type OptionVisualState = 'idle' | 'correct' | 'wrong'

function optionFrameClass(state: OptionVisualState) {
  const base = 'box-border rounded-[9px] border-2'

  switch (state) {
    case 'correct':
      return `${base} border-[#22C55E] bg-[#F0FDF4] shadow-[0_0_14px_rgba(34,197,94,0.75)]`
    case 'wrong':
      return `${base} border-[#EF4444] bg-[#FEF2F2]`
    default:
      return `${base} border-black bg-white`
  }
}

function optionLabelClass(state: OptionVisualState) {
  return exerciseOptionEnStateClass(state)
}

function GrammarType1FeedbackSheet({
  kind,
  onContinue,
}: {
  kind: 'correct' | 'wrong'
  onContinue?: () => void
}) {
  const isCorrect = kind === 'correct'
  useEnterToContinue(onContinue)

  return (
    <div className="absolute z-20" style={figmaRectStyle(GRAMMAR_TYPE_1_FEEDBACK_SHEET)}>
      <div className="flex h-full flex-col rounded-t-[24px] border-t border-[#E4E7EA] bg-white px-[30px] pb-[41px] pt-[30px] shadow-[0_-10px_24px_rgba(0,0,0,0.06)]">
        <p className={exerciseFeedbackTitleClass(isCorrect)}>
          {isCorrect ? '정답입니다.' : '오답입니다.'}
        </p>
        {onContinue && (
          <button
            type="button"
            aria-label="계속하기"
            className={`mt-auto flex h-[60px] w-full cursor-pointer items-center justify-center rounded-2xl border border-white ${EXERCISE_CTA_CLASS} text-white ${
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

function GrammarPassage({
  question,
  selectedLabel,
}: {
  question: GrammarType1Question
  selectedLabel: string | null
}) {
  if (!question.maskPassage) return null

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-[19px] border-2 border-[#D9D9D9] bg-white"
        style={figmaRectStyle(GRAMMAR_TYPE_1_PASSAGE)}
      />
      <div
        className="pointer-events-none absolute flex flex-col items-center gap-y-1"
        style={figmaRectStyle(GRAMMAR_TYPE_1_PASSAGE_ENGLISH)}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-1.5">
          <span className={GRAMMAR_PASSAGE_TEXT_CLASS}>{question.passageBefore}</span>
          <span className={GRAMMAR_PASSAGE_BLANK_CLASS}>{selectedLabel ?? ''}</span>
        </div>
        <p className={`${GRAMMAR_PASSAGE_TEXT_CLASS} text-center`}>{question.passageAfter}</p>
      </div>
    </>
  )
}

export function GrammarType1Screen({
  sessionOffset,
  questions,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  onRetryFlowHome,
}: GrammarType1ScreenProps) {
  const activeQuestions = questions ?? GRAMMAR_TYPE_1_QUESTIONS
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)

  const question = activeQuestions[questionIndex]
  const isLastQuestion = questionIndex + 1 >= activeQuestions.length
  const locked = result !== null
  const showFeedback = result !== null
  const completedInSection = questionIndex + (showFeedback ? 1 : 0)

  const selectedOption = question.options.find((option) => option.id === selectedOptionId)

  const getOptionState = (optionId: string): OptionVisualState => {
    if (!selectedOptionId || selectedOptionId !== optionId) return 'idle'
    return result === 'correct' ? 'correct' : 'wrong'
  }

  const handleOptionClick = (optionId: string) => {
    if (locked) return

    playTapSfx()
    setSelectedOptionId(optionId)

    if (optionId === question.correctOptionId) {
      onAnswer?.(question.id, true)
      playAnswerSfx(true)
      setResult('correct')
      return
    }

    onAnswer?.(question.id, false)
    playAnswerSfx(false)
    setResult('wrong')
  }

  const resetQuestionState = () => {
    setSelectedOptionId(null)
    setResult(null)
  }

  const handleFeedbackContinue = () => {
    playTapSfx()
    if (isLastQuestion) {
      if (!isFinalRetrySection) {
        onComplete?.()
      }
      return
    }

    setQuestionIndex((prev) => prev + 1)
    resetQuestionState()
  }

  const showRetryComplete = showFeedback && isLastQuestion && isFinalRetrySection

  return (
    <FigmaAssetFrame src={GRAMMAR_TYPE_1_ASSET} alt="문법 유형 1" bgClassName="bg-white">
      <div className={`absolute inset-0 z-10 ${showFeedback ? 'pointer-events-none' : ''}`}>
        {hideProgressBar ? (
          <BakedProgressBarMask />
        ) : (
          <ExerciseProgressBar
            sessionOffset={sessionOffset}
            completedInSection={completedInSection}
          />
        )}

        <GrammarPassage
          question={question}
          selectedLabel={locked ? (selectedOption?.label ?? null) : null}
        />

        {question.options.map((option, index) => {
          const state = getOptionState(option.id)
          const box = GRAMMAR_TYPE_1_OPTION_BOXES[index]

          return (
            <button
              key={option.id}
              type="button"
              aria-label={option.label}
              disabled={locked}
              className={`absolute flex cursor-pointer items-center justify-center ${optionFrameClass(state)} ${
                locked && state === 'idle' ? 'cursor-default' : ''
              }`}
              style={figmaRectStyle(box)}
              onClick={() => handleOptionClick(option.id)}
            >
              <span className={optionLabelClass(state)}>{option.label}</span>
            </button>
          )
        })}
      </div>

      {showRetryComplete && <RetryWrongCompleteSheet onHome={onRetryFlowHome} />}
      {showFeedback && result && !showRetryComplete && (
        <GrammarType1FeedbackSheet
          kind={result}
          onContinue={handleFeedbackContinue}
        />
      )}
    </FigmaAssetFrame>
  )
}
