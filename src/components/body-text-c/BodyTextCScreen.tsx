import { useState, type FormEvent } from 'react'
import {
  COLOR_CORRECT_BG,
  COLOR_WRONG_BG,
  EXERCISE_CTA_CLASS,
  EXERCISE_FEEDBACK_HINT_CLASS,
  EXERCISE_HINT_KO_CLASS,
  EXERCISE_INPUT_EN_CLASS,
  EXERCISE_PASSAGE_KO_CLASS,
  exerciseFeedbackTitleClass,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  BODY_TEXT_C_ASSET,
  BODY_TEXT_C_FEEDBACK_SHEET,
  BODY_TEXT_C_PASSAGE,
  BODY_TEXT_C_QUESTIONS,
  BODY_TEXT_C_SENTENCE_BOX,
  BODY_TEXT_C_SUBMIT_BTN,
  BODY_TEXT_C_SUBMIT_BTN_MASK,
  figmaRectStyle,
  formatBodyTextCKeywordHint,
  matchesBodyTextCAnswer,
} from './body-text-c'
import { sessionBodyTextCId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import type { BodyTextCQuestion } from './body-text-c'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import { useEnterToContinue } from '../exercise/use-enter-to-continue'
import type { RetryWrongExerciseProps } from '../exercise/retry-wrong-ui'

type BodyTextCScreenProps = {
  sessionOffset: number
  questions?: BodyTextCQuestion[]
  onAnswer?: (stepId: string, isCorrect: boolean) => void
  onComplete?: () => void
} & RetryWrongExerciseProps

type BodyResult = 'playing' | 'correct' | 'wrong'

function BodyTextCFeedbackSheet({
  kind,
  exampleEn,
  onContinue,
}: {
  kind: 'correct' | 'wrong'
  exampleEn?: string
  onContinue?: () => void
}) {
  const isCorrect = kind === 'correct'
  useEnterToContinue(onContinue)

  return (
    <div className="absolute z-20" style={figmaRectStyle(BODY_TEXT_C_FEEDBACK_SHEET)}>
      <div className="flex h-full flex-col rounded-t-[24px] border-t border-[#E4E7EA] bg-white px-[30px] pb-[41px] pt-[30px] shadow-[0_-10px_24px_rgba(0,0,0,0.06)]">
        <p className={exerciseFeedbackTitleClass(isCorrect)}>
          {isCorrect ? '정답입니다.' : '오답입니다.'}
        </p>
        {exampleEn && (
          <p className={EXERCISE_FEEDBACK_HINT_CLASS}>
            예문은 {exampleEn}
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

export function BodyTextCScreen({
  sessionOffset,
  questions,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  onRetryFlowHome,
}: BodyTextCScreenProps) {
  const activeQuestions = questions ?? BODY_TEXT_C_QUESTIONS
  const [questionIndex, setQuestionIndex] = useState(0)
  const question = activeQuestions[questionIndex]
  const isLastQuestion = questionIndex + 1 >= activeQuestions.length

  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<BodyResult>('playing')

  const hasAnswer = answer.trim().length > 0
  const isPlaying = result === 'playing'
  const showFeedback = result === 'correct' || result === 'wrong'
  const completedInSection = questionIndex + (showFeedback ? 1 : 0)

  const resetQuestionState = () => {
    setAnswer('')
    setResult('playing')
  }

  const handleSubmit = () => {
    if (!isPlaying || !hasAnswer) return

    playTapSfx()

    if (matchesBodyTextCAnswer(answer, question)) {
      onAnswer?.(sessionBodyTextCId(question.id), true)
      playAnswerSfx(true)
      setResult('correct')
      return
    }

    onAnswer?.(sessionBodyTextCId(question.id), false)
    playAnswerSfx(false)
    setResult('wrong')
  }

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault()
    handleSubmit()
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
    resetQuestionState()
  }

  const showRetryComplete = showFeedback && isLastQuestion && isFinalRetrySection

  return (
    <FigmaAssetFrame src={BODY_TEXT_C_ASSET} alt="본문 C" bgClassName="bg-white">
      <div className={`absolute inset-0 z-10 ${showFeedback ? 'pointer-events-none' : ''}`}>
        {hideProgressBar ? (
          <BakedProgressBarMask />
        ) : (
          <ExerciseProgressBar
            sessionOffset={sessionOffset}
            completedInSection={completedInSection}
          />
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute bg-white"
          style={figmaRectStyle(BODY_TEXT_C_PASSAGE)}
        />
        <div
          className="pointer-events-none absolute flex flex-col justify-center gap-1 px-5"
          style={figmaRectStyle(BODY_TEXT_C_PASSAGE)}
        >
          <p className={`line-clamp-2 ${EXERCISE_PASSAGE_KO_CLASS}`}>
            {question.promptKo}
          </p>
          <p className={EXERCISE_HINT_KO_CLASS}>
            {formatBodyTextCKeywordHint(question.keywords)}
          </p>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bg-[#F6F9FD]"
          style={figmaRectStyle(BODY_TEXT_C_SENTENCE_BOX)}
        />
        <form
          id="body-text-c-answer-form"
          className="absolute overflow-hidden px-4 py-3"
          style={figmaRectStyle(BODY_TEXT_C_SENTENCE_BOX)}
          onSubmit={handleFormSubmit}
        >
          <input
            type="text"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={!isPlaying}
            aria-label="영어 예문 입력"
            placeholder="영어 예문을 입력하세요"
            className={`h-full w-full border-0 bg-transparent ${EXERCISE_INPUT_EN_CLASS}`}
          />
        </form>

        {hasAnswer && (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-[20px] bg-white"
            style={figmaRectStyle(BODY_TEXT_C_SUBMIT_BTN_MASK)}
          />
        )}

        <button
          type="submit"
          form="body-text-c-answer-form"
          aria-label="제출하기"
          disabled={!hasAnswer || !isPlaying}
          className={`absolute flex items-center justify-center rounded-2xl ${EXERCISE_CTA_CLASS} text-white ${
            hasAnswer
              ? 'z-[1] cursor-pointer border border-white bg-[#3C86FF]'
              : 'cursor-default bg-transparent'
          }`}
          style={figmaRectStyle(BODY_TEXT_C_SUBMIT_BTN)}
        >
          {hasAnswer && '제출하기'}
        </button>
      </div>

      {showRetryComplete && <RetryWrongCompleteSheet onHome={onRetryFlowHome} />}
      {showFeedback && !showRetryComplete && (
        <BodyTextCFeedbackSheet
          kind={result === 'correct' ? 'correct' : 'wrong'}
          exampleEn={question.exampleEn}
          onContinue={handleFeedbackContinue}
        />
      )}
    </FigmaAssetFrame>
  )
}
