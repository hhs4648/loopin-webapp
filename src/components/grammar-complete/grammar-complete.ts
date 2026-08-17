import { SESSION_TOTAL_STEPS } from '../exercise/session-questions'

export const FRAME_W = 393
export const FRAME_H = 852

/**
 * Figma `완료 1`·`완료 2`·`완료 3` — 종합(성/과제) 완료 점수 화면.
 * 점수대별로 캐릭터·격려만 다르고, 카드·CTA 좌표는 동일하다.
 * 하단 CTA는 틀린문제만·재도전만 React로 덮어 활성 상태를 맞춘다.
 */
export const ASSIGNMENT_COMPLETE_ASSETS = {
  /** 80점 이상 — `완료 1.svg` */
  high: '/assets/assignment-complete-high.svg?v=5',
  /** 50점 이상 80점 미만 — `완료 2.svg` */
  mid: '/assets/assignment-complete-mid.svg?v=5',
  /** 50점 미만 — `완료 3.svg` */
  low: '/assets/assignment-complete-low.svg?v=5',
} as const

export type AssignmentCompleteTone = keyof typeof ASSIGNMENT_COMPLETE_ASSETS

/** @deprecated 점수대별 에셋 사용 — `assignmentCompleteAssetForScore` */
export const ASSIGNMENT_COMPLETE_ASSET = ASSIGNMENT_COMPLETE_ASSETS.high

export function assignmentCompleteToneForScore(
  score: number,
): AssignmentCompleteTone {
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

export function assignmentCompleteAssetForScore(score: number): string {
  return ASSIGNMENT_COMPLETE_ASSETS[assignmentCompleteToneForScore(score)]
}

/** 에셋 하늘색 배경 */
export const GRAMMAR_COMPLETE_BG = '#E2F7FF'

/**
 * @deprecated 넓은 잔디 덮개는 그라데이션 필드와 색이 어긋나 세로 줄이 생김.
 * 버튼은 시안 슬롯과 같은 크기로만 덮는다.
 */
export const COMPLETE_CTA_BAKE_COVER = { x: 22, y: 682, w: 349, h: 78 }

/** @deprecated */
export const COMPLETE_CTA_BAKE_FILL = '#8FDFBE'

/**
 * 시안에 구워진 하단 탭바·홈 인디케이터 가림.
 * 완료 화면은 `<` 홈만 쓰고 탭바를 쓰지 않는다.
 * 실측: 필드(#A4~A5E2E1)는 ~y768까지, 흰 탭바는 y772~.
 * 흰 덮개는 또 다른 네모처럼 보이므로, 직전 필드색으로 이어 가린다.
 */
export const COMPLETE_BOTTOM_NAV_COVER = { x: 0, y: 768, w: 393, h: 84 }
export const COMPLETE_BOTTOM_NAV_COVER_FILL = '#A5E2E1'

/**
 * 왼쪽 CTA — 흰「틀린문제만」
 * 시안 outer: x30–155 y690–750
 */
export const COMPLETE_RETRY_WRONG_BTN = { x: 30, y: 690, w: 125, h: 60 }

/**
 * 오른쪽 CTA — 파란「재도전」
 * 시안 outer: x165–356 y690–750
 */
export const COMPLETE_RETRY_ALL_BTN = { x: 165, y: 690, w: 191, h: 60 }

/** CTA 라벨 */
export const COMPLETE_CTA_LABEL_CLASS = 'text-[17px] font-bold leading-none'

/** @deprecated 단색 잔디 가림 — 이음새가 보임 */
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

/**
 * @deprecated 쓰지 말 것 — 뒤로가기는 공통 `BACK_BUTTON_HIT` 한 자리로 통일했다(2026-08-08).
 * 이 화면의 구운 `<`는 혼자 아래(y 105~135)에 크게(22×30) 그려져 있었다.
 * 지금은 `BACK_MASK_COMPLETE`로 덮고 공통 위치에 다시 그린다.
 */
export const COMPLETE_BACK_HIT = { x: 12, y: 94, w: 40, h: 50 }

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

/**
 * 점수대별 격려 — `assignmentCompleteToneForScore`와 동일 경계.
 * (카드 위 React 오버레이. 시안 베이크 문구는 마스크로 가림)
 */
export function encouragementForScore(score: number): string {
  switch (assignmentCompleteToneForScore(score)) {
    case 'high':
      return '잘했어요!'
    case 'mid':
      return '좋아요, 다음엔 더 올려봐요!'
    case 'low':
      return '아쉬워요!'
  }
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

