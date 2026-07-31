/** Figma frame */
export const FRAME_W = 393
export const FRAME_H = 852

/**
 * 상단 반·과제 드롭다운 필 — 시안형 흰 알약(가로 중앙).
 * y=14: 미션 카드 위 고정 헤더 안. 긴 과제명도 읽히게 넓게.
 */
export const PILL = { x: 36, y: 14, w: 321, h: 48 }

/** session-dropdown panel — 필보다 약간 좁게, 긴 제목용 */
export const DIALOG_W = 300
export const DIALOG_H = 220

/** @deprecated 라벨만 덮을 때 쓰던 좌표 — 통합 필 버튼으로 대체 */
export const PILL_LABEL_TEXT = {
  x: PILL.x + 6,
  y: PILL.y,
  w: PILL.w - 42,
  h: PILL.h,
}

/** Main home sky — matches FigmaAssetFrame bgClassName */
export const MAIN_HOME_SKY = '#E2F7FF'

/** Header pill surface — matches baked SVG rect fill */
export const PILL_SURFACE = '#FFFFFF'

/** invite SVG full-screen dim layer (black @ 45%) over white pill */
export const INVITE_DIM_OVERLAY_OPACITY = 0.45

export function dimmedSurface(base: { r: number; g: number; b: number }, opacity = INVITE_DIM_OVERLAY_OPACITY) {
  const scale = 1 - opacity
  const toHex = (channel: number) =>
    Math.round(channel * scale)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(base.r)}${toHex(base.g)}${toHex(base.b)}`
}

/** White pill after invite dim overlay */
export const PILL_DIMMED_SURFACE = dimmedSurface({ r: 255, g: 255, b: 255 })

/** Chevron tap target — right side of header pill (레거시) */
export const CHEVRON = { x: 230, y: 74, w: 32, h: 34 }

export type SessionRound = {
  id: number
  label: string
  date: string
  isCurrent?: boolean
}

/** 테스트/폴백: 서버 과제 없을 때 */
export const SESSION_ROUNDS: SessionRound[] = [
  { id: 1, label: '1회차', date: '7월 6일 (월)', isCurrent: true },
  { id: 2, label: '2회차', date: '7월 8일 (수)' },
  { id: 3, label: '3회차', date: '7월 10일 (금)' },
  { id: 4, label: '4회차', date: '7월 13일 (월)' },
]

/** 필 라벨: `A반 3회차` / `중2-1반 중간고사대비` */
export function formatClassAssignmentPill(
  className: string,
  assignmentTitle: string,
): string {
  const cls = className.trim() || '반'
  const title = assignmentTitle.trim() || '과제'
  return `${cls} ${title}`
}

/** `lesson_date`(YYYY-MM-DD) → `7월 6일 (월)` */
export function formatAssignmentLessonDate(iso: string): string {
  const raw = iso.length === 10 ? `${iso}T12:00:00` : iso
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return iso
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]!
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${week})`
}

/**
 * 맵 「현재 위치」에 해당하는 과제 —
 * 완료된 과제 중 `order`가 가장 큰 것. 없으면 null(시작 깃발).
 */
export function resolveCurrentLocationAssignment(
  assignments: { assignmentId: string; order: number; status: string }[],
): { assignmentId: string; order: number; status: string } | null {
  let best: { assignmentId: string; order: number; status: string } | null = null
  for (const a of assignments) {
    if (a.status !== 'completed') continue
    if (!best || a.order >= best.order) best = a
  }
  return best
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

export function dialogPanelStyle(topY: number = PILL.y, pillH: number = PILL.h) {
  const top = topY + pillH - 4
  return {
    left: '50%',
    top: `${(top / FRAME_H) * 100}%`,
    width: `${(DIALOG_W / FRAME_W) * 100}%`,
    maxHeight: `${(DIALOG_H / FRAME_H) * 100}%`,
    transform: 'translateX(-50%)',
  }
}
