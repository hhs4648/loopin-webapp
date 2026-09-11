import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingFigmaFrame } from '../../components/onboarding/OnboardingFigmaFrame'
import { useBackNavigation } from '../../components/navigation/BackNavigationProvider'
import {
  INPUT_FIELD,
  NEXT_BTN,
  NextStepButton,
  TermsStep,
  sanitizeSchoolNameInput,
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
import { upsertStudentProfile } from '../../lib/sync/student-api'

const ASSETS = {
  terms: '/assets/onboarding-teacher-01-terms.svg?v=2',
  /** 파일명과 달리 「학교명을 적어주세요」 화면 (`onboarding-teacher-03-name.svg`) */
  school: '/assets/onboarding-teacher-03-name.svg?v=2',
  complete: '/assets/onboarding-teacher-04-complete.svg?v=3',
} as const

type TeacherStep = keyof typeof ASSETS

/**
 * Figma 393×852 — step complete 상단/하단 버튼.
 * 시안의 두 버튼은 하단 CTA와 **같은 크기**(x=30 w=333 h=60 r=16)이고 y만 다르다.
 */
const INVITE_BTN = NEXT_BTN.replace('top-[86.97%]', 'top-[78.05%]')
const HOME_BTN = NEXT_BTN

/**
 * 선생님 온보딩 — 학년·이름 입력 없음.
 * 이름은 소셜 값 → 없으면 `선생님`(Guideline 4). 설정에서 변경 가능.
 */
export function TeacherOnboardingScreen() {
  const navigate = useNavigate()

  const steps = useMemo(
    (): TeacherStep[] => ['terms', 'school', 'complete'],
    [],
  )

  const [stepIndex, setStepIndex] = useState(0)
  const [terms, setTerms] = useState<TermState>({
    service: false,
    privacy: false,
    marketing: false,
  })
  const [schoolName, setSchoolName] = useState('')

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
    if (user.memberType && user.memberType !== 'teacher') {
      navigate('/onboarding/student', { replace: true })
      return
    }
    if (user.onboardingCompleted) {
      navigate(getPostAuthPath(user), { replace: true })
    }
  }, [navigate])

  const requiredTermsAccepted = terms.service && terms.privacy
  const allTermsChecked = Object.values(terms).every(Boolean)

  const canProceed =
    step === 'terms'
      ? requiredTermsAccepted
      : step === 'school'
        ? schoolName.trim().length > 0
        : false

  const toggleTerm = (id: TermId) => {
    setTerms((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleAgreeAll = () => {
    const next = !allTermsChecked
    setTerms({
      service: next,
      privacy: next,
      marketing: next,
    })
  }

  const goNext = () => {
    if (!canProceed) return
    setStepIndex((prev) => prev + 1)
  }

  const finishOnboarding = () => {
    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    const displayName = resolveOnboardingDisplayName(user.displayName, '선생님')

    void (async () => {
      // 초대코드 가입 RPC는 profiles.role = student만 받는다.
      // 앱에서 과제를 풀려면 학생 프로필로 올려야 한다.
      await upsertStudentProfile({ displayName })
      completeOnboarding(user, {
        displayName,
        schoolName,
      })
      navigate('/student/home', {
        replace: true,
        state: { forceInviteStep: true },
      })
    })()
  }

  return (
    <OnboardingFigmaFrame
      src={ASSETS[step]}
      alt={`선생님 회원가입 ${stepIndex + 1}단계`}
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

      {step === 'school' && (
        <>
          <input
            type="text"
            aria-label="학교명"
            placeholder="학교명을 입력해주세요"
            value={schoolName}
            onChange={(e) =>
              setSchoolName(sanitizeSchoolNameInput(e.target.value))
            }
            className={INPUT_FIELD}
          />
          <NextStepButton enabled={canProceed} onClick={goNext} />
        </>
      )}

      {step === 'complete' && (
        <>
          <button
            type="button"
            aria-label="학생 초대하기"
            className={`${INVITE_BTN} cursor-pointer bg-transparent`}
            onClick={finishOnboarding}
          />
          <button
            type="button"
            aria-label="홈으로"
            className={`${HOME_BTN} cursor-pointer bg-transparent`}
            onClick={finishOnboarding}
          />
        </>
      )}
    </OnboardingFigmaFrame>
  )
}
