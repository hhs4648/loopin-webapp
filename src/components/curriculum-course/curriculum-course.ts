export const FRAME_W = 393
export const FRAME_H = 852

/** Figma `커리큘럼 코스` export(523×1134) → 393×852 프레임 환산 스케일 */
const SVG_TO_FRAME = 393 / 523

export type FigmaCourseRect = { x: number; y: number; w: number; h: number }

function svgRect(x: number, y: number, w: number, h: number): FigmaCourseRect {
  return {
    x: x * SVG_TO_FRAME,
    y: y * SVG_TO_FRAME,
    w: w * SVG_TO_FRAME,
    h: h * SVG_TO_FRAME,
  }
}

export function figmaRectStyle(rect: FigmaCourseRect) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

/** 드롭다운 옵션 한 행 높이(px) — 패널 높이는 행 수에 맞춰 계산 */
export const DROPDOWN_ROW_H = 36
/** 패널 상하 패딩 합(px) — `p-1.5` × 2 */
export const DROPDOWN_PANEL_PADDING = 12

/**
 * 드롭다운 패널 위치 — 필드 바로 아래(gap 8px)에 왼쪽 정렬하되,
 * 프레임 우측(margin 8px) 밖으로 넘치면 왼쪽으로 당긴다.
 * 높이는 내용(행 수)에 맞추고 `visibleRows`행까지만 보이게 max-height로 제한.
 */
export function dropdownPanelStyle(
  anchor: FigmaCourseRect,
  panelW: number,
  visibleRows: number,
) {
  const gap = 8
  const margin = 8
  const maxLeft = FRAME_W - margin - panelW
  const left = Math.max(margin, Math.min(anchor.x, maxLeft))
  const top = anchor.y + anchor.h + gap
  return {
    left: `${(left / FRAME_W) * 100}%`,
    top: `${(top / FRAME_H) * 100}%`,
    width: `${(panelW / FRAME_W) * 100}%`,
    maxHeight: `${visibleRows * DROPDOWN_ROW_H + DROPDOWN_PANEL_PADDING}px`,
  }
}

export type CourseOption = { id: string; label: string }

/** 시안 좌표(523×1134) 기준 학년·교재·단원 필드 */
export const GRADE_FIELD = svgRect(86.25, 503.25, 79.5, 41.5)
export const TEXTBOOK_FIELD = svgRect(175.75, 502.75, 116.5, 42.5)
export const UNIT_FIELD = svgRect(301.75, 502.75, 136.5, 42.5)

/** 「특별 내신 코스 생성하기」 버튼 */
export const CREATE_COURSE_BUTTON = svgRect(48, 560, 427, 62)

export const GRADE_OPTIONS: CourseOption[] = [
  { id: 'g1', label: '중1' },
  { id: 'g2', label: '중2' },
  { id: 'g3', label: '중3' },
]

/** 내신 코스 대상 교과서 10종 (출판사 + 저자) */
export const TEXTBOOK_OPTIONS: CourseOption[] = [
  { id: 'ne-kim', label: 'NE능률(김)' },
  { id: 'ybm-kim', label: 'YBM(김)' },
  { id: 'ybm-park', label: 'YBM(박)' },
  { id: 'donga-yoon', label: '동아(윤)' },
  { id: 'donga-lee', label: '동아(이)' },
  { id: 'mirae-n-moon', label: '미래엔(문)' },
  { id: 'visang-hwang', label: '비상(황)' },
  { id: 'jihaksa-song', label: '지학사(송)' },
  { id: 'chunjae-so', label: '천재(소)' },
  { id: 'chunjae-lee', label: '천재(이)' },
]

/** 1~8단원 — 개별 버튼 · 최대 2개까지 다중 선택 */
export type UnitOption = CourseOption & { num: number }

export const UNIT_SELECT_MAX = 2

export const UNIT_OPTIONS: UnitOption[] = [
  { id: 'unit-1', num: 1, label: '1단원' },
  { id: 'unit-2', num: 2, label: '2단원' },
  { id: 'unit-3', num: 3, label: '3단원' },
  { id: 'unit-4', num: 4, label: '4단원' },
  { id: 'unit-5', num: 5, label: '5단원' },
  { id: 'unit-6', num: 6, label: '6단원' },
  { id: 'unit-7', num: 7, label: '7단원' },
  { id: 'unit-8', num: 8, label: '8단원' },
]

/** 선택 단원 → `1,3,5단원` (오름차순) */
export function formatUnitSelectionLabel(unitIds: string[]): string {
  const nums = UNIT_OPTIONS.filter((u) => unitIds.includes(u.id)).map((u) => u.num)
  if (nums.length === 0) return ''
  return `${nums.join(',')}단원`
}

/** 단원 다중선택 패널 — 필드 아래, 4열 그리드 (`1단원`… 라벨) */
export function unitMultiPanelStyle(anchor: FigmaCourseRect) {
  const gap = 8
  const margin = 8
  const panelW = Math.min(320, FRAME_W - margin * 2)
  const maxLeft = FRAME_W - margin - panelW
  const left = Math.max(margin, Math.min(anchor.x + anchor.w - panelW, maxLeft))
  const top = anchor.y + anchor.h + gap
  return {
    left: `${(left / FRAME_W) * 100}%`,
    top: `${(top / FRAME_H) * 100}%`,
    width: `${(panelW / FRAME_W) * 100}%`,
  }
}
