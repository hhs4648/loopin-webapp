import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  onboardingContentXStyle,
  onboardingTitleTopStyle,
} from '../components/onboarding/onboarding-chrome'
import {
  ONBOARDING_BODY_CLASS,
  ONBOARDING_OPTION_LABEL_X,
  ONBOARDING_TEXT,
  ONBOARDING_TITLE_CLASS,
} from '../components/onboarding/onboarding-typography'
import {
  CircleCheckbox,
  NextStepButton,
  figmaAbsRect,
} from '../components/onboarding/onboarding-ui'
import { OnboardingPhoneShell } from '../components/onboarding/OnboardingFigmaFrame'
import { useBackNavigation } from '../components/navigation/BackNavigationProvider'
import {
  completeMemberType,
  getPostAuthPath,
  getStoredAuth,
  type MemberType,
} from '../lib/auth'

/**
 * Figma 에셋이 없는 화면이라 좌표를 직접 잡는다.
 * 값은 `온보딩_학년선택`(`onboarding-student-04-grade.svg`)과 동일 —
 * 선택 원 cx=32, 첫 행 cy=244, 행 간격 74.
 */
const MEMBER_TYPE_ROWS: { id: MemberType; cy: number; label: string }[] = [
  { id: 'student', cy: 244, label: '학생' },
  { id: 'teacher', cy: 318, label: '선생님 (학교)' },
]

const OPTION_ROW_H = 24

export function MemberTypeScreen() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<MemberType | null>(null)

  useBackNavigation(() => navigate('/login'))

  useEffect(() => {
    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.memberType) {
      navigate(getPostAuthPath(user), { replace: true })
    }
  }, [navigate])

  const handleNext = () => {
    if (!selected) return

    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    completeMemberType(user, selected)

    navigate(
      selected === 'student'
        ? '/onboarding/student'
        : '/onboarding/teacher',
    )
  }

  return (
    <OnboardingPhoneShell bgClassName="bg-white">
      <header
        style={{ ...onboardingTitleTopStyle(), ...onboardingContentXStyle() }}
      >
        <h1 className={ONBOARDING_TITLE_CLASS}>회원 유형을 선택해주세요</h1>
      </header>

      <div role="radiogroup" aria-label="회원 유형">
        {MEMBER_TYPE_ROWS.map((row) => (
          <div key={row.id}>
            <CircleCheckbox
              checked={selected === row.id}
              cx={32}
              cy={row.cy}
              label={row.label}
              hasBakedRing={false}
              onToggle={() => setSelected(row.id)}
            />
            <button
              type="button"
              role="radio"
              aria-checked={selected === row.id}
              className={`absolute z-[2] flex items-center bg-transparent p-0 text-left ${ONBOARDING_BODY_CLASS} ${ONBOARDING_TEXT}`}
              style={figmaAbsRect({
                x: ONBOARDING_OPTION_LABEL_X,
                y: row.cy - OPTION_ROW_H / 2,
                w: 330 - ONBOARDING_OPTION_LABEL_X,
                h: OPTION_ROW_H,
              })}
              onClick={() => setSelected(row.id)}
            >
              {row.label}
            </button>
          </div>
        ))}
      </div>

      <NextStepButton
        enabled={selected !== null}
        onClick={handleNext}
        hasBakedButton={false}
      />
    </OnboardingPhoneShell>
  )
}
