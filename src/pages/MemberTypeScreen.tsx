import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ONBOARDING_OPTION_CLASS,
  ONBOARDING_TITLE_CLASS,
  onboardingTitleTopStyle,
} from '../components/onboarding/onboarding-chrome'
import { OnboardingPhoneShell } from '../components/onboarding/OnboardingFigmaFrame'
import { useBackNavigation } from '../components/navigation/BackNavigationProvider'
import {
  completeMemberType,
  getPostAuthPath,
  getStoredAuth,
  type MemberType,
} from '../lib/auth'

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
      <div
        className="flex min-h-0 flex-1 flex-col px-6"
        style={onboardingTitleTopStyle()}
      >
        <header>
          <h1 className={ONBOARDING_TITLE_CLASS}>회원 유형을 선택해주세요</h1>
        </header>

        <div
          className="mt-10 flex flex-col gap-7"
          role="radiogroup"
          aria-label="회원 유형"
        >
          <button
            type="button"
            role="radio"
            aria-checked={selected === 'student'}
            className={`flex w-full items-center gap-3 bg-transparent p-0 text-left ${ONBOARDING_OPTION_CLASS} ${
              selected === 'student' ? '' : ''
            }`}
            onClick={() => setSelected('student')}
          >
            <span
              className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 ${
                selected === 'student'
                  ? 'border-[#2AA3FF]'
                  : 'border-[#D9D9D9]'
              }`}
            >
              <span
                className={`h-[10px] w-[10px] rounded-full bg-[#2AA3FF] transition-opacity ${
                  selected === 'student' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </span>
            학생
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={selected === 'teacher'}
            className={`flex w-full items-center gap-3 bg-transparent p-0 text-left ${ONBOARDING_OPTION_CLASS}`}
            onClick={() => setSelected('teacher')}
          >
            <span
              className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 ${
                selected === 'teacher'
                  ? 'border-[#2AA3FF]'
                  : 'border-[#D9D9D9]'
              }`}
            >
              <span
                className={`h-[10px] w-[10px] rounded-full bg-[#2AA3FF] transition-opacity ${
                  selected === 'teacher' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </span>
            선생님 (학교)
          </button>
        </div>

        <footer className="mt-auto pb-6 pt-6">
          <button
            type="button"
            className="flex h-[52px] w-full items-center justify-center rounded-[10px] bg-[#2AA3FF] font-['Pretendard',sans-serif] text-[16px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#C4C4C4]"
            disabled={!selected}
            onClick={handleNext}
          >
            다음
          </button>
        </footer>
      </div>
    </OnboardingPhoneShell>
  )
}
