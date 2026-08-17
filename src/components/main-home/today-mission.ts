import { isWrongReissue } from '../../features/assignments/wrong-reissue'
import type { StudentAssignment } from '../../lib/sync/types'

/** Figma frame */
export const FRAME_W = 393
export const FRAME_H = 852

/**
 * 오늘의 미션 카드 — Figma export `current-learning-cta-card.svg`(392×156, 카드 자체는
 * x=20 y=20 w=352 h=116) 좌표를 그대로 쓰되, 카드 자리를 **Figma 지정 위치 (21, 134)** 로
 * 옮겼다(2026-08-08 · 연속 학습 배지가 위에 들어오면서 재배치).
 * 카드 안의 모든 텍스트·진행률이 실데이터라서 이미지 자체는 렌더하지 않고
 * 좌표만 그대로 가져와 React로 그린다.
 *
 * **카드 안 요소도 절대좌표라 카드와 같은 값만큼 함께 옮겨야 한다.**
 * `cardRectStyle`이 `rect − MISSION_CARD_RECT`로 상대 위치를 내므로, 한쪽만 옮기면
 * 카드 안에서 내용이 밀린다. 그래서 원본(export) 좌표에 오프셋을 더하는 형태로 둔다.
 */
const CARD_X_OFFSET = 1
const CARD_Y_OFFSET = 114

export const MISSION_CARD_RECT = {
  x: 20 + CARD_X_OFFSET,
  y: 20 + CARD_Y_OFFSET,
  w: 352,
  h: 116,
}
export const MISSION_BADGE_RECT = { x: 40 + CARD_X_OFFSET, y: 36 + CARD_Y_OFFSET, w: 76, h: 22 }
export const MISSION_TITLE_RECT = { x: 40 + CARD_X_OFFSET, y: 66 + CARD_Y_OFFSET, w: 220, h: 24 }
export const MISSION_SUBTITLE_RECT = { x: 40 + CARD_X_OFFSET, y: 94 + CARD_Y_OFFSET, w: 220, h: 18 }
export const MISSION_PROGRESS_TRACK_RECT = { x: 40 + CARD_X_OFFSET, y: 116 + CARD_Y_OFFSET, w: 180, h: 6 }
export const MISSION_BUTTON_RECT = { x: 268 + CARD_X_OFFSET, y: 48 + CARD_Y_OFFSET, w: 90, h: 56 }

/**
 * @deprecated 렌더에 쓰지 않는다 — 고정 하늘 높이는 `assignment-home.ts`의 `SKY_FIXED_H`다.
 * 카드 하단은 y = 134 + 116 = 250이고, `SKY_FIXED_H`(294)가 그보다 커야 카드가 하늘 안에 들어온다.
 */
export const MISSION_HEADER_FIXED_H = 262

const SECONDS_PER_QUESTION = 10

/**
 * "오늘의 미션"으로 고를 과제.
 * - 재도전 중이면 그 과제를 우선 (완료 status여도 카드에 남겨야 함)
 * - 그다음 미완료 중 order가 가장 빠른 것
 */
export function pickPrimaryAssignment(
  assignments: StudentAssignment[],
  retryingAssignmentId?: string | null,
): StudentAssignment | null {
  if (retryingAssignmentId) {
    const retrying = assignments.find(
      (a) => a.assignmentId === retryingAssignmentId,
    )
    if (retrying) return retrying
  }
  // 오답 재출제는 헬스장 전용 — 오늘의 미션 카드에 올리지 않는다
  const pending = assignments.filter(
    (a) => a.status !== 'completed' && !isWrongReissue(a),
  )
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
