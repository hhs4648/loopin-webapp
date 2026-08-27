import { useEffect, useMemo, useRef, useState } from 'react'
import {
  EXERCISE_HEADWORD_CLASS,
  exerciseOptionEnStateClass,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { BACK_MASK_WHITE_HEADER } from '../navigation/figma-navigation'
import {
  FEEDBACK_MS,
  figmaRectStyle,
  speakEnglishWord,
  shuffleOptions,
  shuffleChoicesWithRandomCorrect,
  preloadEnglishWordAudio,
  WORD_QUIZ_ASSETS,
  WORD_QUIZ_OPTIONS,
  WORD_QUIZ_PROMPT_BAKE_MASK,
  WORD_QUIZ_PROMPT_WORD,
  WORD_QUIZ_QUESTIONS,
  WORD_QUIZ_SPEAKER_HIT,
} from './word-quiz'
import { sessionWordQuizId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import type { WordQuizQuestion } from './word-quiz'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import {
  useAdvanceWhenNoQuestions,
  type RetryWrongExerciseProps,
} from '../exercise/retry-wrong-ui'

type WordQuizScreenProps = {
  sessionOffset: number
  questions?: WordQuizQuestion[]
  answerIdForQuestion?: (questionId: string) => string
  onAnswer?: (stepId: string, isCorrect: boolean) => void
  onComplete?: () => void
  skipInitialSpeak?: boolean
} & RetryWrongExerciseProps

type OptionVisualState = 'idle' | 'correct' | 'wrong'

function optionFrameClass(state: OptionVisualState) {
  const base = 'box-border border-[3px] shadow-[0_0_12px_#CFDCE9]'

  switch (state) {
    case 'correct':
      return `${base} rounded-2xl border-[#22C55E] bg-[#F0FDF4]`
    case 'wrong':
      return `${base} rounded-2xl border-[#EF4444] bg-[#FEF2F2]`
    default:
      return `${base} rounded-2xl border-transparent bg-[#FEFEFE]`
  }
}

function optionLabelClass(state: OptionVisualState) {
  return exerciseOptionEnStateClass(state)
}

export function WordQuizScreen({
  sessionOffset,
  questions,
  answerIdForQuestion = sessionWordQuizId,
  onAnswer,
  onComplete,
  skipInitialSpeak = false,
  hideProgressBar = false,
  isFinalRetrySection = false,
  sessionTotalSteps,
  onRetryFlowHome,
}: WordQuizScreenProps) {
  // 유형 순서는 유지하고, 문항 출제 순서만 매 세션마다 섞음
  // 주의: questions === [] 는 오답필터 결과(스킵). undefined 만 전체 은행.
  const [activeQuestions] = useState(() =>
    shuffleOptions([...(questions ?? WORD_QUIZ_QUESTIONS)]),
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showRetryComplete, setShowRetryComplete] = useState(false)
  const [feedback, setFeedback] = useState<{
    kind: 'correct' | 'wrong'
    option: string
  } | null>(null)
  const [locked, setLocked] = useState(false)
  const feedbackTimerRef = useRef<number | null>(null)

  const question = activeQuestions[questionIndex]
  const shuffledOptions = useMemo(() => {
    if (!question) return []
    return shuffleChoicesWithRandomCorrect(
      question.options,
      question.correctAnswer,
    )
  }, [question])
  const completedInSection = questionIndex + (feedback ? 1 : 0)

  useAdvanceWhenNoQuestions(activeQuestions.length, () => {
    onComplete?.()
  })

  useEffect(() => {
    void preloadEnglishWordAudio()
  }, [])

  useEffect(() => {
    if (!question) return
    if (skipInitialSpeak && question.id === 'various') return
    speakEnglishWord(question.word)
  }, [question, skipInitialSpeak])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  const getOptionState = (option: string): OptionVisualState => {
    if (!feedback || feedback.option !== option) return 'idle'
    return feedback.kind
  }

  const handleOptionClick = (option: string) => {
    if (!question || locked) return

    playTapSfx()

    const isCorrect = option === question.correctAnswer
    onAnswer?.(answerIdForQuestion(question.id), isCorrect)
    playAnswerSfx(isCorrect)
    setLocked(true)
    setFeedback({ kind: isCorrect ? 'correct' : 'wrong', option })

    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null)
      setLocked(false)

      if (questionIndex + 1 >= activeQuestions.length) {
        if (isFinalRetrySection) {
          setShowRetryComplete(true)
          return
        }
        onComplete?.()
        return
      }

      setQuestionIndex((index) => index + 1)
    }, FEEDBACK_MS)
  }

  if (!question) {
    return null
  }

  return (
    <FigmaAssetFrame backButtonMask={BACK_MASK_WHITE_HEADER} src={WORD_QUIZ_ASSETS.base} alt="단어 퀴즈" bgClassName="bg-white">
      <div className="absolute inset-0 z-10">
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
          className="pointer-events-none absolute z-[1] bg-white"
          style={figmaRectStyle(WORD_QUIZ_PROMPT_BAKE_MASK)}
        />

        <div
          className="pointer-events-none absolute z-[3] flex items-center justify-center bg-transparent"
          style={figmaRectStyle(WORD_QUIZ_PROMPT_WORD)}
        >
          <span className={EXERCISE_HEADWORD_CLASS}>{question.word}</span>
        </div>

        <button
          type="button"
          aria-label={`${question.word} 발음 듣기`}
          className="absolute z-[5] flex cursor-pointer items-center justify-center rounded-full border-0 bg-[#E3F2FD] p-0 shadow-none"
          style={figmaRectStyle(WORD_QUIZ_SPEAKER_HIT)}
          onClick={() => {
            playTapSfx()
            speakEnglishWord(question.word, { force: true })
          }}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-[58%] w-[58%]">
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

        {shuffledOptions.map((option, index) => {
          const state = getOptionState(option)
          const layout = WORD_QUIZ_OPTIONS[index]

          return (
            <button
              key={`${question.id}-${option}`}
              type="button"
              aria-label={option}
              disabled={locked}
              className={`absolute z-[2] flex items-center justify-center px-6 text-center ${optionFrameClass(state)} ${locked ? 'cursor-default' : 'cursor-pointer'}`}
              style={figmaRectStyle(layout)}
              onClick={() => handleOptionClick(option)}
            >
              <span className={optionLabelClass(state)}>{option}</span>
            </button>
          )
        })}
      </div>
      {showRetryComplete && <RetryWrongCompleteSheet onHome={onRetryFlowHome} />}
    </FigmaAssetFrame>
  )
}

