import type { StudentAssignment } from '../../lib/sync/types'

/** Figma frame */
export const FRAME_W = 393
export const FRAME_H = 852

/**
 * 오늘의 미션 카드 — Figma export `current-learning-cta-card.svg`(392×156, 카드 자체는
 * x=20 y=20 w=352 h=116) 좌표를 그대로 쓰되, 회차 필(y=16~60) 바로 아래(y=70)에
 * 오도록 y에 +50 오프셋을 더했다. 카드 안의 모든 텍스트·진행률이 실데이터라서
 * 이미지 자체는 렌더하지 않고 좌표만 그대로 가져와 React로 그린다.
 */
const CARD_Y_OFFSET = 50

export const MISSION_CARD_RECT = { x: 20, y: 20 + CARD_Y_OFFSET, w: 352, h: 116 }
export const MISSION_BADGE_RECT = { x: 40, y: 36 + CARD_Y_OFFSET, w: 76, h: 22 }
export const MISSION_TITLE_RECT = { x: 40, y: 66 + CARD_Y_OFFSET, w: 220, h: 24 }
export const MISSION_SUBTITLE_RECT = { x: 40, y: 94 + CARD_Y_OFFSET, w: 220, h: 18 }
export const MISSION_PROGRESS_TRACK_RECT = { x: 40, y: 116 + CARD_Y_OFFSET, w: 180, h: 6 }
export const MISSION_BUTTON_RECT = { x: 268, y: 48 + CARD_Y_OFFSET, w: 90, h: 56 }

/**
 * 회차 필 + 오늘의 미션 카드를 덮는 고정 헤더 높이.
 * 카드 하단(y≈186) + 여유. 너무 크면 시작 깃발 끝이 잘린다.
 */
export const MISSION_HEADER_FIXED_H = 200

const SECONDS_PER_QUESTION = 10

/** 미완료 과제 중 order가 가장 빠른 것을 "오늘의 미션"으로 선택 */
export function pickPrimaryAssignment(
  assignments: StudentAssignment[],
): StudentAssignment | null {
  const pending = assignments.filter((a) => a.status !== 'completed')
  if (pending.length === 0) return null
  return [...pending].sort((a, b) => a.order - b.order)[0]!
}

export function getRemainingCount(assignment: StudentAssignment): number {
  return Math.max(0, assignment.questionTotal - assignment.answeredCount)
}

/** 문제당 10초로 계산한 잔여 시간을 분 단위로 표시(0문제가 아니면 최소 1분) */
export function getRemainingMinutes(remainingCount: number): number {
  if (remainingCount <= 0) return 0
  return Math.max(1, Math.round((remainingCount * SECONDS_PER_QUESTION) / 60))
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

/**
 * 카드 내부 요소용 — MISSION_CARD_RECT 자체가 이미 프레임 기준 absolute이므로,
 * 그 안의 자식은 프레임(393×852)이 아니라 카드 박스(352×116) 기준 퍼센트를 써야
 * 한다. figmaRectStyle을 그대로 중첩하면 퍼센트가 두 번 적용돼 요소가 카드
 * 왼쪽 위로 뭉친다 — 실제로 겪은 버그이므로 반드시 이 헬퍼를 쓸 것.
 */
export function cardRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${((rect.x - MISSION_CARD_RECT.x) / MISSION_CARD_RECT.w) * 100}%`,
    top: `${((rect.y - MISSION_CARD_RECT.y) / MISSION_CARD_RECT.h) * 100}%`,
    width: `${(rect.w / MISSION_CARD_RECT.w) * 100}%`,
    height: `${(rect.h / MISSION_CARD_RECT.h) * 100}%`,
  }
}
