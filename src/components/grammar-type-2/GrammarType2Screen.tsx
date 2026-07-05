import { useState } from 'react'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import {
  COLOR_CORRECT_BG,
  COLOR_WRONG_BG,
  EXERCISE_CTA_CLASS,
  exerciseFeedbackTitleClass,
  exerciseOptionEnStateClass,
  exerciseOxLabelClass,
} from '../exercise/exercise-typography'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { GRAMMAR_PASSAGE_TEXT_CLASS } from '../grammar/grammar-typography'
import {
  figmaRectStyle,
  GRAMMAR_TYPE_2_ASSET,
  GRAMMAR_TYPE_2_FEEDBACK_SHEET,
  GRAMMAR_TYPE_2_OPTION_BOXES,
  GRAMMAR_TYPE_2_OPTIONS,
  GRAMMAR_TYPE_2_PASSAGE,
  GRAMMAR_TYPE_2_QUESTIONS,
  type GrammarType2OptionId,
  type GrammarType2OxQuestion,
  type GrammarType2Question,
  type GrammarType2WordChoiceQuestion,
} from './grammar-type-2'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import { useEnterToContinue } from '../exercise/use-enter-to-continue'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import type { RetryWrongExerciseProps } from '../exercise/retry-wrong-ui'

type GrammarType2ScreenProps = {
  sessionOffset: number
  questions?: GrammarType2Question[]
  onAnswer?: (questionId: string, isCorrect: boolean) => void
  onComplete?: () => void
} & RetryWrongExerciseProps

type OptionVisualState = 'idle' | 'correct' | 'wrong'

function oxOptionFrameClass(state: OptionVisualState) {
  const base = 'box-border rounded-[9px] border-2'

  switch (state) {
    case 'correct':
      return `${base} border-[#22C55E] bg-[#F0FDF4] shadow-[0_0_14px_rgba(34,197,94,0.75)]`
    case 'wrong':
      return `${base} border-[#EF4444] bg-[#FEF2F2]`
    default:
      return `${base} border-[#D9DEDE] bg-[#F9FBFB]`
  }
}

function wordOptionFrameClass(state: OptionVisualState) {
  const base = 'box-border rounded-[16px] border-2'

  switch (state) {
    case 'correct':
      return `${base} border-[#22C55E] bg-[#F0FDF4] shadow-[0_0_14px_rgba(34,197,94,0.75)]`
    case 'wrong':
      return `${base} border-[#EF4444] bg-[#FEF2F2]`
    default:
      return `${base} border-[#E4E7EA] bg-[#FEFEFE] shadow-[0_0_6px_rgba(187,195,203,0.8)]`
  }
}


function oxOptionLabelClass(state: OptionVisualState, optionId: GrammarType2OptionId) {
  return exerciseOxLabelClass(state, optionId)
}

function wordOptionLabelClass(state: OptionVisualState) {
  return exerciseOptionEnStateClass(state)
}

function GrammarType2FeedbackSheet({
  kind,
  onContinue,
}: {
  kind: 'correct' | 'wrong'
  onContinue?: () => void
}) {
  const isCorrect = kind === 'correct'
  useEnterToContinue(onContinue)

  return (
    <div className="absolute z-20" style={figmaRectStyle(GRAMMAR_TYPE_2_FEEDBACK_SHEET)}>
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

function GrammarOxPassage({ question }: { question: GrammarType2OxQuestion }) {
  if (!question.maskPassage || !question.passageLines?.length) return null

  const passageText = question.passageLines.join(' ')

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-[19px] border-2 border-[#D9D9D9] bg-white"
        style={figmaRectStyle(GRAMMAR_TYPE_2_PASSAGE)}
      />
      <div
        className="pointer-events-none absolute flex items-center justify-center px-6"
        style={figmaRectStyle(GRAMMAR_TYPE_2_PASSAGE)}
      >
        <p className={`text-center ${GRAMMAR_PASSAGE_TEXT_CLASS}`}>{passageText}</p>
      </div>
    </>
  )
}

function GrammarOxQuestionView({
  question,
  selectedOptionId,
  result,
  locked,
  onOptionClick,
}: {
  question: GrammarType2OxQuestion
  selectedOptionId: GrammarType2OptionId | null
  result: 'correct' | 'wrong' | null
  locked: boolean
  onOptionClick: (optionId: GrammarType2OptionId) => void
}) {
  const getOptionState = (optionId: GrammarType2OptionId): OptionVisualState => {
    if (!selectedOptionId || selectedOptionId !== optionId) return 'idle'
    return result === 'correct' ? 'correct' : 'wrong'
  }

  return (
    <>
      <GrammarOxPassage question={question} />

      {GRAMMAR_TYPE_2_OPTIONS.map((option, index) => {
        const state = getOptionState(option.id)
        const box = GRAMMAR_TYPE_2_OPTION_BOXES[index]

        return (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            disabled={locked}
            className={`absolute flex cursor-pointer items-center justify-center ${oxOptionFrameClass(state)} ${
              locked && state === 'idle' ? 'cursor-default' : ''
            }`}
            style={figmaRectStyle(box)}
            onClick={() => onOptionClick(option.id)}
          >
            <span className={oxOptionLabelClass(state, option.id)}>{option.label}</span>
          </button>
        )
      })}
    </>
  )
}

function GrammarWordChoiceQuestionView({
  question,
  selectedOptionId,
  locked,
  result,
  onOptionClick,
}: {
  question: GrammarType2WordChoiceQuestion
  selectedOptionId: string | null
  locked: boolean
  result: 'correct' | 'wrong' | null
  onOptionClick: (optionId: string) => void
}) {
  const getOptionState = (optionId: string): OptionVisualState => {
    if (!selectedOptionId || selectedOptionId !== optionId) return 'idle'
    return result === 'correct' ? 'correct' : 'wrong'
  }

  return (
    <>
      {question.options.map((option, index) => {
        const state = getOptionState(option.id)
        const box = question.optionBoxes[index]

        return (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            disabled={locked}
            className={`absolute flex cursor-pointer items-center justify-center px-4 ${wordOptionFrameClass(state)} ${
              locked && state === 'idle' ? 'cursor-default' : ''
            }`}
            style={figmaRectStyle(box)}
            onClick={() => onOptionClick(option.id)}
          >
            <span className={wordOptionLabelClass(state)}>{option.label}</span>
          </button>
        )
      })}
    </>
  )
}

function getQuestionAsset(question: GrammarType2Question) {
  if (question.kind === 'word-choice') return question.asset
  return GRAMMAR_TYPE_2_ASSET
}

function getCorrectOptionId(question: GrammarType2Question): string {
  return question.correctOptionId
}

export function GrammarType2Screen({
  sessionOffset,
  questions,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  onRetryFlowHome,
}: GrammarType2ScreenProps) {
  const activeQuestions = questions ?? GRAMMAR_TYPE_2_QUESTIONS
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)

  const question = activeQuestions[questionIndex]
  const isLastQuestion = questionIndex + 1 >= activeQuestions.length
  const locked = result !== null
  const showFeedback = result !== null
  const completedInSection = questionIndex + (showFeedback ? 1 : 0)

  const handleOptionClick = (optionId: string) => {
    if (locked) return

    playTapSfx()
    setSelectedOptionId(optionId)

    if (optionId === getCorrectOptionId(question)) {
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
    <FigmaAssetFrame
      src={getQuestionAsset(question)}
      alt={question.kind === 'word-choice' ? '문법 유형 2 정답 X' : '문법 유형 2'}
      bgClassName="bg-white"
    >
      <div className={`absolute inset-0 z-10 ${showFeedback ? 'pointer-events-none' : ''}`}>
        {hideProgressBar ? (
          <BakedProgressBarMask />
        ) : (
          <ExerciseProgressBar
            sessionOffset={sessionOffset}
            completedInSection={completedInSection}
          />
        )}

        {question.kind === 'ox' ? (
          <GrammarOxQuestionView
            question={question}
            selectedOptionId={selectedOptionId as GrammarType2OptionId | null}
            result={result}
            locked={locked}
            onOptionClick={handleOptionClick}
          />
        ) : (
          <GrammarWordChoiceQuestionView
            question={question}
            selectedOptionId={selectedOptionId}
            locked={locked}
            result={result}
            onOptionClick={handleOptionClick}
          />
        )}
      </div>

      {showRetryComplete && <RetryWrongCompleteSheet onHome={onRetryFlowHome} />}
      {showFeedback && result && !showRetryComplete && (
        <GrammarType2FeedbackSheet kind={result} onContinue={handleFeedbackContinue} />
      )}
    </FigmaAssetFrame>
  )
}
