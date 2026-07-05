import { useEffect, useMemo, useRef, useState } from 'react'
import {
  EXERCISE_HEADWORD_CLASS,
  exerciseOptionEnStateClass,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  FEEDBACK_MS,
  figmaRectStyle,
  speakEnglishWord,
  shuffleOptions,
  preloadEnglishWordAudio,
  WORD_QUIZ_ASSETS,
  WORD_QUIZ_OPTIONS,
  WORD_QUIZ_PROMPT_WORD,
  WORD_QUIZ_QUESTIONS,
  WORD_QUIZ_SPEAKER_HIT,
} from './word-quiz'
import { sessionWordQuizId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import type { WordQuizQuestion } from './word-quiz'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import type { RetryWrongExerciseProps } from '../exercise/retry-wrong-ui'

type WordQuizScreenProps = {
  sessionOffset: number
  questions?: WordQuizQuestion[]
  onAnswer?: (stepId: string, isCorrect: boolean) => void
  onComplete?: () => void
  skipInitialSpeak?: boolean
} & RetryWrongExerciseProps

type OptionVisualState = 'idle' | 'correct' | 'wrong'

function optionFrameClass(state: OptionVisualState) {
  const base = 'box-border border-[3px]'

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
  onAnswer,
  onComplete,
  skipInitialSpeak = false,
  hideProgressBar = false,
  isFinalRetrySection = false,
  onRetryFlowHome,
}: WordQuizScreenProps) {
  const activeQuestions = questions ?? WORD_QUIZ_QUESTIONS
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showRetryComplete, setShowRetryComplete] = useState(false)
  const [feedback, setFeedback] = useState<{
    kind: 'correct' | 'wrong'
    option: string
  } | null>(null)
  const [locked, setLocked] = useState(false)
  const feedbackTimerRef = useRef<number | null>(null)

  const question = activeQuestions[questionIndex]
  const shuffledOptions = useMemo(
    () => shuffleOptions(question.options),
    [question.id],
  )
  const completedInSection = questionIndex + (feedback ? 1 : 0)

  useEffect(() => {
    void preloadEnglishWordAudio()
  }, [])

  useEffect(() => {
    if (skipInitialSpeak && question.id === 'various') return
    speakEnglishWord(question.word)
  }, [question.id, skipInitialSpeak])

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
    if (locked) return

    playTapSfx()

    const isCorrect = option === question.correctAnswer
    onAnswer?.(sessionWordQuizId(question.id), isCorrect)
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

  return (
    <FigmaAssetFrame src={WORD_QUIZ_ASSETS.base} alt="단어 퀴즈" bgClassName="bg-white">
      <div className="absolute inset-0 z-10">
        {hideProgressBar ? (
          <BakedProgressBarMask />
        ) : (
          <ExerciseProgressBar
            sessionOffset={sessionOffset}
            completedInSection={completedInSection}
          />
        )}

        <div
          className="pointer-events-none absolute flex items-center justify-center bg-white"
          style={figmaRectStyle(WORD_QUIZ_PROMPT_WORD)}
        >
          <span className={EXERCISE_HEADWORD_CLASS}>
            {question.word}
          </span>
        </div>

        <button
          type="button"
          aria-label={`${question.word} 발음 듣기`}
          className="absolute cursor-pointer rounded-full bg-transparent"
          style={figmaRectStyle(WORD_QUIZ_SPEAKER_HIT)}
          onClick={() => {
            playTapSfx()
            speakEnglishWord(question.word, { force: true })
          }}
        />

        {shuffledOptions.map((option, index) => {
          const state = getOptionState(option)
          const layout = WORD_QUIZ_OPTIONS[index]

          return (
            <button
              key={`${question.id}-${option}`}
              type="button"
              aria-label={option}
              disabled={locked}
              className={`absolute flex items-center justify-center px-6 text-center ${optionFrameClass(state)} ${locked ? 'cursor-default' : 'cursor-pointer'}`}
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
