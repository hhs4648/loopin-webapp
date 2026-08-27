/**
 * 연속 학습 캘린더 — Figma `연속학습_캘린더_화면.svg` → `streak-calendar.svg`.
 *
 * 1차는 **시안을 그대로 보여 준다.** 날짜·일수·주간 칸이 SVG에 구워져 있으므로
 * React로 다시 그리면 글자가 두 겹이 된다. 실데이터 오버레이는 후속.
 *
 * 원본은 `_design-source/연속학습_캘린더_화면.svg`.
 */
export const STREAK_CALENDAR_ASSET = '/assets/streak-calendar.svg?v=1'

/**
 * 시안 맨 아래 가짜 홈 인디케이터(검은 막대 y839) + 그 아래 흰 패딩.
 * OS가 그리는 막대와 두 겹이 되고, 안드로이드에는 없는 막대가 보여서 가린다.
 * 구워진 하단 내비(y770~)는 칭찬 캘린더처럼 시각만 남긴다.
 */
export const STREAK_CALENDAR_HOME_INDICATOR_COVER = {
  x: 0,
  y: 827,
  w: 393,
  h: 25,
} as const

/**
 * 시안에 구워진 하단 내비(홈·단어장·복습하기·전체, y≈770~827).
 * 그림이라 눌리지 않아 `MainHomeBottomNav`로 갈아 끼우는데, 시안 쪽이 조금 더
 * 높아서 그냥 덮으면 위아래로 삐져나온다. 먼저 흰색으로 지우고 그 위에 올린다.
 */
export const STREAK_CALENDAR_BAKED_NAV_COVER = {
  x: 0,
  y: 766,
  w: 393,
  h: 66,
} as const

/**
 * 시안에 구워진 **히어로 영역**(별+무지개, 「15일 연속 학습 중!」).
 *
 * 숫자·별이 그림이라 학생이 며칠을 이었든 늘 「15일」이 보였다. 실데이터로 바꾸려면
 * 구운 것을 덮고 다시 그려야 한다(시안 위에 겹쳐 그리면 글자가 두 겹이 된다).
 * 카드 배경은 순백이라 흰색 덮개로 지운다.
 */
export const STREAK_HERO_COVER = { x: 24, y: 138, w: 345, h: 108 } as const

/** 덮개 안에서 별을 놓을 자리 (프레임 393×852 기준) */
export const STREAK_HERO_STAR = { x: 163, y: 143, w: 62, h: 58 } as const

/** 덮개 안에서 「N일 연속 학습 중!」을 놓을 자리 */
export const STREAK_HERO_TEXT = { x: 24, y: 210, w: 345, h: 34 } as const

/**
 * 별 얼굴은 **목표를 넘길 때마다 바뀐다**(사용자 결정 2026-08-24).
 * 7일 미만은 아직 아무 목표도 못 넘긴 상태라 얼굴 없이 **숫자만** 보여 준다.
 */
export const STREAK_MILESTONES = [
  { days: 100, asset: '/assets/streak-star-100.webp?v=1' },
  { days: 30, asset: '/assets/streak-star-30.webp?v=1' },
  { days: 7, asset: '/assets/streak-star-7.webp?v=1' },
] as const

export function streakStarAssetFor(days: number): string | null {
  return STREAK_MILESTONES.find((m) => days >= m.days)?.asset ?? null
}
