import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { shuffleArray } from '../../lib/shuffle'
import {
  EXERCISE_COACH_LINE_CLASS,
  EXERCISE_CTA_CLASS,
  EXERCISE_INPUT_EN_CLASS,
  EXERCISE_OPTION_EN_CLASS,
  EXERCISE_PASSAGE_KO_CLASS,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { ExerciseContinueButton } from '../exercise/ExerciseContinueButton'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  BODY_TEXT_C_ASSET,
  BODY_TEXT_C_COACH_RETRY,
  BODY_TEXT_C_PASSAGE,
  BODY_TEXT_C_QUESTIONS,
  BODY_TEXT_C_SENTENCE_BOX,
  BODY_TEXT_C_SUBMIT_BTN,
  BODY_TEXT_C_SUBMIT_BTN_MASK,
  buildBodyTextCCorrectMask,
  buildBodyTextCDisplayChars,
  buildBodyTextCDisplayCharsFromSlots,
  buildBodyTextCRetrySlots,
  countBodyTextCTypeableLetters,
  figmaRectStyle,
  groupBodyTextCDisplayWords,
  matchesBodyTextCAnswer,
  reconstructBodyTextCAnswer,
  reconstructBodyTextCAnswerFromSlots,
  type BodyTextCDisplayChar,
  type BodyTextCQuestion,
} from './body-text-c'
import { sessionBodyTextCId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import {
  useAdvanceWhenNoQuestions,
  type RetryWrongExerciseProps,
} from '../exercise/retry-wrong-ui'

type BodyTextCScreenProps = {
  sessionOffset: number
  questions?: BodyTextCQuestion[]
  answerIdForQuestion?: (questionId: string) => string
  onAnswer?: (stepId: string, isCorrect: boolean) => void
  onComplete?: () => void
} & RetryWrongExerciseProps

type BodyResult = 'playing' | 'retry' | 'correct' | 'wrong'

function displayCharClass(ch: BodyTextCDisplayChar): string {
  if (ch.kind === 'filled') return 'text-[#1F242E]'
  if (ch.kind === 'locked') return 'text-[#15803D]'
  if (ch.kind === 'hint') return 'text-[#64748B]'
  if (ch.kind === 'punct') return 'text-[#1F242E]'
  return 'text-[#9AA4B4]'
}

function displayCharText(ch: BodyTextCDisplayChar): string {
  if (ch.kind === 'blank') return '_'
  if (ch.kind === 'gap') return ''
  return ch.char
}

export function BodyTextCScreen({
  sessionOffset,
  questions,
  answerIdForQuestion = sessionBodyTextCId,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  sessionTotalSteps,
  onRetryFlowHome,
}: BodyTextCScreenProps) {
  // questions === [] → 오답 없음(스킵). undefined → 전체 은행.
  const [activeQuestions] = useState(() =>
    shuffleArray([...(questions ?? BODY_TEXT_C_QUESTIONS)]),
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const question = activeQuestions[questionIndex]
  const isLastQuestion = questionIndex + 1 >= activeQuestions.length

  useAdvanceWhenNoQuestions(activeQuestions.length, () => {
    onComplete?.()
  })

  /** 빈칸에만 채우는 글자 → 알파벳 순서 입력 (첫 시도) */
  const [typedLetters, setTypedLetters] = useState('')
  /** 재도전 때 틀린 칸만 입력 */
  const [editableTyped, setEditableTyped] = useState('')
  const [lockedMask, setLockedMask] = useState<boolean[] | null>(null)
  const [retryUsed, setRetryUsed] = useState(false)
  const [result, setResult] = useState<BodyResult>('playing')
  const [inputFocused, setInputFocused] = useState(false)
  const [keyboardInsetPx, setKeyboardInsetPx] = useState(0)
  const [keyboardHint, setKeyboardHint] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typedLettersRef = useRef('')
  const editableTypedRef = useRef('')
  typedLettersRef.current = typedLetters
  editableTypedRef.current = editableTyped

  const typeableCount = useMemo(
    () =>
      question ? countBodyTextCTypeableLetters(question.exampleEn) : 0,
    [question],
  )
  const unlockedCount = useMemo(() => {
    if (!lockedMask) return typeableCount
    return lockedMask.reduce((count, locked) => count + (locked ? 0 : 1), 0)
  }, [lockedMask, typeableCount])

  const retrySlots = useMemo(() => {
    if (!lockedMask || !question) return null
    return buildBodyTextCRetrySlots(question.exampleEn, lockedMask, editableTyped)
  }, [lockedMask, question, editableTyped])

  const reconstructedAnswer = useMemo(() => {
    if (!question) return ''
    if (retrySlots) {
      return reconstructBodyTextCAnswerFromSlots(question.exampleEn, retrySlots)
    }
    return reconstructBodyTextCAnswer(question.exampleEn, typedLetters)
  }, [question, typedLetters, retrySlots])

  const isPlaying = result === 'playing' || result === 'retry'
  const hasAnswer =
    result === 'retry' ? editableTyped.length > 0 : typedLetters.length > 0
  const showFeedback = result === 'correct' || result === 'wrong'
  const completedInSection = questionIndex + (showFeedback ? 1 : 0)

  const displayWords = useMemo(() => {
    if (!question) return []
    const chars =
      lockedMask && retrySlots
        ? buildBodyTextCDisplayCharsFromSlots(
            question.exampleEn,
            retrySlots,
            lockedMask,
          )
        : buildBodyTextCDisplayChars(question.exampleEn, typedLetters)
    return groupBodyTextCDisplayWords(chars)
  }, [question, typedLetters, lockedMask, retrySlots])

  const caretTypeIndex = useMemo(() => {
    if (result === 'retry' && retrySlots) {
      const emptyIndex = retrySlots.findIndex((slot) => slot === null)
      return emptyIndex >= 0 ? emptyIndex : retrySlots.length
    }
    return typedLetters.length
  }, [result, retrySlots, typedLetters.length])

  useEffect(() => {
    if (!isPlaying) return
    const focus = () => inputRef.current?.focus({ preventScroll: true })
    focus()
    const timer = window.setTimeout(focus, 80)
    return () => window.clearTimeout(timer)
  }, [isPlaying, question?.id, result])

  // 모바일 키보드가 올라오면 visualViewport 기준으로 제출 버튼을 위로 올림
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const syncKeyboardInset = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardInsetPx((prev) => (Math.abs(prev - inset) < 12 ? prev : inset))
    }

    syncKeyboardInset()
    vv.addEventListener('resize', syncKeyboardInset)
    vv.addEventListener('scroll', syncKeyboardInset)
    window.addEventListener('resize', syncKeyboardInset)
    return () => {
      vv.removeEventListener('resize', syncKeyboardInset)
      vv.removeEventListener('scroll', syncKeyboardInset)
      window.removeEventListener('resize', syncKeyboardInset)
    }
  }, [])

  const liftSubmitAboveKeyboard =
    inputFocused && isPlaying && keyboardInsetPx > 48

  const submitButtonStyle = liftSubmitAboveKeyboard
    ? {
        position: 'fixed' as const,
        left: 24,
        right: 24,
        bottom: keyboardInsetPx + 12,
        height: 60,
        maxWidth: 333,
        marginLeft: 'auto',
        marginRight: 'auto',
        zIndex: 60,
        transition: 'bottom 0.18s ease-out',
      }
    : figmaRectStyle(BODY_TEXT_C_SUBMIT_BTN)

  const resetQuestionState = () => {
    setTypedLetters('')
    typedLettersRef.current = ''
    setEditableTyped('')
    editableTypedRef.current = ''
    setLockedMask(null)
    setRetryUsed(false)
    setResult('playing')
    setKeyboardHint(null)
  }

  const normalizeTypedLetters = (raw: string, maxLen: number): string => {
    let lettersOnly = raw.replace(/[^A-Za-z]/g, '').slice(0, maxLen)
    if (lettersOnly.length > 0 && result !== 'retry') {
      // 첫 시도만 문장 첫 글자 대문자 고정 (재도전은 중간 칸일 수 있음)
      lettersOnly = lettersOnly[0]!.toUpperCase() + lettersOnly.slice(1)
    } else if (lettersOnly.length > 0 && result === 'retry') {
      // 재도전: 입력된 글자 케이스 유지하되 전부 허용
      lettersOnly = lettersOnly
    }
    return lettersOnly
  }

  /**
   * 영문만 반영. 한글 IME 조합 중엔 알파벳이 없어져도 기존 입력을 지우지 않음.
   */
  const handleLetterInput = (raw: string) => {
    const maxLen = result === 'retry' ? unlockedCount : typeableCount
    const hasNonAscii = /[^\x00-\x7F]/.test(raw)
    const lettersOnly = normalizeTypedLetters(raw, maxLen)
    const prev = result === 'retry' ? editableTypedRef.current : typedLettersRef.current

    if (hasNonAscii) {
      setKeyboardHint('영문 키보드로 바꿔 주세요')
      if (lettersOnly.length === 0 && prev.length > 0 && raw.length > 0) {
        if (inputRef.current && inputRef.current.value !== prev) {
          inputRef.current.value = prev
        }
        return
      }
    } else if (raw.length === 0 || lettersOnly.length > 0) {
      setKeyboardHint(null)
    }

    if (result === 'retry') {
      editableTypedRef.current = lettersOnly
      setEditableTyped(lettersOnly)
      return
    }

    typedLettersRef.current = lettersOnly
    setTypedLetters(lettersOnly)
  }

  const handleSubmit = () => {
    if (!isPlaying || !hasAnswer) return

    playTapSfx()

    if (matchesBodyTextCAnswer(reconstructedAnswer, question)) {
      onAnswer?.(answerIdForQuestion(question.id), true)
      playAnswerSfx(true)
      setResult('correct')
      return
    }

    if (!retryUsed) {
      const mask = buildBodyTextCCorrectMask(question.exampleEn, typedLetters)
      playAnswerSfx(false)
      setLockedMask(mask)
      setEditableTyped('')
      editableTypedRef.current = ''
      setRetryUsed(true)
      setResult('retry')
      setKeyboardHint(null)
      return
    }

    onAnswer?.(answerIdForQuestion(question.id), false)
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

  const focusInput = () => {
    if (!isPlaying) return
    inputRef.current?.focus({ preventScroll: true })
  }

  const showRetryComplete = showFeedback && isLastQuestion && isFinalRetrySection
  const inputValue = result === 'retry' ? editableTyped : typedLetters
  const inputMaxLength = result === 'retry' ? unlockedCount : typeableCount

  if (!question) {
    return null
  }

  return (
    <FigmaAssetFrame src={BODY_TEXT_C_ASSET} alt="본문 C" bgClassName="bg-white">
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
          className="pointer-events-none absolute z-[1] bg-white"
          style={figmaRectStyle(BODY_TEXT_C_PASSAGE)}
        />
        <div
          className="pointer-events-none absolute z-[3] flex items-center justify-center px-2 py-1"
          style={figmaRectStyle(BODY_TEXT_C_PASSAGE)}
        >
          {question.promptKo ? (
            <p
              className={`w-full whitespace-normal break-keep ${EXERCISE_PASSAGE_KO_CLASS}`}
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 4,
                overflow: 'hidden',
                overflowWrap: 'anywhere',
                wordBreak: 'keep-all',
              }}
            >
              {question.promptKo}
            </p>
          ) : null}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute rounded-[12px] bg-[#F6F9FD]"
          style={figmaRectStyle(BODY_TEXT_C_SENTENCE_BOX)}
        />
        <form
          id="body-text-c-answer-form"
          className="absolute z-[5] flex cursor-text flex-col overflow-hidden px-4 py-4"
          style={figmaRectStyle(BODY_TEXT_C_SENTENCE_BOX)}
          onSubmit={handleFormSubmit}
          onPointerDown={(event) => {
            if (!isPlaying) return
            if (event.target === inputRef.current) return
            event.preventDefault()
            focusInput()
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none flex min-h-0 flex-1 flex-wrap content-center justify-center gap-x-6 gap-y-3"
          >
            {displayWords.map((word, wordIndex) => (
              <span
                key={`word-${wordIndex}`}
                className={`inline-flex items-center gap-[6px] leading-none ${EXERCISE_OPTION_EN_CLASS}`}
              >
                {word.map((ch, charIndex) => {
                  const isCaret =
                    isPlaying &&
                    inputFocused &&
                    (ch.kind === 'hint' || ch.kind === 'blank' || ch.kind === 'filled') &&
                    ch.typeIndex === caretTypeIndex
                  const isHint = ch.kind === 'hint'
                  const isLocked = ch.kind === 'locked'
                  const isRetryWrongSlot =
                    result === 'retry' &&
                    !isLocked &&
                    (ch.kind === 'hint' || ch.kind === 'blank' || ch.kind === 'filled')
                  const showUnderline =
                    isLocked ||
                    isRetryWrongSlot ||
                    (!isRetryWrongSlot &&
                      (ch.kind === 'hint' || ch.kind === 'blank' || ch.kind === 'filled'))

                  return (
                    <span
                      key={`ch-${wordIndex}-${charIndex}`}
                      className={`relative inline-flex w-[0.85em] flex-col items-center justify-end rounded-sm pb-[2px] ${
                        isRetryWrongSlot
                          ? `${isCaret ? 'bg-[#FECDD3]' : 'bg-[#FEE2E2]'} text-[#DC2626]`
                          : `${displayCharClass(ch)} ${
                              isCaret
                                ? 'bg-[#DCEBFF] text-[#1F242E]'
                                : isLocked
                                  ? 'bg-[#DCFCE7]'
                                  : isHint
                                    ? 'bg-[#E2E8F0]'
                                    : ''
                            }`
                      } ${
                        showUnderline
                          ? isRetryWrongSlot
                            ? 'border-b-2 border-[#DC2626]'
                            : 'border-b-2 border-current'
                          : ''
                      }`}
                    >
                      {ch.kind === 'blank' ? '\u00A0' : displayCharText(ch)}
                      {isCaret ? (
                        <span
                          className={`absolute bottom-[3px] left-1/2 h-[1.05em] w-[2px] -translate-x-1/2 animate-pulse rounded-full ${
                            isRetryWrongSlot ? 'bg-[#DC2626]' : 'bg-[#3C86FF]'
                          }`}
                        />
                      ) : null}
                    </span>
                  )
                })}
              </span>
            ))}
          </div>

          <input
            ref={inputRef}
            type="text"
            lang="en"
            inputMode="text"
            enterKeyHint="done"
            value={inputValue}
            maxLength={inputMaxLength}
            onChange={(event) => handleLetterInput(event.target.value)}
            onCompositionEnd={(event) => {
              handleLetterInput(event.currentTarget.value)
            }}
            onBeforeInput={(event) => {
              const data = event.data
              if (!data) return
              if (/[A-Za-z]/.test(data)) return
              event.preventDefault()
              if (/[^\x00-\x7F]/.test(data)) {
                setKeyboardHint('영문 키보드로 바꿔 주세요')
              }
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            disabled={!isPlaying}
            aria-label="영어 예문 입력"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            autoFocus
            className={`absolute inset-0 z-[6] h-full w-full cursor-text bg-transparent caret-transparent selection:bg-transparent ${EXERCISE_INPUT_EN_CLASS}`}
            style={{
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
            }}
          />
        </form>

        {result === 'retry' ? (
          <p
            className={`absolute left-[6%] top-[56%] z-[8] w-[88%] ${EXERCISE_COACH_LINE_CLASS}`}
          >
            {BODY_TEXT_C_COACH_RETRY}
          </p>
        ) : keyboardHint && isPlaying ? (
          <p className="absolute left-[6%] top-[58%] z-[8] w-[88%] text-center text-[13px] font-semibold text-[#C52B2B]">
            {keyboardHint}
          </p>
        ) : null}

        {hasAnswer && !liftSubmitAboveKeyboard && !showFeedback ? (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-[20px] bg-white"
            style={figmaRectStyle(BODY_TEXT_C_SUBMIT_BTN_MASK)}
          />
        ) : null}

        {!showFeedback ? (
          <button
            type="submit"
            form="body-text-c-answer-form"
            aria-label="제출하기"
            disabled={!hasAnswer || !isPlaying}
            className={`flex items-center justify-center rounded-2xl ${EXERCISE_CTA_CLASS} ${
              liftSubmitAboveKeyboard ? '' : 'absolute'
            } ${
              hasAnswer
                ? 'z-[8] cursor-pointer border border-white bg-[#3C86FF] text-white shadow-[0_-4px_16px_rgba(0,0,0,0.12)]'
                : liftSubmitAboveKeyboard
                  ? 'z-[8] cursor-default border border-transparent bg-[#E4E9F2] text-[#9AA5B5]'
                  : 'cursor-default bg-transparent text-white'
            }`}
            style={submitButtonStyle}
          >
            {(hasAnswer || liftSubmitAboveKeyboard) && '제출하기'}
          </button>
        ) : null}
      </div>

      {showRetryComplete && <RetryWrongCompleteSheet onHome={onRetryFlowHome} />}
      {showFeedback && !showRetryComplete ? (
        <ExerciseContinueButton
          kind={result === 'correct' ? 'correct' : 'wrong'}
          rect={BODY_TEXT_C_SUBMIT_BTN}
          title={result === 'correct' ? '정답입니다.' : '오답입니다.'}
          hint={
            result === 'wrong' ? `예문은 ${question.exampleEn}` : undefined
          }
          onContinue={handleFeedbackContinue}
        />
      ) : null}
    </FigmaAssetFrame>
  )
}
