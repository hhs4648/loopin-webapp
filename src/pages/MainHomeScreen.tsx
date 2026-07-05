import { useEffect, useRef, useState } from 'react'
import { FigmaAssetFrame } from '../components/FigmaAssetFrame'
import { ClassRoundPillLabel } from '../components/main-home/ClassRoundPillLabel'
import { AssignmentReceivedScreen } from '../components/main-home/AssignmentReceivedScreen'
import { WordMatchScreen } from '../components/word-match/WordMatchScreen'
import { WordQuizScreen } from '../components/word-quiz/WordQuizScreen'
import { WordSpellScreen } from '../components/word-spell/WordSpellScreen'
import {
  preloadEnglishWordAudio,
  speakEnglishWord,
  stopEnglishWordAudio,
  WORD_QUIZ_QUESTIONS,
} from '../components/word-quiz/word-quiz'
import { NEXT_BTN } from '../components/onboarding/onboarding-ui'

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

type MainStep = 'invite' | 'waiting' | 'assignment' | 'word-match' | 'word-quiz' | 'word-spell'

function sanitizeInviteCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function MainHomeScreen() {
  const [step, setStep] = useState<MainStep>('invite')
  const [inviteCode, setInviteCode] = useState('')
  const [skipQuizInitialSpeak, setSkipQuizInitialSpeak] = useState(false)
  const prevStepRef = useRef<MainStep>(step)

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

  if (step === 'word-spell') {
    return <WordSpellScreen onComplete={() => setStep('assignment')} />
  }

  if (step === 'word-quiz') {
    return (
      <WordQuizScreen
        skipInitialSpeak={skipQuizInitialSpeak}
        onComplete={() => setStep('word-spell')}
      />
    )
  }

  if (step === 'word-match') {
    return (
      <WordMatchScreen
        onComplete={() => {
          speakEnglishWord(WORD_QUIZ_QUESTIONS[0].word, { force: true })
          setSkipQuizInitialSpeak(true)
          setStep('word-quiz')
        }}
      />
    )
  }

  if (step === 'assignment') {
    return <AssignmentReceivedScreen onOpenWordMatch={() => setStep('word-match')} />
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
