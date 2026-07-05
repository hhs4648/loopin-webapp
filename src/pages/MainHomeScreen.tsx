import { useEffect, useMemo, useRef, useState } from 'react'
import { FigmaAssetFrame } from '../components/FigmaAssetFrame'
import { ClassRoundPillLabel } from '../components/main-home/ClassRoundPillLabel'
import { AssignmentReceivedScreen } from '../components/main-home/AssignmentReceivedScreen'
import { WordMatchScreen } from '../components/word-match/WordMatchScreen'
import { WordQuizScreen } from '../components/word-quiz/WordQuizScreen'
import { WordSpellScreen } from '../components/word-spell/WordSpellScreen'
import { LearningCompleteScreen } from '../components/learning-complete/LearningCompleteScreen'
import { BodyTextAScreen } from '../components/body-text-a/BodyTextAScreen'
import { BodyTextBScreen } from '../components/body-text-b/BodyTextBScreen'
import { BodyTextCScreen } from '../components/body-text-c/BodyTextCScreen'
import { BodyTextCompleteScreen } from '../components/body-text-complete/BodyTextCompleteScreen'
import { GrammarCompleteScreen } from '../components/grammar-complete/GrammarCompleteScreen'
import { GrammarType1Screen } from '../components/grammar-type-1/GrammarType1Screen'
import { GrammarType2Screen } from '../components/grammar-type-2/GrammarType2Screen'
import {
  preloadEnglishWordAudio,
  speakEnglishWord,
  stopEnglishWordAudio,
  WORD_QUIZ_QUESTIONS,
} from '../components/word-quiz/word-quiz'
import { NEXT_BTN } from '../components/onboarding/onboarding-ui'
import { SESSION_SECTION_OFFSETS } from '../components/exercise/session-questions'
import {
  buildRetrySectionSnapshot,
  countSessionCorrect,
  countSessionWrong,
  getFirstRetrySection,
  getNextRetrySectionAfter,
  getWrongGrammarType2Questions,
  isFinalRetrySection as checkIsFinalRetrySection,
  sessionBodyTextAId,
  sessionBodyTextBId,
  sessionBodyTextCId,
  type RetrySection,
  type RetrySectionSnapshot,
  type SessionResults,
} from '../components/exercise/session-results'
import { BODY_TEXT_A_QUESTIONS } from '../components/body-text-a/body-text-a'
import { BODY_TEXT_B_QUESTIONS } from '../components/body-text-b/body-text-b'
import { BODY_TEXT_C_QUESTIONS } from '../components/body-text-c/body-text-c'
import type { RetryWrongExerciseProps } from '../components/exercise/retry-wrong-ui'

const ASSETS = {
  invite: '/assets/main-home-invite-code.svg',
  waiting: '/assets/main-home-invite-entered.svg',
} as const

/** Figma 393×852 — 초대코드 입력 필드 (x=66 y=383 w=262 h=49) */
const INVITE_INPUT =
  'absolute left-[16.79%] top-[44.95%] h-[5.75%] w-[66.67%] rounded-[10px] bg-white px-4 text-base uppercase tracking-wide text-[#1e1e1e] outline-none'

/** Figma 393×852 — 입장하기 버튼 (x=30 y=659 w=333 h=60) */
const INVITE_SUBMIT = NEXT_BTN.replace('top-[86.97%]', 'top-[77.35%]')

const TEST_INVITE_CODE = 'TEST'
const WAITING_MS = 3000

type MainStep =
  | 'invite'
  | 'waiting'
  | 'assignment'
  | 'word-match'
  | 'word-quiz'
  | 'word-spell'
  | 'learning-complete'
  | 'body-text-a'
  | 'body-text-b'
  | 'body-text-c'
  | 'body-text-complete'
  | 'grammar-type-1'
  | 'grammar-type-2'
  | 'grammar-complete'

function sanitizeInviteCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function retrySnapshotKey(snapshot: RetrySectionSnapshot): string {
  switch (snapshot.section) {
    case 'word-match':
      return snapshot.pairIds.join('-')
    case 'word-quiz':
    case 'word-spell':
    case 'body-text-a':
    case 'body-text-b':
    case 'body-text-c':
    case 'grammar-type-1':
    case 'grammar-type-2':
      return snapshot.questions.map((question) => question.id).join('-')
  }
}

export function MainHomeScreen() {
  const [step, setStep] = useState<MainStep>('invite')
  const [inviteCode, setInviteCode] = useState('')
  const [skipQuizInitialSpeak, setSkipQuizInitialSpeak] = useState(false)
  const [sessionResults, setSessionResults] = useState<SessionResults>({})
  const [retryWrongOnly, setRetryWrongOnly] = useState(false)
  const [retrySnapshot, setRetrySnapshot] = useState<RetrySectionSnapshot | null>(null)
  const [isFinalRetrySection, setIsFinalRetrySection] = useState(false)
  const [round1MissionCompleted, setRound1MissionCompleted] = useState(false)
  const prevStepRef = useRef<MainStep>(step)
  const sessionResultsRef = useRef(sessionResults)

  useEffect(() => {
    sessionResultsRef.current = sessionResults
  }, [sessionResults])

  const sessionCorrectCount = useMemo(
    () => countSessionCorrect(sessionResults),
    [sessionResults],
  )

  const sessionWrongCount = useMemo(
    () => countSessionWrong(sessionResults),
    [sessionResults],
  )

  const bodyTextCorrectCount = useMemo(() => {
    const ids = [
      ...BODY_TEXT_A_QUESTIONS.map((question) => sessionBodyTextAId(question.id)),
      ...BODY_TEXT_B_QUESTIONS.map((question) => sessionBodyTextBId(question.id)),
      ...BODY_TEXT_C_QUESTIONS.map((question) => sessionBodyTextCId(question.id)),
    ]
    return ids.filter((id) => sessionResults[id] === true).length
  }, [sessionResults])

  const handleSessionAnswer = (stepId: string, isCorrect: boolean) => {
    setSessionResults((prev) => {
      const next = { ...prev, [stepId]: isCorrect }
      sessionResultsRef.current = next
      return next
    })
  }

  const resetFullSession = () => {
    setSessionResults({})
    sessionResultsRef.current = {}
    setRetryWrongOnly(false)
    setRetrySnapshot(null)
    setIsFinalRetrySection(false)
    setRound1MissionCompleted(false)
  }

  const handleRetryFlowHome = () => {
    setRound1MissionCompleted(true)
    setRetryWrongOnly(false)
    setRetrySnapshot(null)
    setIsFinalRetrySection(false)
    setStep('assignment')
  }

  const beginRetrySection = (
    section: RetrySection | 'grammar-complete',
    results: SessionResults,
  ) => {
    if (section === 'grammar-complete') {
      setRetryWrongOnly(false)
      setRetrySnapshot(null)
      setIsFinalRetrySection(false)
      setStep('grammar-complete')
      return
    }

    setRetrySnapshot(buildRetrySectionSnapshot(section, results))
    setIsFinalRetrySection(checkIsFinalRetrySection(section, results))
    setStep(section)
  }

  const advanceAfterRetrySection = (completedSection: RetrySection) => {
    const next = getNextRetrySectionAfter(
      completedSection,
      sessionResultsRef.current,
    )
    beginRetrySection(next, sessionResultsRef.current)
  }

  const handleGrammarType1Complete = () => {
    if (retryWrongOnly) {
      const type2Wrong = getWrongGrammarType2Questions(sessionResultsRef.current)
      if (type2Wrong.length > 0) {
        beginRetrySection('grammar-type-2', sessionResultsRef.current)
        return
      }
      advanceAfterRetrySection('grammar-type-1')
      return
    }

    setStep('grammar-type-2')
  }

  const handleRetryAll = () => {
    resetFullSession()
    setStep('word-match')
  }

  const handleRetryWrongOnly = () => {
    const firstSection = getFirstRetrySection(sessionResults)
    if (!firstSection) return

    setRetryWrongOnly(true)
    beginRetrySection(firstSection, sessionResults)
  }

  const handleGoHome = (options?: { markRound1Complete?: boolean }) => {
    resetFullSession()
    if (options?.markRound1Complete) {
      setRound1MissionCompleted(true)
    }
    setStep('assignment')
  }

  const retryExerciseProps: RetryWrongExerciseProps = retryWrongOnly
    ? {
        hideProgressBar: true,
        isFinalRetrySection,
        onRetryFlowHome: handleRetryFlowHome,
      }
    : {}

  useEffect(() => {
    if (step !== 'waiting') return
    const timer = window.setTimeout(() => setStep('assignment'), WAITING_MS)
    return () => window.clearTimeout(timer)
  }, [step])

  useEffect(() => {
    if (step !== 'word-match') return
    void preloadEnglishWordAudio()
  }, [step])

  useEffect(() => {
    const prevStep = prevStepRef.current
    prevStepRef.current = step

    if (prevStep === 'word-quiz' && step !== 'word-quiz') {
      stopEnglishWordAudio()
      setSkipQuizInitialSpeak(false)
    }
  }, [step])

  const tryEnter = () => {
    if (inviteCode !== TEST_INVITE_CODE) return
    setStep('waiting')
  }

  if (step === 'waiting') {
    return (
      <FigmaAssetFrame
        src={ASSETS.waiting}
        alt="초대코드 입력 후 메인 화면"
        bgClassName="bg-[#E2F7FF]"
      >
        <ClassRoundPillLabel surface="dimmed" />
      </FigmaAssetFrame>
    )
  }

  if (step === 'grammar-complete') {
    return (
      <GrammarCompleteScreen
        correctCount={sessionCorrectCount}
        wrongCount={sessionWrongCount}
        onRetryAll={handleRetryAll}
        onRetryWrongOnly={handleRetryWrongOnly}
        onHome={() => handleGoHome({ markRound1Complete: true })}
      />
    )
  }

  if (step === 'grammar-type-2') {
    const retryQuestions =
      retrySnapshot?.section === 'grammar-type-2' ? retrySnapshot.questions : undefined

    return (
      <GrammarType2Screen
        key={retryWrongOnly && retrySnapshot ? `retry-g2-${retrySnapshotKey(retrySnapshot)}` : 'all'}
        sessionOffset={SESSION_SECTION_OFFSETS.grammarType2}
        questions={retryWrongOnly ? retryQuestions : undefined}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('grammar-type-2')
            return
          }
          setStep('grammar-complete')
        }}
      />
    )
  }

  if (step === 'grammar-type-1') {
    const retryQuestions =
      retrySnapshot?.section === 'grammar-type-1' ? retrySnapshot.questions : undefined

    return (
      <GrammarType1Screen
        key={retryWrongOnly && retrySnapshot ? `retry-g1-${retrySnapshotKey(retrySnapshot)}` : 'all'}
        sessionOffset={SESSION_SECTION_OFFSETS.grammarType1}
        questions={retryWrongOnly ? retryQuestions : undefined}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={handleGrammarType1Complete}
      />
    )
  }

  if (step === 'body-text-complete') {
    return (
      <BodyTextCompleteScreen
        correctCount={bodyTextCorrectCount}
        onContinue={() => setStep('grammar-type-1')}
      />
    )
  }

  if (step === 'body-text-c') {
    const retryQuestions =
      retrySnapshot?.section === 'body-text-c' ? retrySnapshot.questions : undefined

    return (
      <BodyTextCScreen
        key={retryWrongOnly && retrySnapshot ? `retry-c-${retrySnapshotKey(retrySnapshot)}` : 'all'}
        sessionOffset={SESSION_SECTION_OFFSETS.bodyTextC}
        questions={retryWrongOnly ? retryQuestions : undefined}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('body-text-c')
            return
          }
          setStep('body-text-complete')
        }}
      />
    )
  }

  if (step === 'body-text-b') {
    const retryQuestions =
      retrySnapshot?.section === 'body-text-b' ? retrySnapshot.questions : undefined

    return (
      <BodyTextBScreen
        key={retryWrongOnly && retrySnapshot ? `retry-b-${retrySnapshotKey(retrySnapshot)}` : 'all'}
        sessionOffset={SESSION_SECTION_OFFSETS.bodyTextB}
        questions={retryWrongOnly ? retryQuestions : undefined}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('body-text-b')
            return
          }
          setStep('body-text-c')
        }}
      />
    )
  }

  if (step === 'body-text-a') {
    const retryQuestions =
      retrySnapshot?.section === 'body-text-a' ? retrySnapshot.questions : undefined

    return (
      <BodyTextAScreen
        key={retryWrongOnly && retrySnapshot ? `retry-a-${retrySnapshotKey(retrySnapshot)}` : 'all'}
        sessionOffset={SESSION_SECTION_OFFSETS.bodyTextA}
        questions={retryWrongOnly ? retryQuestions : undefined}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('body-text-a')
            return
          }
          setStep('body-text-b')
        }}
      />
    )
  }

  if (step === 'learning-complete') {
    return (
      <LearningCompleteScreen
        onContinue={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('word-spell')
            return
          }
          setStep('body-text-a')
        }}
      />
    )
  }

  if (step === 'word-spell') {
    const retryQuestions =
      retrySnapshot?.section === 'word-spell' ? retrySnapshot.questions : undefined

    return (
      <WordSpellScreen
        key={retryWrongOnly && retrySnapshot ? `retry-spell-${retrySnapshotKey(retrySnapshot)}` : 'all'}
        sessionOffset={SESSION_SECTION_OFFSETS.wordSpell}
        questions={retryWrongOnly ? retryQuestions : undefined}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('word-spell')
            return
          }
          setStep('learning-complete')
        }}
      />
    )
  }

  if (step === 'word-quiz') {
    const retryQuestions =
      retrySnapshot?.section === 'word-quiz' ? retrySnapshot.questions : undefined

    return (
      <WordQuizScreen
        key={retryWrongOnly && retrySnapshot ? `retry-quiz-${retrySnapshotKey(retrySnapshot)}` : 'all'}
        sessionOffset={SESSION_SECTION_OFFSETS.wordQuiz}
        questions={retryWrongOnly ? retryQuestions : undefined}
        onAnswer={handleSessionAnswer}
        skipInitialSpeak={skipQuizInitialSpeak}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('word-quiz')
            return
          }
          setStep('word-spell')
        }}
      />
    )
  }

  if (step === 'word-match') {
    const retryPairIds =
      retrySnapshot?.section === 'word-match' ? retrySnapshot.pairIds : undefined

    return (
      <WordMatchScreen
        key={retryWrongOnly && retrySnapshot ? `retry-match-${retrySnapshotKey(retrySnapshot)}` : 'all'}
        sessionOffset={SESSION_SECTION_OFFSETS.wordMatch}
        retryPairIds={retryWrongOnly ? retryPairIds : undefined}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('word-match')
            return
          }

          speakEnglishWord(WORD_QUIZ_QUESTIONS[0].word, { force: true })
          setSkipQuizInitialSpeak(true)
          setStep('word-quiz')
        }}
      />
    )
  }

  if (step === 'assignment') {
    return (
      <AssignmentReceivedScreen
        star1Completed={round1MissionCompleted}
        onOpenWordMatch={() => setStep('word-match')}
      />
    )
  }

  return (
    <FigmaAssetFrame src={ASSETS.invite} alt="메인 화면" bgClassName="bg-[#E2F7FF]">
      <ClassRoundPillLabel surface="dimmed" />
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-label="초대코드"
        placeholder=""
        value={inviteCode}
        onChange={(e) => setInviteCode(sanitizeInviteCode(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') tryEnter()
        }}
        className={INVITE_INPUT}
      />
      <button
        type="button"
        aria-label="입장하기"
        className={`${INVITE_SUBMIT} cursor-pointer bg-transparent`}
        onClick={tryEnter}
      />
    </FigmaAssetFrame>
  )
}
