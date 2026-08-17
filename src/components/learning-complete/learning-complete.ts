export const FRAME_W = 393
export const FRAME_H = 852

/**
 * Figma `단어파트 완료화면` — 원본 캔버스 606×1134, 콘텐츠 프레임은 x=81.1797부터 523×1134.
 * 523:1134 = 393:852 이므로 viewBox만 콘텐츠 프레임에 맞추면 좌표가 1:1로 대응한다.
 * (이전 export는 393×829로 세로가 눌려 있어 scaleRect 보정이 필요했다 — 이제 불필요.)
 */
export const LEARNING_COMPLETE_ASSET = '/assets/word-part-complete.svg?v=5'

/**
 * 「1파트 완료」베이크 배지 — React로 교사 부여명 배지를 덮어쓴다.
 * SVG viewBox(81.18,0,523,1134) → 393×852: x=(270.15-81.18)/523*393 ≈ 142, y≈49.
 */
export const LEARNING_COMPLETE_BADGE = { x: 142, y: 49, w: 108, h: 24 }

/** 통계 카드 전체 — 베이크 수치 가리고 React로 그림 */
export const LEARNING_COMPLETE_STATS_CARD = { x: 20, y: 347, w: 353, h: 93 }

/** 통계 카드 가운데 구분선 세로 여백 (카드 상·하단에서) */
export const LEARNING_COMPLETE_STATS_DIVIDER_INSET = 22

/**
 * 「오늘 배운 단어」카드 스크롤 영역.
 * 제목 아래 ~ 「단어장에서도 복습할 수 있어요」 위. 베이크 8칸을 덮고 React 그리드로 대체.
 */
export const LEARNING_COMPLETE_WORD_SCROLL = { x: 12, y: 478, w: 369, h: 216 }

/** 카드 그리드 내부 여백 — 첫 칸 상단이 베이크 위치(y=484)와 맞도록 */
export const LEARNING_COMPLETE_WORD_GRID_PAD = 6

/** 카드 한 칸 (그리드 gap 계산용) */
export const LEARNING_COMPLETE_WORD_CARD = { w: 172, h: 46 }

/** 파란「계속하기」 */
export const LEARNING_COMPLETE_PRIMARY_BTN = { x: 29, y: 757, w: 228, h: 54 }

/** 회색「홈」 */
export const LEARNING_COMPLETE_SECONDARY_BTN = { x: 265, y: 757, w: 99, h: 54 }

/** 공부 시간(분) — 1분 미만도 최소 1분으로 표기 */
export function formatStudyMinutes(startedAtMs: number | null, endedAtMs = Date.now()): number {
  if (startedAtMs == null || endedAtMs < startedAtMs) return 1
  return Math.max(1, Math.round((endedAtMs - startedAtMs) / 60_000))
}

export function formatLearnedWordCountLabel(count: number): string {
  return `${Math.max(0, count)}개`
}

export function formatStudyMinutesLabel(minutes: number): string {
  return `${Math.max(0, minutes)}분`
}

export function figmaRectStyle(rect: {
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
