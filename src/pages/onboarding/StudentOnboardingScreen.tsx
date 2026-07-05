import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FigmaAssetFrame } from '../../components/FigmaAssetFrame'
import { BirthdatePicker } from '../../components/onboarding/BirthdatePicker'
import {
  CircleCheckbox,
  INPUT_FIELD,
  NEXT_BTN,
  NextStepButton,
  TermsStep,
  type TermId,
  type TermState,
} from '../../components/onboarding/onboarding-ui'
import {
  completeOnboarding,
  getPostAuthPath,
  getStoredAuth,
} from '../../lib/auth'

const STUDENT_ONBOARDING_ASSETS = [
  '/assets/onboarding-teacher-01-terms.svg',
  '/assets/onboarding-teacher-02-school.svg',
  '/assets/onboarding-student-03-birthdate.svg',
  '/assets/onboarding-student-04-grade.svg',
  '/assets/onboarding-student-05-complete.svg',
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
        ? studentName.trim().length > 0
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
    setStep((prev) => prev + 1)
  }

  const finishOnboarding = () => {
    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    completeOnboarding(user)
    navigate('/student/home', { replace: true })
  }

  const asset = STUDENT_ONBOARDING_ASSETS[step]

  return (
    <FigmaAssetFrame
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
            onChange={(e) => setStudentName(e.target.value)}
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

      {step === 4 && (
        <button
          type="button"
          aria-label="시작하기"
          className={`${NEXT_BTN} cursor-pointer bg-transparent`}
          onClick={finishOnboarding}
        />
      )}
    </FigmaAssetFrame>
  )
}

function TERM_ROWS_REQUIRED(terms: TermState): boolean {
  return terms.service && terms.privacy
}
