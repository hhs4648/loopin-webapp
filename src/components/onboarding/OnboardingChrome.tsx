import { useCurrentBackNavigation } from '../navigation/BackNavigationProvider'
import {
  ONBOARDING_BACK_HIT,
  onboardingNavRectStyle,
} from './onboarding-chrome'

function BackChevronIcon() {
  return (
    <svg
      aria-hidden
      width="12"
      height="20"
      viewBox="0 0 12 20"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M10 1.5L2 10L10 18.5"
        stroke="#A0AEB9"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** 온보딩 공통 — 상태바 + 뒤로가기 (모든 온보딩 화면 동일 좌표) */
export function OnboardingChrome() {
  const { visible, onBack } = useCurrentBackNavigation()

  return (
    <>
      {visible ? (
        <button
          type="button"
          aria-label="뒤로가기"
          className="absolute z-[20] flex cursor-pointer items-center justify-center bg-transparent"
          style={onboardingNavRectStyle(ONBOARDING_BACK_HIT)}
          onClick={onBack}
        >
          <BackChevronIcon />
        </button>
      ) : null}
    </>
  )
}
