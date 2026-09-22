import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  OnboardingFigmaFrame,
  OnboardingPhoneShell,
} from '../../components/onboarding/OnboardingFigmaFrame'
import { AgeGateStep, type AgeGateChoice } from '../../components/onboarding/AgeGateStep'
import {
  ParentConsentStep,
  type ParentConsentResult,
} from '../../components/onboarding/ParentConsentStep'
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

type StudentStep = 'terms' | 'age' | 'parent' | 'grade'

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
 * 생년월일도 받지 않는다(Guideline 5.1.1(v)).
 * 만 14세 미만만 학부모 휴대폰 SMS 동의를 받는다(개인정보 보호법).
 */
export function StudentOnboardingScreen() {
  const navigate = useNavigate()

  const [stepIndex, setStepIndex] = useState(0)
  const [terms, setTerms] = useState<TermState>({
    service: false,
    privacy: false,
    marketing: false,
  })
  const [ageChoice, setAgeChoice] = useState<AgeGateChoice | null>(null)
  const [parentConsent, setParentConsent] = useState<ParentConsentResult | null>(
    null,
  )
  const [grade, setGrade] = useState<SettingsMiddleGradeId | null>(null)

  const steps = useMemo((): StudentStep[] => {
    if (ageChoice === 'under14') {
      return ['terms', 'age', 'parent', 'grade']
    }
    return ['terms', 'age', 'grade']
  }, [ageChoice])

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
      : step === 'age'
        ? ageChoice !== null
        : step === 'parent'
          ? parentConsent !== null
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
    const under14 = ageChoice === 'under14'

    void (async () => {
      await upsertStudentProfile({
        displayName,
        grade: gradeLabel,
        isUnder14: under14,
        parentalConsentAt: under14 ? new Date().toISOString() : undefined,
        parentPhoneLast4: under14 ? parentConsent?.phoneLast4 : undefined,
      })
      completeOnboarding(user, { displayName })
      navigate('/student/home', {
        replace: true,
        state: { forceInviteStep: true },
      })
    })()
  }

  const stepAlt =
    step === 'terms'
      ? '약관'
      : step === 'age'
        ? '나이 확인'
        : step === 'parent'
          ? '보호자 동의'
          : '학년'

  if (step === 'age' || step === 'parent') {
    return (
      <OnboardingPhoneShell bgClassName="bg-[#fefefe]">
        {step === 'age' ? (
          <AgeGateStep
            value={ageChoice}
            onChange={(next) => {
              setAgeChoice(next)
              if (next === 'over14') setParentConsent(null)
            }}
            onNext={goNext}
          />
        ) : (
          <ParentConsentStep
            onVerified={(result) => {
              setParentConsent(result)
              setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
            }}
          />
        )}
      </OnboardingPhoneShell>
    )
  }

  return (
    <OnboardingFigmaFrame
      src={ASSETS[step === 'grade' ? 'grade' : 'terms']}
      alt={`학생 회원가입 ${stepAlt}`}
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
