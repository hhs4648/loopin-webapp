import { useCurrentBackNavigation } from '../navigation/BackNavigationProvider'
import {
  BACK_BUTTON_HIT,
  BACK_CHEVRON,
  BACK_CHEVRON_COLOR,
} from '../navigation/figma-navigation'
import {
  ONBOARDING_BACK_HIT,
  onboardingNavRectStyle,
} from './onboarding-chrome'

/** 온보딩도 공통 뒤로가기와 같은 획·색을 쓴다(가시성 통일). */
function BackChevronIcon() {
  const cx = BACK_BUTTON_HIT.w / 2
  const cy = BACK_BUTTON_HIT.h / 2
  const halfW = BACK_CHEVRON.w / 2
  const halfH = BACK_CHEVRON.h / 2

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${BACK_BUTTON_HIT.w} ${BACK_BUTTON_HIT.h}`}
      className="h-full w-full"
      fill="none"
    >
      <path
        d={`M${cx + halfW} ${cy - halfH}L${cx - halfW} ${cy}L${cx + halfW} ${cy + halfH}`}
        stroke={BACK_CHEVRON_COLOR}
        strokeWidth={BACK_CHEVRON.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** 온보딩 공통 — 뒤로가기 (모든 온보딩 화면 동일 좌표 = `BACK_BUTTON_HIT`) */
export function OnboardingChrome() {
  const { visible, onBack } = useCurrentBackNavigation()

  return (
    <>
      {visible ? (
        <button
          type="button"
          aria-label="뒤로가기"
          className="absolute z-[20] cursor-pointer bg-transparent p-0"
          style={onboardingNavRectStyle(ONBOARDING_BACK_HIT)}
          onClick={onBack}
        >
          <BackChevronIcon />
        </button>
      ) : null}
    </>
  )
}
