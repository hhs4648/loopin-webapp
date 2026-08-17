import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingFigmaFrame } from '../../components/onboarding/OnboardingFigmaFrame'
import { useBackNavigation } from '../../components/navigation/BackNavigationProvider'
import { BirthdatePicker } from '../../components/onboarding/BirthdatePicker'
import {
  CircleCheckbox,
  INPUT_FIELD,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NextStepButton,
  sanitizeNameInput,
  TermsStep,
  type TermId,
  type TermState,
} from '../../components/onboarding/onboarding-ui'
import {
  completeOnboarding,
  getPostAuthPath,
  getStoredAuth,
  resetMemberType,
} from '../../lib/auth'
import { upsertStudentProfile } from '../../lib/sync/student-api'

const STUDENT_ONBOARDING_ASSETS = [
  '/assets/onboarding-teacher-01-terms.svg?v=2',
  '/assets/onboarding-teacher-02-school.svg?v=2',
  '/assets/onboarding-student-03-birthdate.svg?v=2',
  '/assets/onboarding-student-04-grade.svg?v=2',
] as const

const GRADE_ROWS = [
  { id: 'elementary', cx: 32, cy: 244, label: '초등학생' },
  { id: 'middle', cx: 32, cy: 318, label: '중학생' },
  { id: 'high', cx: 32, cy: 392, label: '고등학생' },
] as const

type GradeId = (typeof GRADE_ROWS)[number]['id']

export function StudentOnboardingScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [terms, setTerms] = useState<TermState>({
    service: false,
    privacy: false,
    marketing: false,
  })
  const [studentName, setStudentName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [grade, setGrade] = useState<GradeId | null>(null)

  useBackNavigation(() => {
    if (step > 0) {
      setStep((current) => current - 1)
      return
    }

    const user = getStoredAuth()
    if (user) resetMemberType(user)
    navigate('/onboarding/member-type', { replace: true })
  })

  useEffect(() => {
    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.memberType && user.memberType !== 'student') {
      navigate('/onboarding/teacher', { replace: true })
      return
    }
    if (user.onboardingCompleted) {
      navigate(getPostAuthPath(user), { replace: true })
    }
  }, [navigate])

  const birthdateComplete =
    birthYear.length > 0 && birthMonth.length > 0 && birthDay.length > 0

  const canProceed =
    step === 0
      ? TERM_ROWS_REQUIRED(terms)
      : step === 1
        ? studentName.trim().length >= NAME_MIN_LENGTH
        : step === 2
          ? birthdateComplete
          : step === 3
            ? grade !== null
            : false

  const toggleTerm = (id: TermId) => {
    setTerms((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleAgreeAll = () => {
    const allChecked = Object.values(terms).every(Boolean)
    const next = !allChecked
    setTerms({
      service: next,
      privacy: next,
      marketing: next,
    })
  }

  const goNext = () => {
    if (!canProceed) return
    // 학년(마지막 단계) → 온보딩 완료. 학습목적 선택 화면은 제거됨(2026-08-11)
    if (step === 3) {
      finishOnboarding()
      return
    }
    setStep((prev) => prev + 1)
  }

  const finishOnboarding = () => {
    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    const birthdate =
      birthYear && birthMonth && birthDay
        ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
        : undefined
    const gradeLabel =
      grade === 'elementary'
        ? '초등'
        : grade === 'middle'
          ? '중등'
          : grade === 'high'
            ? '고등'
            : undefined

    void (async () => {
      await upsertStudentProfile({
        displayName: studentName.trim() || '학생',
        grade: gradeLabel,
        birthdate,
      })
      completeOnboarding(user, {
        displayName: studentName.trim() || '학생',
      })
      // 학습목적 분기 없음 — 학원/학교 메인(초대코드)으로 통일
      navigate('/student/home', {
        replace: true,
        state: { forceInviteStep: true },
      })
    })()
  }

  const asset = STUDENT_ONBOARDING_ASSETS[step]

  return (
    <OnboardingFigmaFrame
      src={asset}
      alt={`학생 회원가입 ${step + 1}단계`}
      bgClassName="bg-[#fefefe]"
    >
      {step === 0 && (
        <TermsStep
          terms={terms}
          onToggleTerm={toggleTerm}
          onToggleAgreeAll={toggleAgreeAll}
          onNext={goNext}
        />
      )}

      {step === 1 && (
        <>
          <input
            type="text"
            aria-label="이름"
            placeholder="이름을 입력해주세요"
            value={studentName}
            maxLength={NAME_MAX_LENGTH}
            onChange={(e) => setStudentName(sanitizeNameInput(e.target.value))}
            className={INPUT_FIELD}
          />
          <NextStepButton enabled={canProceed} onClick={goNext} />
        </>
      )}

      {step === 2 && (
        <>
          <BirthdatePicker
            birthYear={birthYear}
            birthMonth={birthMonth}
            birthDay={birthDay}
            onChangeYear={setBirthYear}
            onChangeMonth={setBirthMonth}
            onChangeDay={setBirthDay}
          />
          <NextStepButton enabled={canProceed} onClick={goNext} />
        </>
      )}

      {step === 3 && (
        <>
          {GRADE_ROWS.map((row) => (
            <CircleCheckbox
              key={row.id}
              checked={grade === row.id}
              cx={row.cx}
              cy={row.cy}
              label={row.label}
              onToggle={() => setGrade(row.id)}
            />
          ))}
          <NextStepButton enabled={canProceed} onClick={goNext} />
        </>
      )}
    </OnboardingFigmaFrame>
  )
}

function TERM_ROWS_REQUIRED(terms: TermState): boolean {
  return terms.service && terms.privacy
}
