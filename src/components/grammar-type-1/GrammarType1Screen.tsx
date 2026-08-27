import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffleArray } from '../../lib/shuffle'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { BACK_MASK_WHITE_HEADER } from '../navigation/figma-navigation'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { exerciseOptionEnStateClass } from '../exercise/exercise-typography'
import { ExerciseContinueButton } from '../exercise/ExerciseContinueButton'
import {
  ExpandablePassageBox,
  PASSAGE_SAFE_BOTTOM,
  shiftRect,
} from '../exercise/ExpandablePassageBox'
import {
  GRAMMAR_PASSAGE_BLANK_CLASS,
  GRAMMAR_PASSAGE_TEXT_CLASS,
} from '../grammar/grammar-typography'
import {
  figmaRectStyle,
  GRAMMAR_TYPE_1_ASSET,
  GRAMMAR_TYPE_1_OPTION_BOXES,
  GRAMMAR_TYPE_1_PASSAGE,
  GRAMMAR_TYPE_1_QUESTIONS,
  type GrammarType1Question,
} from './grammar-type-1'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import {
  useAdvanceWhenNoQuestions,
  type RetryWrongExerciseProps,
} from '../exercise/retry-wrong-ui'

/** 정답 시 효과음 후 자동 진행 */
const CORRECT_AUTO_ADVANCE_MS = 1000

/** 선택지를 아래로 민 뒤에도 피드백 시트 위에 남도록 */
const PASSAGE_MAX_BOTTOM =
  PASSAGE_SAFE_BOTTOM - GRAMMAR_TYPE_1_OPTION_BOXES[0]!.h - 12

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
      return `${base} border-[#1E1E1E] bg-white`
  }
}

function optionLabelClass(state: OptionVisualState) {
  return exerciseOptionEnStateClass(state)
}

function GrammarPassage({
  question,
  selectedLabel,
  onGrowthChange,
}: {
  question: GrammarType1Question
  selectedLabel: string | null
  onGrowthChange: (growth: number) => void
}) {
  useEffect(() => {
    if (!question.maskPassage) onGrowthChange(0)
  }, [question.maskPassage, question.id, onGrowthChange])

  if (!question.maskPassage) return null

  return (
    <ExpandablePassageBox
      rect={GRAMMAR_TYPE_1_PASSAGE}
      maxBottom={PASSAGE_MAX_BOTTOM}
      contentKey={question.id}
      onGrowthChange={onGrowthChange}
      className="pointer-events-none absolute z-[2] justify-center rounded-[19px] border-2 border-[#D9D9D9] bg-white"
      contentClassName="flex w-full flex-col items-center justify-center px-4 py-5 text-center"
    >
      <p
        className={`${GRAMMAR_PASSAGE_TEXT_CLASS} w-full text-center leading-[1.5]`}
        style={{ overflowWrap: 'break-word' }}
      >
        {question.passageBefore ? (
          <span className="whitespace-pre-wrap">{question.passageBefore} </span>
        ) : null}
        <span className={`${GRAMMAR_PASSAGE_BLANK_CLASS} mx-0.5 align-middle`}>
          {selectedLabel ?? ''}
        </span>
        {question.passageAfter ? (
          <span className="whitespace-pre-wrap"> {question.passageAfter}</span>
        ) : null}
      </p>
    </ExpandablePassageBox>
  )
}

export function GrammarType1Screen({
  sessionOffset,
  questions,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  sessionTotalSteps,
  onRetryFlowHome,
}: GrammarType1ScreenProps) {
  const [activeQuestions] = useState(() =>
    shuffleArray([...(questions ?? GRAMMAR_TYPE_1_QUESTIONS)]),
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const autoAdvanceRef = useRef<number | null>(null)

  const [passageGrowth, setPassageGrowth] = useState(0)
  const question = activeQuestions[questionIndex]
  const displayOptions = useMemo(
    () => (question ? shuffleArray(question.options) : []),
    [question],
  )
  const isLastQuestion = questionIndex + 1 >= activeQuestions.length
  const locked = result !== null
  const showFeedback = result !== null
  const completedInSection = questionIndex + (showFeedback ? 1 : 0)

  useEffect(() => {
    setPassageGrowth(0)
  }, [question?.id])

  useAdvanceWhenNoQuestions(activeQuestions.length, () => {
    onComplete?.()
  })

  const correctOption = question?.options.find(
    (option) => option.id === question.correctOptionId,
  )
  const selectedOption = displayOptions.find((option) => option.id === selectedOptionId)

  const getOptionState = (optionId: string): OptionVisualState => {
    if (!result || !question) return 'idle'
    if (optionId === question.correctOptionId) return 'correct'
    if (selectedOptionId === optionId) return 'wrong'
    return 'idle'
  }

  const resetQuestionState = () => {
    setSelectedOptionId(null)
    setResult(null)
  }

  const handleFeedbackContinue = () => {
    if (autoAdvanceRef.current != null) {
      window.clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }

    if (isLastQuestion) {
      if (!isFinalRetrySection) {
        onComplete?.()
      }
      return
    }

    setQuestionIndex((prev) => prev + 1)
    resetQuestionState()
  }

  // 정답 자동 진행이 끊겨도 수동 「계속하기」로 탈출 가능
  const continueAfterFeedback = () => {
    playTapSfx()
    handleFeedbackContinue()
  }

  const handleOptionClick = (optionId: string) => {
    if (!question || locked) return

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

  useEffect(() => {
    if (!question || result !== 'correct') return
    if (isLastQuestion && isFinalRetrySection) return

    autoAdvanceRef.current = window.setTimeout(() => {
      autoAdvanceRef.current = null
      handleFeedbackContinue()
    }, CORRECT_AUTO_ADVANCE_MS)

    return () => {
      if (autoAdvanceRef.current != null) {
        window.clearTimeout(autoAdvanceRef.current)
        autoAdvanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 정답 직후 1회만
  }, [result, question?.id])

  const showRetryComplete = showFeedback && isLastQuestion && isFinalRetrySection

  if (!question) {
    return null
  }

  return (
    <FigmaAssetFrame backButtonMask={BACK_MASK_WHITE_HEADER} src={GRAMMAR_TYPE_1_ASSET} alt="문법 유형 1" bgClassName="bg-white">
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

        <GrammarPassage
          question={question}
          selectedLabel={
            locked
              ? (correctOption?.label ?? selectedOption?.label ?? null)
              : null
          }
          onGrowthChange={setPassageGrowth}
        />

        {displayOptions.map((option, index) => {
          const state = getOptionState(option.id)
          const box = shiftRect(GRAMMAR_TYPE_1_OPTION_BOXES[index]!, passageGrowth)

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
      {showFeedback && result && !showRetryComplete ? (
        <ExerciseContinueButton
          kind={result}
          title={result === 'correct' ? '정답입니다.' : '오답입니다.'}
          hint={
            result === 'wrong' && correctOption?.label
              ? `정답은 ${correctOption.label}에요`
              : undefined
          }
          onContinue={continueAfterFeedback}
        />
      ) : null}
    </FigmaAssetFrame>
  )
}

