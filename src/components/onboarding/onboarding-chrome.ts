import { FRAME_H, FRAME_W } from './onboarding-ui'

/** Figma 온보딩 SVG 상단 — 상태바·뒤로가기가 구워진 영역 높이 */
export const ONBOARDING_HEADER_MASK_H = 98

/** React 상태바(`IphoneStatusBar`) 높이 */
export const ONBOARDING_STATUS_H = 53

/** 본문(제목·옵션) 시작 y — Figma 시안과 맞춤 */
export const ONBOARDING_CONTENT_TOP = 98

/** 제목 첫 줄 y — Figma 온보딩 약관 화면 기준 */
export const ONBOARDING_TITLE_TOP = 111

/** Figma 393×852 — 뒤로가기 히트 (M45.5 81.5 근처) */
export const ONBOARDING_BACK_HIT = { x: 6, y: 70, w: 44, h: 40 }

/** Figma 온보딩 상단 제목 — Pretendard Bold 24 */
export const ONBOARDING_TITLE_CLASS =
  "font-['Pretendard',sans-serif] text-[24px] font-bold leading-[1.4] tracking-[-0.03em] text-[#1E1E1E]"

export const ONBOARDING_TERM_LABEL_CLASS =
  "font-['Pretendard',sans-serif] text-[16px] font-medium leading-none tracking-[-0.02em] text-[#1E1E1E]"

export const ONBOARDING_OPTION_CLASS =
  "font-['Pretendard',sans-serif] text-[16px] font-medium leading-none text-[#1E1E1E]"

export function onboardingHeaderMaskStyle() {
  return {
    height: `${(ONBOARDING_HEADER_MASK_H / FRAME_H) * 100}%`,
  }
}

export function onboardingContentTopStyle() {
  // aspect-[393/852] 컨테이너에서 padding-top %는 너비 기준 → FRAME_W로 환산
  return {
    paddingTop: `${(ONBOARDING_CONTENT_TOP / FRAME_W) * 100}%`,
  }
}

export function onboardingTitleTopStyle() {
  return {
    paddingTop: `${(ONBOARDING_TITLE_TOP / FRAME_W) * 100}%`,
  }
}

export function onboardingNavRectStyle(rect: {
  x: number
  y: number
  w: number
  h: number
}) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
