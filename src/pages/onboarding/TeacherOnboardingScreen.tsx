import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingFigmaFrame } from '../../components/onboarding/OnboardingFigmaFrame'
import { useBackNavigation } from '../../components/navigation/BackNavigationProvider'
import {
  INPUT_FIELD,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NEXT_BTN,
  NextStepButton,
  TermsStep,
  sanitizeNameInput,
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

const TEACHER_ONBOARDING_ASSETS = [
  '/assets/onboarding-teacher-01-terms.svg?v=2',
  '/assets/onboarding-teacher-02-school.svg?v=2',
  '/assets/onboarding-teacher-03-name.svg?v=2',
  '/assets/onboarding-teacher-04-complete.svg?v=3',
] as const

/**
 * Figma 393×852 — step 4 상단/하단 버튼.
 * 시안의 두 버튼은 하단 CTA와 **같은 크기**(x=30 w=333 h=60 r=16)이고 y만 다르다.
 * (`onboarding-teacher-04-complete.svg`: y=665 / y=741)
 */
const INVITE_BTN = NEXT_BTN.replace('top-[86.97%]', 'top-[78.05%]')
const HOME_BTN = NEXT_BTN

export function TeacherOnboardingScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [terms, setTerms] = useState<TermState>({
    service: false,
    privacy: false,
    marketing: false,
  })
  // step 1 = 이름(`onboarding-teacher-02-school.svg` — 파일명과 달리 "이름을 적어주세요" 화면)
  // step 2 = 학교명(`onboarding-teacher-03-name.svg` — 파일명과 달리 "학교명을 적어주세요" 화면)
  const [teacherName, setTeacherName] = useState('')
  const [schoolName, setSchoolName] = useState('')

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

  // 이름 화면 SVG에 "2 ~ 5자 이내여야 하고 특수문자는 허용되지 않아요"가 그려져 있음
  const canProceed =
    step === 0
      ? requiredTermsAccepted
      : step === 1
        ? teacherName.trim().length >= NAME_MIN_LENGTH
        : step === 2
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
    setStep((prev) => prev + 1)
  }

  const finishOnboarding = () => {
    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    completeOnboarding(user, {
      displayName: teacherName,
      schoolName,
    })
    navigate('/teacher/home', { replace: true })
  }

  const asset = TEACHER_ONBOARDING_ASSETS[step]

  return (
    <OnboardingFigmaFrame
      src={asset}
      alt={`선생님 회원가입 ${step + 1}단계`}
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
            value={teacherName}
            maxLength={NAME_MAX_LENGTH}
            onChange={(e) => setTeacherName(sanitizeNameInput(e.target.value))}
            className={INPUT_FIELD}
          />
          <NextStepButton enabled={canProceed} onClick={goNext} />
        </>
      )}

      {step === 2 && (
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

      {step === 3 && (
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
