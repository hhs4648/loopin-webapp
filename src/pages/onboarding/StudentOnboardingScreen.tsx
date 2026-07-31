import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingFigmaFrame } from '../../components/onboarding/OnboardingFigmaFrame'
import { useBackNavigation } from '../../components/navigation/BackNavigationProvider'
import { BirthdatePicker } from '../../components/onboarding/BirthdatePicker'
import {
  CircleCheckbox,
  figmaAbsRect,
  INPUT_FIELD,
  NextStepButton,
  TermsStep,
  type FigmaOnboardingRect,
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
import { isSyncEnabled } from '../../lib/sync/supabase-client'

const STUDENT_ONBOARDING_ASSETS = [
  '/assets/onboarding-teacher-01-terms.svg',
  '/assets/onboarding-teacher-02-school.svg',
  '/assets/onboarding-student-03-birthdate.svg',
  '/assets/onboarding-student-04-grade.svg',
  '/assets/onboarding-student-06-purpose.svg',
] as const

const GRADE_ROWS = [
  { id: 'elementary', cx: 32, cy: 244, label: '초등학생' },
  { id: 'middle', cx: 32, cy: 318, label: '중학생' },
  { id: 'high', cx: 32, cy: 392, label: '고등학생' },
] as const

type GradeId = (typeof GRADE_ROWS)[number]['id']

/** Figma `온보딩_학습목적선택` (node 5669:851) — Card_초대받음 / Card_혼자공부 */
const PURPOSE_OPTIONS: {
  id: LearningPurposeId
  label: string
  rect: FigmaOnboardingRect
}[] = [
  {
    id: 'invited',
    label: '선생님 초대를 받았어요',
    rect: { x: 24, y: 238, w: 345, h: 100 },
  },
  {
    id: 'self-study',
    label: '혼자 공부할래요',
    rect: { x: 24, y: 352, w: 345, h: 100 },
  },
]

type LearningPurposeId = 'invited' | 'self-study'

/** Figma `선택됨` variant — border `#46AFFF` 1.5px + drop shadow */
const PURPOSE_CARD_SELECTED_CLASS =
  'border-[#46AFFF] shadow-[0px_4px_7px_rgba(41,120,250,0.12)]'

/** 선택 후 다음 단계로 넘어가기 전 파란 테두리를 보여주는 시간 */
const PURPOSE_ADVANCE_MS = 300

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
  const [learningPurpose, setLearningPurpose] =
    useState<LearningPurposeId | null>(null)
  const purposeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (purposeTimerRef.current !== null) {
        window.clearTimeout(purposeTimerRef.current)
      }
    }
  }, [])

  useBackNavigation(() => {
    if (step > 0) {
      // 학습목적 선택 대기 중(완료 예약 타이머) 뒤로가기 시 예약된 완료를 취소
      if (purposeTimerRef.current !== null) {
        window.clearTimeout(purposeTimerRef.current)
        purposeTimerRef.current = null
      }
      setLearningPurpose(null)
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

  const selectLearningPurpose = (id: LearningPurposeId) => {
    // 중복 클릭으로 완료가 두 번 실행되지 않게 첫 선택만 반영
    if (learningPurpose) return
    setLearningPurpose(id)
    purposeTimerRef.current = window.setTimeout(() => {
      finishOnboarding(id)
    }, PURPOSE_ADVANCE_MS)
  }

  const finishOnboarding = (purpose: LearningPurposeId) => {
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
      if (isSyncEnabled()) {
        await upsertStudentProfile({
          displayName: studentName.trim() || '학생',
          grade: gradeLabel,
          birthdate,
        })
      } else {
        await upsertStudentProfile({
          displayName: studentName.trim() || '학생',
          grade: gradeLabel,
          birthdate,
        })
      }
      completeOnboarding(user, {
        displayName: studentName.trim() || '학생',
      })
      if (purpose === 'self-study') {
        // 혼자 공부: 교사 초대 없이 스스로 내신 코스를 만드는 커리큘럼 코스 화면으로 이동
        navigate('/student/curriculum', { replace: true })
        return
      }
      navigate('/student/home', {
        replace: true,
        // "선생님 초대를 받았어요"를 선택했으면 기존에 남아있던 활성 클래스와
        // 무관하게 메인 화면에서 초대코드 입력부터 시작하게 한다.
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
            maxLength={5}
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

      {step === 4 &&
        PURPOSE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            aria-pressed={learningPurpose === option.id}
            disabled={learningPurpose !== null}
            className={`absolute rounded-[20px] border-[1.5px] bg-transparent transition-colors ${
              learningPurpose === option.id
                ? PURPOSE_CARD_SELECTED_CLASS
                : 'border-transparent'
            } ${learningPurpose === null ? 'cursor-pointer' : 'cursor-default'}`}
            style={figmaAbsRect(option.rect)}
            onClick={() => selectLearningPurpose(option.id)}
          />
        ))}
    </OnboardingFigmaFrame>
  )
}

function TERM_ROWS_REQUIRED(terms: TermState): boolean {
  return terms.service && terms.privacy
}
