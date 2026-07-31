import { SESSION_TOTAL_STEPS } from '../exercise/session-questions'

export const FRAME_W = 393
export const FRAME_H = 852

/**
 * Figma `과제 완료시.svg` 원본.
 * 점수·CTA 라벨은 React로 덮어 시안(왼 흰 틀린문제만 / 오른 파란 재도전)에 맞춘다.
 */
export const ASSIGNMENT_COMPLETE_ASSET = '/assets/assignment-complete-v7.svg?v=8'

/** 에셋 하늘색 배경 */
export const GRAMMAR_COMPLETE_BG = '#E2F7FF'

/** 에셋 하단 잔디색 — CTA 베이크 가림용 */
export const COMPLETE_FIELD_COVER = '#8FDFBE'

/** @deprecated */
export const COMPLETE_CTA_IMAGE = '/assets/assignment-complete-ctas.png'

/** @deprecated */
export const LOOPIN_COMPLETE_MASCOT = '/assets/loopin-wave.png'

/** @deprecated */
export const GRAMMAR_COMPLETE_ASSET = ASSIGNMENT_COMPLETE_ASSET

export { SESSION_TOTAL_STEPS as SESSION_TOTAL_QUESTIONS }

/**
 * 카드 안 데모 점수 영역만 가림.
 * 안내 문구(재도전/틀린문제만 설명)는 React로 다시 그림.
 */
export const COMPLETE_SCORE_MASK = { x: 48, y: 355, w: 297, h: 280 }

/** @deprecated */
export const COMPLETE_CTA_STRIP_COVER = { x: 0, y: 658, w: 393, h: 112 }

/** @deprecated */
export const COMPLETE_CTA_IMAGE_RECT = { x: 28, y: 682, w: 337, h: 72 }

/** 왼쪽 CTA — 시안 흰「틀린문제만」(에셋 베이크보다 살짝 크게) */
export const COMPLETE_RETRY_WRONG_BTN = { x: 30, y: 685, w: 160, h: 68 }

/** 오른쪽 CTA — 시안 파란「재도전」 */
export const COMPLETE_RETRY_ALL_BTN = { x: 205, y: 685, w: 160, h: 68 }

/**
 * @deprecated 풀폭/잔디 띠 가림은 이음새가 보임.
 * 버튼 자체를 불투명·확대해서 베이크 글자만 가린다.
 */
export const COMPLETE_CTA_BAKE_COVER = { x: 20, y: 678, w: 353, h: 84 }

/** 헤더 `<` */
export const COMPLETE_BACK_HIT = { x: 12, y: 94, w: 40, h: 50 }

/** 에셋에 구워진 「1반 3회차」 필 가림 (하늘색) */
export const COMPLETE_BAKED_PILL_COVER = { x: 80, y: 66, w: 240, h: 56 }

/** 완료 화면용 반·과제 드롭다운 top */
export const COMPLETE_DROPDOWN_TOP_Y = 72

export function calcSessionScore(
  correctCount: number,
  totalCount: number = SESSION_TOTAL_STEPS,
): number {
  if (totalCount <= 0) return 0
  return Math.round((Math.max(0, correctCount) / totalCount) * 100)
}

export function formatCorrectSummary(
  correctCount: number,
  totalCount: number,
): string {
  return `${totalCount}문제 중 ${correctCount}개 정답`
}

export function formatRoundCompleteLabel(roundNumber: number): string {
  return `${roundNumber}회차 완료`
}

export function encouragementForScore(score: number): string {
  if (score >= 80) return '잘했어요!'
  if (score >= 50) return '잘했어요!'
  return '아쉬워요!'
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
