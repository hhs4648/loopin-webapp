import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffleArray } from '../../lib/shuffle'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import {
  exerciseOptionEnStateClass,
  exerciseOxLabelClass,
} from '../exercise/exercise-typography'
import { ExerciseContinueButton } from '../exercise/ExerciseContinueButton'
import {
  ExpandablePassageBox,
  PASSAGE_SAFE_BOTTOM,
  shiftRect,
} from '../exercise/ExpandablePassageBox'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { BACK_MASK_WHITE_HEADER } from '../navigation/figma-navigation'
import { GRAMMAR_PASSAGE_TEXT_CLASS } from '../grammar/grammar-typography'
import {
  figmaRectStyle,
  GRAMMAR_TYPE_2_ASSET,
  GRAMMAR_TYPE_2_OPTION_BOXES,
  GRAMMAR_TYPE_2_OPTIONS,
  GRAMMAR_TYPE_2_PASSAGE,
  GRAMMAR_TYPE_2_X_PASSAGE,
  GRAMMAR_TYPE_2_QUESTIONS,
  prepareGrammarType2Steps,
  type GrammarType2OptionId,
  type GrammarType2OxQuestion,
  type GrammarType2Question,
  type GrammarType2WordChoiceQuestion,
} from './grammar-type-2'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import {
  useAdvanceWhenNoQuestions,
  type RetryWrongExerciseProps,
} from '../exercise/retry-wrong-ui'

type GrammarType2ScreenProps = {
  sessionOffset: number
  questions?: GrammarType2Question[]
  onAnswer?: (questionId: string, isCorrect: boolean) => void
  onComplete?: () => void
} & RetryWrongExerciseProps

type OptionVisualState = 'idle' | 'correct' | 'wrong'

/** 정답 시 효과음 후 자동 진행 */
const CORRECT_AUTO_ADVANCE_MS = 1000

/** OX 선택지를 아래로 민 뒤에도 피드백 시트 위에 남도록 */
const OX_PASSAGE_MAX_BOTTOM =
  PASSAGE_SAFE_BOTTOM - GRAMMAR_TYPE_2_OPTION_BOXES[0]!.h - 12

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
      return `${base} border-[#D9D9D9] bg-[#FEFEFE]`
  }
}

function oxOptionLabelClass(state: OptionVisualState, optionId: GrammarType2OptionId) {
  return exerciseOxLabelClass(state, optionId)
}

function wordOptionLabelClass(state: OptionVisualState) {
  return exerciseOptionEnStateClass(state)
}

function wordChoicePassageMaxBottom(
  optionBoxes: readonly { x: number; y: number; w: number; h: number }[],
): number {
  const first = optionBoxes[0]
  const last = optionBoxes[optionBoxes.length - 1]
  if (!first || !last) return PASSAGE_SAFE_BOTTOM
  const optionBlockH = last.y + last.h - first.y
  return PASSAGE_SAFE_BOTTOM - optionBlockH - 12
}

function GrammarOxPassage({
  question,
  onGrowthChange,
}: {
  question: GrammarType2OxQuestion
  onGrowthChange: (growth: number) => void
}) {
  useEffect(() => {
    if (!question.maskPassage) onGrowthChange(0)
  }, [question.maskPassage, question.id, onGrowthChange])

  if (!question.maskPassage || !question.passageLines?.length) return null

  const passageText = question.passageLines.join(' ')

  return (
    <ExpandablePassageBox
      rect={GRAMMAR_TYPE_2_PASSAGE}
      maxBottom={OX_PASSAGE_MAX_BOTTOM}
      contentKey={question.id}
      onGrowthChange={onGrowthChange}
      className="pointer-events-none absolute z-[2] rounded-[19px] border-2 border-[#D9D9D9] bg-white"
      contentClassName="flex w-full items-center justify-center px-6 py-5"
    >
      <p className={`text-center ${GRAMMAR_PASSAGE_TEXT_CLASS}`}>{passageText}</p>
    </ExpandablePassageBox>
  )
}

/** X 교정 — 틀린 부분 빨간 글자 + 밑줄 */
function GrammarXCorrectionPassage({
  question,
  maxBottom,
  onGrowthChange,
}: {
  question: GrammarType2WordChoiceQuestion
  maxBottom: number
  onGrowthChange: (growth: number) => void
}) {
  useEffect(() => {
    if (!question.maskPassage) onGrowthChange(0)
  }, [question.maskPassage, question.id, onGrowthChange])

  if (!question.maskPassage || !question.wrongPart) return null

  return (
    <ExpandablePassageBox
      rect={GRAMMAR_TYPE_2_X_PASSAGE}
      maxBottom={maxBottom}
      contentKey={question.id}
      onGrowthChange={onGrowthChange}
      className="pointer-events-none absolute z-[2] rounded-[19px] border-2 border-[#D9D9D9] bg-white"
      contentClassName="flex w-full items-center justify-center px-6 py-5"
    >
      <p className={`text-center ${GRAMMAR_PASSAGE_TEXT_CLASS}`}>
        {question.passageBefore ? `${question.passageBefore} ` : null}
        <span className="font-semibold text-[#EF4444] underline decoration-2 underline-offset-[3px]">
          {question.wrongPart}
        </span>
        {question.passageAfter ? ` ${question.passageAfter}` : null}
      </p>
    </ExpandablePassageBox>
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
  const [passageGrowth, setPassageGrowth] = useState(0)

  useEffect(() => {
    setPassageGrowth(0)
  }, [question.id])

  const getOptionState = (optionId: GrammarType2OptionId): OptionVisualState => {
    if (!result) return 'idle'
    if (optionId === question.correctOptionId) return 'correct'
    if (selectedOptionId === optionId) return 'wrong'
    return 'idle'
  }

  return (
    <>
      <GrammarOxPassage question={question} onGrowthChange={setPassageGrowth} />

      {GRAMMAR_TYPE_2_OPTIONS.map((option, index) => {
        const state = getOptionState(option.id)
        const box = shiftRect(GRAMMAR_TYPE_2_OPTION_BOXES[index]!, passageGrowth)

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
  const [passageGrowth, setPassageGrowth] = useState(0)
  const passageMaxBottom = useMemo(
    () => wordChoicePassageMaxBottom(question.optionBoxes),
    [question.optionBoxes],
  )

  useEffect(() => {
    setPassageGrowth(0)
  }, [question.id])

  const displayOptions = useMemo(
    () => shuffleArray(question.options),
    [question.id, question.options],
  )

  const getOptionState = (optionId: string): OptionVisualState => {
    if (!result) return 'idle'
    if (optionId === question.correctOptionId) return 'correct'
    if (selectedOptionId === optionId) return 'wrong'
    return 'idle'
  }

  return (
    <>
      <GrammarXCorrectionPassage
        question={question}
        maxBottom={passageMaxBottom}
        onGrowthChange={setPassageGrowth}
      />

      {displayOptions.map((option, index) => {
        const state = getOptionState(option.id)
        const box = shiftRect(question.optionBoxes[index]!, passageGrowth)

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

function getCorrectAnswerLabel(question: GrammarType2Question): string {
  if (question.kind === 'ox') {
    return question.correctOptionId === 'o' ? 'O' : 'X'
  }
  return (
    question.options.find((option) => option.id === question.correctOptionId)?.label ??
    ''
  )
}

export function GrammarType2Screen({
  sessionOffset,
  questions,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  sessionTotalSteps,
  onRetryFlowHome,
}: GrammarType2ScreenProps) {
  const [activeQuestions] = useState(() =>
    prepareGrammarType2Steps([...(questions ?? GRAMMAR_TYPE_2_QUESTIONS)]),
  )
  const activeQuestionsRef = useRef(activeQuestions)
  const onCompleteRef = useRef(onComplete)
  const advancingRef = useRef(false)
  const autoAdvanceRef = useRef<number | null>(null)

  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)

  useAdvanceWhenNoQuestions(activeQuestions.length, () => {
    onCompleteRef.current?.()
  })

  useEffect(() => {
    activeQuestionsRef.current = activeQuestions
  }, [activeQuestions])

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const question = activeQuestions[questionIndex]
  const isLastQuestion = questionIndex + 1 >= activeQuestions.length
  const locked = result !== null
  const showFeedback = result !== null
  const completedInSection = questionIndex + (showFeedback ? 1 : 0)

  const resetQuestionState = () => {
    setSelectedOptionId(null)
    setResult(null)
  }

  const handleFeedbackContinue = (opts?: { playTap?: boolean }) => {
    // 터치+클릭 중복으로 교정(word-choice) 스텝을 건너뛰지 않게 잠금
    if (advancingRef.current) return
    advancingRef.current = true
    if (opts?.playTap !== false) playTapSfx()

    if (autoAdvanceRef.current != null) {
      window.clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }

    const steps = activeQuestionsRef.current
    const nextIndex = questionIndex + 1

    if (nextIndex >= steps.length) {
      // 섹션 종료 — 잠금을 바로 풀어 완료 콜백이 막히지 않게 함
      advancingRef.current = false
      if (!isFinalRetrySection) {
        onCompleteRef.current?.()
      }
      return
    }

    setQuestionIndex(nextIndex)
    resetQuestionState()
    window.setTimeout(() => {
      advancingRef.current = false
    }, 400)
  }

  const handleOptionClick = (optionId: string) => {
    if (!question || locked) return

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

  useEffect(() => {
    if (!question || result !== 'correct') return
    if (isLastQuestion && isFinalRetrySection) return

    autoAdvanceRef.current = window.setTimeout(() => {
      autoAdvanceRef.current = null
      handleFeedbackContinue({ playTap: false })
    }, CORRECT_AUTO_ADVANCE_MS)

    return () => {
      if (autoAdvanceRef.current != null) {
        window.clearTimeout(autoAdvanceRef.current)
        autoAdvanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 정답 직후 1회만
  }, [result, question?.id])

  if (!question) return null

  const showRetryComplete = showFeedback && isLastQuestion && isFinalRetrySection
  const correctAnswerLabel = getCorrectAnswerLabel(question)

  return (
    <FigmaAssetFrame backButtonMask={BACK_MASK_WHITE_HEADER}
      key={question.id}
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
            totalSteps={sessionTotalSteps}
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
      {showFeedback && result && !showRetryComplete ? (
        <ExerciseContinueButton
          kind={result}
          title={result === 'correct' ? '정답입니다.' : '오답입니다.'}
          hint={
            result === 'wrong' && correctAnswerLabel
              ? `정답은 ${correctAnswerLabel}에요`
              : undefined
          }
          onContinue={() => handleFeedbackContinue({ playTap: true })}
        />
      ) : null}
    </FigmaAssetFrame>
  )
}
