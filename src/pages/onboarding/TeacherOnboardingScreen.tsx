import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FigmaAssetFrame } from '../../components/FigmaAssetFrame'
import {
  INPUT_FIELD,
  INPUT_HINT,
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
} from '../../lib/auth'

const TEACHER_ONBOARDING_ASSETS = [
  '/assets/onboarding-teacher-01-terms.svg',
  '/assets/onboarding-teacher-02-school.svg',
  '/assets/onboarding-teacher-03-name.svg',
  '/assets/onboarding-teacher-04-complete.svg',
] as const

/** Figma 393×852 — step 4 상단/하단 버튼 */
const INVITE_BTN = 'absolute left-[7.63%] top-[78%] h-[5.16%] w-[84.73%]'
const HOME_BTN = 'absolute left-[7.63%] top-[86.97%] h-[7.04%] w-[84.73%]'

export function TeacherOnboardingScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [terms, setTerms] = useState<TermState>({
    service: false,
    privacy: false,
    marketing: false,
  })
  const [schoolName, setSchoolName] = useState('')
  const [teacherName, setTeacherName] = useState('')

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
    step === 0
      ? requiredTermsAccepted
      : step === 1
        ? schoolName.trim().length > 0
        : step === 2
          ? teacherName.trim().length > 0
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
    completeOnboarding(user)
    navigate('/teacher/home', { replace: true })
  }

  const asset = TEACHER_ONBOARDING_ASSETS[step]

  return (
    <FigmaAssetFrame
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
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
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
            value={teacherName}
            onChange={(e) =>
              setTeacherName(sanitizeSchoolNameInput(e.target.value))
            }
            className={INPUT_FIELD}
          />
          <p className={INPUT_HINT} aria-live="polite">
            특수문자는 허용되지 않아요
          </p>
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
    </FigmaAssetFrame>
  )
}
