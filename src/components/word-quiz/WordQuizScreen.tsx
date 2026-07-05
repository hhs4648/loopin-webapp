import { useEffect, useMemo, useRef, useState } from 'react'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  FEEDBACK_MS,
  figmaRectStyle,
  speakEnglishWord,
  shuffleOptions,
  preloadEnglishWordAudio,
  WORD_QUIZ_ASSETS,
  WORD_QUIZ_OPTIONS,
  WORD_QUIZ_PROGRESS_BAR,
  WORD_QUIZ_PROGRESS_LABEL,
  WORD_QUIZ_PROMPT_WORD,
  WORD_QUIZ_QUESTIONS,
  WORD_QUIZ_SPEAKER_HIT,
} from './word-quiz'

type WordQuizScreenProps = {
  onComplete?: () => void
  skipInitialSpeak?: boolean
}

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
  switch (state) {
    case 'correct':
      return 'text-[17px] font-semibold leading-snug text-[#22C55E]'
    case 'wrong':
      return 'text-[17px] font-semibold leading-snug text-[#EF4444]'
    default:
      return 'text-[17px] font-semibold leading-snug text-[#1E1E1E]'
  }
}

export function WordQuizScreen({ onComplete, skipInitialSpeak = false }: WordQuizScreenProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [feedback, setFeedback] = useState<{
    kind: 'correct' | 'wrong'
    option: string
  } | null>(null)
  const [locked, setLocked] = useState(false)
  const feedbackTimerRef = useRef<number | null>(null)

  const question = WORD_QUIZ_QUESTIONS[questionIndex]
  const shuffledOptions = useMemo(
    () => shuffleOptions(question.options),
    [question.id],
  )
  const questionNumber = questionIndex + 1
  const progressRatio = questionNumber / WORD_QUIZ_QUESTIONS.length

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

    const isCorrect = option === question.correctAnswer
    setLocked(true)
    setFeedback({ kind: isCorrect ? 'correct' : 'wrong', option })

    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null)
      setLocked(false)

      if (questionIndex + 1 >= WORD_QUIZ_QUESTIONS.length) {
        onComplete?.()
        return
      }

      setQuestionIndex((index) => index + 1)
    }, FEEDBACK_MS)
  }

  return (
    <FigmaAssetFrame src={WORD_QUIZ_ASSETS.base} alt="단어 퀴즈" bgClassName="bg-white">
      <div className="absolute inset-0 z-10">
        <div
          className="pointer-events-none absolute overflow-hidden rounded-[9px] bg-[#E3E7EA]"
          style={figmaRectStyle(WORD_QUIZ_PROGRESS_BAR)}
        >
          <div
            className="h-full rounded-[9px] bg-[#3C86FF]"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
        <p
          className="pointer-events-none absolute flex items-center justify-center text-[11px] font-medium text-[#9E9FA7]"
          style={figmaRectStyle(WORD_QUIZ_PROGRESS_LABEL)}
        >
          {questionNumber}/{WORD_QUIZ_QUESTIONS.length}
        </p>

        <div
          className="pointer-events-none absolute flex items-center justify-center bg-white"
          style={figmaRectStyle(WORD_QUIZ_PROMPT_WORD)}
        >
          <span className="text-[28px] font-bold tracking-[-0.02em] text-[#1E1E1E]">
            {question.word}
          </span>
        </div>

        <button
          type="button"
          aria-label={`${question.word} 발음 듣기`}
          className="absolute cursor-pointer rounded-full bg-transparent"
          style={figmaRectStyle(WORD_QUIZ_SPEAKER_HIT)}
          onClick={() => speakEnglishWord(question.word, { force: true })}
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
    </FigmaAssetFrame>
  )
}
