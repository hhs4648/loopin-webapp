import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingFigmaFrame } from '../../components/onboarding/OnboardingFigmaFrame'
import { useBackNavigation } from '../../components/navigation/BackNavigationProvider'
import {
  CircleCheckbox,
  NextStepButton,
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
import { resolveOnboardingDisplayName } from '../../lib/sync/social-display-name'
import {
  SETTINGS_GRADE_OPTIONS,
  type SettingsMiddleGradeId,
} from '../../components/settings/settings'
import { upsertStudentProfile } from '../../lib/sync/student-api'

const ASSETS = {
  terms: '/assets/onboarding-teacher-01-terms.svg?v=2',
  grade: '/assets/onboarding-student-04-grade.svg?v=2',
} as const

type StudentStep = keyof typeof ASSETS

/**
 * 시안(`onboarding-student-04-grade.svg`) 문구: 1학년 / 2학년 / 3학년.
 * 저장값은 설정 「학년 변경」과 동일하게 `중학교 n학년` (`SETTINGS_GRADE_OPTIONS`).
 */
const GRADE_ROWS: ReadonlyArray<{
  id: SettingsMiddleGradeId
  cx: number
  cy: number
  label: string
}> = [
  { id: '1', cx: 32, cy: 244, label: '1학년' },
  { id: '2', cx: 32, cy: 318, label: '2학년' },
  { id: '3', cx: 32, cy: 392, label: '3학년' },
]

/**
 * 학생 온보딩.
 *
 * 이름은 받지 않는다(Guideline 4). 소셜이 준 값 → 없으면 `학생`.
 * 생년월일도 받지 않는다(Guideline 5.1.1(v) — 핵심 기능에 불필요).
 * 나중에 설정에서 이름을 바꿀 수 있다.
 */
export function StudentOnboardingScreen() {
  const navigate = useNavigate()

  const steps = useMemo((): StudentStep[] => ['terms', 'grade'], [])

  const [stepIndex, setStepIndex] = useState(0)
  const [terms, setTerms] = useState<TermState>({
    service: false,
    privacy: false,
    marketing: false,
  })
  const [grade, setGrade] = useState<SettingsMiddleGradeId | null>(null)

  const step = steps[stepIndex] ?? 'terms'

  useBackNavigation(() => {
    if (stepIndex > 0) {
      setStepIndex((current) => current - 1)
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

  const canProceed =
    step === 'terms'
      ? terms.service && terms.privacy
      : step === 'grade'
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
    if (stepIndex >= steps.length - 1) {
      finishOnboarding()
      return
    }
    setStepIndex((prev) => prev + 1)
  }

  const finishOnboarding = () => {
    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    const gradeLabel = SETTINGS_GRADE_OPTIONS.find(
      (option) => option.id === grade,
    )?.value

    const displayName = resolveOnboardingDisplayName(user.displayName, '학생')

    void (async () => {
      await upsertStudentProfile({
        displayName,
        grade: gradeLabel,
      })
      completeOnboarding(user, { displayName })
      navigate('/student/home', {
        replace: true,
        state: { forceInviteStep: true },
      })
    })()
  }

  return (
    <OnboardingFigmaFrame
      src={ASSETS[step]}
      alt={`학생 회원가입 ${stepIndex + 1}단계`}
      bgClassName="bg-[#fefefe]"
    >
      {step === 'terms' && (
        <TermsStep
          terms={terms}
          onToggleTerm={toggleTerm}
          onToggleAgreeAll={toggleAgreeAll}
          onNext={goNext}
        />
      )}

      {step === 'grade' && (
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
