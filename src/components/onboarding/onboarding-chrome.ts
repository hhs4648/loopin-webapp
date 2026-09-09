import { FRAME_H, FRAME_W } from './onboarding-ui'

/** Figma 온보딩 SVG 상단 — 상태바·뒤로가기가 구워진 영역 높이 */
export const ONBOARDING_HEADER_MASK_H = 98

/**
 * 화면 최상단에 비워 두는 높이(53).
 *
 * 프레임 안 시계·아이콘은 그리지 않는다. 여기 숫자는 시안 여백·뒤로가기 위치 계산용이다.
 */
export const ONBOARDING_STATUS_H = 53

/** 본문(제목·옵션) 시작 y — Figma 시안과 맞춤 */
export const ONBOARDING_CONTENT_TOP = 98

/**
 * 제목 텍스트 박스 top — 시안에 구워진 제목과 겹치도록 실측한 값.
 * (24px/32 기준 글자 윗변이 y≈111에 오는 박스 위치. 예전 값 111은 박스 top을
 * 글자 윗변으로 착각한 것이라 제목이 5px 아래로 내려가 있었다.)
 */
export const ONBOARDING_TITLE_TOP = 105

/** 제목·본문 좌측 여백 — 시안 공통 */
export const ONBOARDING_CONTENT_X = 20

/**
 * 뒤로가기 히트 — **공통값을 그대로 쓴다** (`navigation/figma-navigation.ts`).
 * 화면마다 좌표를 따로 두다가 세 갈래로 갈렸던 이력이 있어(2026-08-08 통일) 재정의하지 않는다.
 */
export { BACK_BUTTON_HIT as ONBOARDING_BACK_HIT } from '../navigation/figma-navigation'

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

/** 제목·본문 좌우 여백 — aspect 컨테이너 폭 기준 % */
export function onboardingContentXStyle() {
  return {
    paddingLeft: `${(ONBOARDING_CONTENT_X / FRAME_W) * 100}%`,
    paddingRight: `${(ONBOARDING_CONTENT_X / FRAME_W) * 100}%`,
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
