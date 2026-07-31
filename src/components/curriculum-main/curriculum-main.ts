import type { CSSProperties } from 'react'

/** ?? ?? ? ?? ?? ?? ? ??? ?? ? */
export const FRAME_W = 393
export const FRAME_H = 852

/** ? ?? ?? ? `????LONG.svg` (523?1468) */
export const SVG_W = 523
export const SVG_H = 1468

export const SVG_TO_FRAME = FRAME_W / SVG_W

/** ??? ? ??(??? ??) ? LONG ?? */
export const LONG_CONTENT_H = Math.round(SVG_H * SVG_TO_FRAME)

/**
 * ??(??) ?? ? LONG?? ??/? ??? ???? SVG y?410? ??.
 * ??????? React ??, ?? LONG ??? ???.
 */
/** Scroll-area / map grass ? never paint onto the fixed sky header */
export const MAP_GRASS_FILL = '#79EDB6'

/**
 * Fixed sky ends here (SVG y). Lower = taller grass corridor above the path
 * for the in-progress running character to pass through.
 * Sky header stays sky-colored; pale baked SVG above the path is covered
 * by MAP_GRASS_SEAM_RECT on the map layer only.
 */
export const SKY_CLIP_SVG_Y = 365
export const SKY_H = Math.round(SKY_CLIP_SVG_Y * SVG_TO_FRAME)

/** Covers baked light-sky remnant above the path (map layer only) */
export const MAP_GRASS_SEAM_RECT: SvgRect = {
  x: 0,
  y: 0,
  w: SVG_W,
  h: 420,
}

/** design.md ? uiux.md ? ?? ?? 81px ?? */
export const NAV_H = 81

/**
 * ? ??? ??? ?? ? LONG ?? ??(??? ?? ?? ??).
 * ?? ????? ? ???? ?? ???/?????.
 */
export const MAP_SCROLL_CONTENT_H = LONG_CONTENT_H

export type SvgRect = { x: number; y: number; w: number; h: number }

/**
 * ? ?? ? Figma `????LONG` (??????. ??/???? ????? ?? ??)
 * ASCII: `main-screen-long.svg`
 */
export const CURRICULUM_MAP_BG_ASSET = '/assets/main-screen-long.svg?v=15'

/**
 * ? ?? ?? ? ??? `public/assets/dinosaur.svg`.
 * LONG? ??? ? ??(???)? ???? `opacity=0`, React ????? ??.
 */
export const CURRICULUM_DINOSAUR_ASSET = '/assets/dinosaur.svg?v=1'

/**
 * LONG SVG ?? ?? ?? ??.
 * - lower: ?? ?? ?? (???, ???? ?)
 * - upper: ?? ?? ?? (? ??? ??? ??? ??? ?? flipX)
 */
export const CURRICULUM_DINOSAURS: ReadonlyArray<{
  id: string
  rect: SvgRect
  flipX?: boolean
}> = [
  { id: 'lower', rect: { x: 78, y: 978, w: 98, h: 66 } },
  { id: 'upper', rect: { x: 395, y: 468, w: 98, h: 66 }, flipX: true },
]

/**
 * ? ?? ?? ? `trees.svg`? round/tall ? ??? ?? PNG.
 * LONG ???? ??(??) ??? `opacity=0`, ??? ??. ?? ??? ??.
 */
export const CURRICULUM_TREE_ASSETS = {
  round: '/assets/curriculum-tree-round.png?v=1',
  tall: '/assets/curriculum-tree-tall.png?v=1',
} as const

export type CurriculumTreeVariant = keyof typeof CURRICULUM_TREE_ASSETS

/** ? ?? ?? 8?? ? ?/? ????, round?tall ?? */
export const CURRICULUM_TREES: ReadonlyArray<{
  id: string
  variant: CurriculumTreeVariant
  rect: SvgRect
}> = [
  { id: 'r-598', variant: 'tall', rect: { x: 478, y: 575, w: 40, h: 66 } },
  { id: 'r-627', variant: 'round', rect: { x: 452, y: 602, w: 40, h: 64 } },
  { id: 'l-757', variant: 'round', rect: { x: 4, y: 732, w: 42, h: 66 } },
  { id: 'r-898', variant: 'tall', rect: { x: 478, y: 875, w: 40, h: 66 } },
  { id: 'l-1058', variant: 'round', rect: { x: 2, y: 1032, w: 42, h: 66 } },
  { id: 'r-1196', variant: 'tall', rect: { x: 482, y: 1172, w: 36, h: 58 } },
  { id: 'l-1336', variant: 'round', rect: { x: 4, y: 1312, w: 36, h: 56 } },
]

/**
 * 하단 내비 조각 (홈 활성 / 전체 활성).
 * `curriculum-start.svg` 하단 바에서 추출 — activeId에 따라 전환.
 */
export const CURRICULUM_NAV_ASSET = '/assets/curriculum-bottom-nav.svg?v=3'
export const CURRICULUM_NAV_MENU_ASSET = '/assets/curriculum-bottom-nav-menu.svg?v=3'

/** @deprecated 전체 start SVG 크롭 방식 — 조각 에셋로 대체 */
export const NAV_ASSET_H = Math.round(1134 * SVG_TO_FRAME)

/**
 * 0% ??? ? `???? ?????.svg` (ASCII ???).
 * ?? `???? ??` rect x=5 y=420 w?104.4 h?99.9
 */
export const CURRICULUM_START_CHARACTER_ASSET =
  '/assets/curriculum-start-character.svg?v=1'

/**
 * ?? ? ? LONG? ????? ?? ???? ??? PNG.
 * ??? ?????(rect x?25.6 y=392)? ???? `opacity=0`.
 */
export const CURRICULUM_RUNNING_CHARACTER_ASSET =
  '/assets/curriculum-running-character.png?v=1'

/** ?? ? ??? ?? ??? SVG ???? ?? */
export const CURRICULUM_CHECKERED_COLS = 4
export const CURRICULUM_CHECKERED_ROWS = 6

/** LONG/?? ?? SVG ?? ? ? ???? ??? % ??? */
export function longMapRectStyle(rect: SvgRect): CSSProperties {
  return {
    position: 'absolute',
    left: `${(rect.x / SVG_W) * 100}%`,
    top: `${(rect.y / SVG_H) * 100}%`,
    width: `${(rect.w / SVG_W) * 100}%`,
    height: `${(rect.h / SVG_H) * 100}%`,
  }
}

/** ??? ??? ? `???? ??` ?? ?? */
export const START_CHARACTER_RECT: SvgRect = {
  x: 2,
  y: 448,
  w: 104.41,
  h: 99.91,
}

/** ??? ? ?? ?(y?498 h?40)? ?? ??? ???? */
/** Figma: Inter Bold 17.3 ? Hangul falls back to Noto Sans KR */
export const WEEK_LABEL_FONT_SIZE = 17.3
export const WEEK_LABEL_FONT_WEIGHT = 700
export const WEEK_LABEL_FONT_FAMILY = 'Inter, "Noto Sans KR", sans-serif'
export const WEEK_LABEL_COLOR_START = '#3B6FF5'
export const WEEK_LABEL_COLOR_COMPLETE = '#000000'
export const WEEK_LABEL_COLOR_LOCKED = '#8C94A1'
export const WEEK_LABEL_BOX_W = 130
export const WEEK_LABEL_BOX_H = 26

export type CurriculumWeekLabel = {
  week: 1 | 2 | 3 | 4 | 5
  rect: SvgRect
}

/**
 * Week labels — Inter Bold 17.3, 각 주 길 행 위.
 * 1주는 스크롤 상단(SVG y≥SKY_CLIP 365) 안에 두어 잘리지 않게 함.
 * 러닝 캐릭터(Day 원 위)와 세로로 안 겹치게 배치.
 * x는 전 주차 동일(지그재그 없음) — 박스 중심 = WEEK_LABEL_CENTER_X.
 */
export const WEEK_LABEL_CENTER_X = 222.98
const WEEK_LABEL_X = WEEK_LABEL_CENTER_X - WEEK_LABEL_BOX_W / 2

export const CURRICULUM_WEEK_LABELS: ReadonlyArray<CurriculumWeekLabel> = [
  {
    week: 1,
    rect: {
      x: WEEK_LABEL_X,
      /** SKY_CLIP_SVG_Y(365) 바로 아래 — 더 위면 하늘/스크롤에 잘림 */
      y: 372,
      w: WEEK_LABEL_BOX_W,
      h: WEEK_LABEL_BOX_H,
    },
  },
  {
    week: 2,
    rect: {
      x: WEEK_LABEL_X,
      y: 555,
      w: WEEK_LABEL_BOX_W,
      h: WEEK_LABEL_BOX_H,
    },
  },
  {
    week: 3,
    rect: {
      x: WEEK_LABEL_X,
      y: 768,
      w: WEEK_LABEL_BOX_W,
      h: WEEK_LABEL_BOX_H,
    },
  },
  {
    week: 4,
    rect: {
      x: WEEK_LABEL_X,
      y: 978,
      w: WEEK_LABEL_BOX_W,
      h: WEEK_LABEL_BOX_H,
    },
  },
  {
    week: 5,
    rect: {
      x: WEEK_LABEL_X,
      y: 1186,
      w: WEEK_LABEL_BOX_W,
      h: WEEK_LABEL_BOX_H,
    },
  },
]

/** @deprecated use CURRICULUM_WEEK_LABELS[0].rect */
export const WEEK1_START_LABEL_RECT = CURRICULUM_WEEK_LABELS[0].rect

export const CHECKERED_START_RECT: SvgRect = {
  x: 68,
  y: 488,
  w: 28,
  h: 52,
}

/** ?? ??? ? Day 1 ??? ??? ??. ?? Day? ?? ??. */
export const RUNNING_CHARACTER_SIZE = { w: 112.13, h: 101.13 } as const

/**
 * 노란 길 위 Day 노드 (1~15 / 1~5주차).
 * 활성: `#FD3D3D` · 잠금: LONG 베이크 `#D1D6DB`(React가 해금 시 덮음).
 */
export type CurriculumDayId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
export type CurriculumWeekId = 1 | 2 | 3 | 4 | 5

/** 1주차 활성 원 — 빨강 (기본) */
export const DAY_NODE_ACTIVE_FILL = '#FD3D3D'
export const DAY_NODE_STROKE = 2.65

/**
 * 해금(활성) Day 원 색 — 주차마다 구분.
 * 1~3 빨강 · 4~6 주황 · 7~9 노랑 · 10~12 초록 · 13~15 파랑
 */
export function dayNodeActiveFill(day: number): string {
  if (day <= 3) return '#FD3D3D'
  if (day <= 6) return '#FF8A1F'
  if (day <= 9) return '#F5C400'
  if (day <= 12) return '#2FCB6E'
  return '#3C86FF'
}

/** 1주차 React 원 — LONG 시작 노드 반경 */
export const START_DAY_NODE_R = 29.67
/** 2~5주차 LONG 잠금 노드 반경 */
export const LOCKED_DAY_NODE_R = 30.9983

export type CurriculumDayNode = {
  day: CurriculumDayId
  week: CurriculumWeekId
  cx: number
  cy: number
  r: number
}

export const CURRICULUM_DAY_NODES: ReadonlyArray<CurriculumDayNode> = [
  { day: 1, week: 1, cx: 133.76, cy: 517.35, r: START_DAY_NODE_R },
  { day: 2, week: 1, cx: 222.98, cy: 517.35, r: START_DAY_NODE_R },
  { day: 3, week: 1, cx: 312.2, cy: 517.35, r: START_DAY_NODE_R },
  // 2·4주차: 길 우→좌 (화면 왼쪽부터 6·5·4 / 12·11·10)
  { day: 4, week: 2, cx: 385.455, cy: 729.162, r: LOCKED_DAY_NODE_R },
  { day: 5, week: 2, cx: 296.233, cy: 729.162, r: LOCKED_DAY_NODE_R },
  { day: 6, week: 2, cx: 207.014, cy: 729.162, r: LOCKED_DAY_NODE_R },
  { day: 7, week: 3, cx: 133.756, cy: 940.518, r: LOCKED_DAY_NODE_R },
  { day: 8, week: 3, cx: 222.975, cy: 940.518, r: LOCKED_DAY_NODE_R },
  { day: 9, week: 3, cx: 312.197, cy: 940.518, r: LOCKED_DAY_NODE_R },
  { day: 10, week: 4, cx: 385.455, cy: 1151.87, r: LOCKED_DAY_NODE_R },
  { day: 11, week: 4, cx: 296.229, cy: 1151.87, r: LOCKED_DAY_NODE_R },
  { day: 12, week: 4, cx: 207.014, cy: 1151.87, r: LOCKED_DAY_NODE_R },
  { day: 13, week: 5, cx: 133.584, cy: 1360.41, r: LOCKED_DAY_NODE_R },
  { day: 14, week: 5, cx: 222.803, cy: 1360.41, r: LOCKED_DAY_NODE_R },
  { day: 15, week: 5, cx: 312.026, cy: 1360.41, r: LOCKED_DAY_NODE_R },
]

/** @deprecated ? `CURRICULUM_DAY_NODES` week 1 */
export const START_DAY_NODES = CURRICULUM_DAY_NODES.filter((n) => n.week === 1)


/**
 * Floating lock badge above a locked day node ? Figma week4/5 baked locks
 * (filter19?21 / filter24?26 in `main-screen-long.svg`).
 */
export const DAY_LOCK_BADGE_R = 22.643 // (1108.17 - 1062.88) / 2
export const DAY_LOCK_BADGE_STROKE = 3.32983
/** Day center ? badge center (week2: 729.162 - 661.971) */
export const DAY_LOCK_BADGE_OFFSET_Y = 67.191
/** Padlock body (#8C9199) relative to badge center */
export const DAY_LOCK_BODY = {
  w: 15.9832,
  h: 11.9874,
  rx: 2.66387,
  /** top-left minus badge center (week4: 198.461-206.451, 1084.19-1085.53) */
  ox: -7.99,
  oy: -1.34,
} as const
/** Padlock shackle stroke circle relative to badge center */
export const DAY_LOCK_SHACKLE = {
  r: 3.86261,
  stroke: 2.93025,
  ox: 0,
  oy: -5.34, // 1080.19 - 1085.53
} as const
export const DAY_LOCK_ICON_FILL = '#8C9199'

export function dayLockBadgeRect(node: {
  cx: number
  cy: number
}): SvgRect {
  const r = DAY_LOCK_BADGE_R
  const cy = node.cy - DAY_LOCK_BADGE_OFFSET_Y
  return {
    x: node.cx - r,
    y: cy - r,
    w: r * 2,
    h: r * 2,
  }
}
export function dayNodeRect(node: {
  cx: number
  cy: number
  r: number
}): SvgRect {
  return {
    x: node.cx - node.r,
    y: node.cy - node.r,
    w: node.r * 2,
    h: node.r * 2,
  }
}

/** @deprecated ? `dayNodeRect` */
export function startDayNodeRect(node: {
  cx: number
  cy: number
}): SvgRect {
  return dayNodeRect({ ...node, r: START_DAY_NODE_R })
}

export function weekOfDay(day: CurriculumDayId): CurriculumWeekId {
  return Math.ceil(day / 3) as CurriculumWeekId
}

/** 홀수 주=좌→우, 짝수 주=우→좌 (노란 길 지그재그) */
export function isWeekPathRtl(week: CurriculumWeekId): boolean {
  return week % 2 === 0
}

export function daysInWeek(week: CurriculumWeekId): CurriculumDayId[] {
  const start = ((week - 1) * 3 + 1) as CurriculumDayId
  return [start, (start + 1) as CurriculumDayId, (start + 2) as CurriculumDayId]
}

export function isWeekUnlocked(
  week: CurriculumWeekId,
  completedDays: ReadonlySet<number>,
): boolean {
  if (week === 1) return true
  return daysInWeek((week - 1) as CurriculumWeekId).every((d) =>
    completedDays.has(d),
  )
}

export function isDayUnlocked(
  day: CurriculumDayId,
  completedDays: ReadonlySet<number>,
): boolean {
  return isWeekUnlocked(weekOfDay(day), completedDays)
}

/**
 * ?? ? Day ? ?????? ? ?? ?? ??.
 * ???(?? 0)??? ??? `null` (?? ??? ??).
 */
export type CurriculumWeekLabelWeek = 1 | 2 | 3 | 4 | 5
export type CurriculumWeekLabelStatus = 'start' | 'complete' | 'locked'

export function daysForWeekLabel(week: CurriculumWeekLabelWeek): number[] {
  const start = (week - 1) * 3 + 1
  return [start, start + 1, start + 2]
}

export function getWeekLabelStatus(
  week: CurriculumWeekLabelWeek,
  completedDays: ReadonlySet<number>,
): CurriculumWeekLabelStatus {
  const days = daysForWeekLabel(week)
  if (week > 1) {
    const prev = daysForWeekLabel((week - 1) as CurriculumWeekLabelWeek)
    if (!prev.every((d) => completedDays.has(d))) return 'locked'
  }
  if (days.every((d) => completedDays.has(d))) return 'complete'
  return 'start'
}

export function weekLabelColor(status: CurriculumWeekLabelStatus): string {
  if (status === 'complete') return WEEK_LABEL_COLOR_COMPLETE
  if (status === 'locked') return WEEK_LABEL_COLOR_LOCKED
  return WEEK_LABEL_COLOR_START
}

export function weekLabelText(
  week: CurriculumWeekLabelWeek,
  status: CurriculumWeekLabelStatus,
): string {
  const suffix =
    status === 'complete'
      ? "완료"
      : status === 'locked'
        ? "잠금"
        : "시작"
  return `${week}주차 · ${suffix}`
}
export function getInProgressDay(
  completedDays: ReadonlySet<number>,
): CurriculumDayId | null {
  if (completedDays.size === 0) return null
  for (const node of CURRICULUM_DAY_NODES) {
    if (!completedDays.has(node.day) && isDayUnlocked(node.day, completedDays)) {
      return node.day
    }
  }
  return null
}

/** 러닝 캐릭터 — 짝수 주는 길 방향에 맞게 좌향(scaleX -1) */
export function runningCharacterFacesLeft(day: CurriculumDayId): boolean {
  return isWeekPathRtl(weekOfDay(day))
}

/**
 * 진행 중 Day **원 위**에 캐릭터를 세움.
 * 발과 원 상단 사이 이격 — 버튼 테두리/글로우 여유.
 */
export function runningCharacterRect(day: CurriculumDayId): SvgRect {
  const { w, h } = RUNNING_CHARACTER_SIZE
  const node = CURRICULUM_DAY_NODES.find((n) => n.day === day)!
  /** Day 원 상단 ↔ 캐릭터 발 간격 (SVG px) */
  const gapAboveNode = 18
  return {
    x: node.cx - w / 2,
    y: node.cy - node.r - h - gapAboveNode,
    w,
    h,
  }
}

export function curriculumProgressPercent(
  completedDays: ReadonlySet<number>,
): number {
  return Math.round((completedDays.size / CURRICULUM_DAY_NODES.length) * 100)
}

const COMPLETED_DAYS_KEY = 'loopin.curriculum.completedDays'

export function loadCompletedDays(): Set<number> {
  try {
    const raw = sessionStorage.getItem(COMPLETED_DAYS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(
      parsed.filter(
        (n): n is number =>
          typeof n === 'number' && n >= 1 && n <= 9 && Number.isInteger(n),
      ),
    )
  } catch {
    return new Set()
  }
}

export function saveCompletedDays(completedDays: ReadonlySet<number>) {
  try {
    sessionStorage.setItem(
      COMPLETED_DAYS_KEY,
      JSON.stringify([...completedDays].sort((a, b) => a - b)),
    )
  } catch {
    /* ignore */
  }
}

export function clearCompletedDays() {
  try {
    sessionStorage.removeItem(COMPLETED_DAYS_KEY)
  } catch {
    /* ignore */
  }
}

export type CurriculumNavTabId = 'home' | 'vocab' | 'review' | 'menu'

/** 하단 내비 시안 — 홈 활성 / 전체(설정) 활성 */
export function curriculumNavAssetFor(activeId: CurriculumNavTabId): string {
  return activeId === 'menu' ? CURRICULUM_NAV_MENU_ASSET : CURRICULUM_NAV_ASSET
}

export type CurriculumNavTab = {
  id: CurriculumNavTabId
  label: string
  ariaLabel: string
}

/** `???? ????` ?? ? 4? */
export const CURRICULUM_NAV_TABS: CurriculumNavTab[] = [
  { id: 'home', label: "홈", ariaLabel: "홈" },
  { id: 'vocab', label: "단어장", ariaLabel: "단어장" },
  { id: 'review', label: "복습노트", ariaLabel: "복습노트" },
  { id: 'menu', label: "전체", ariaLabel: "전체" },
]

/** ?? ????? ?? ????????(??) */
export type CurriculumCourseSelection = {
  gradeId: string
  gradeLabel: string
  textbookId: string
  textbookLabel: string
  /** ?? ?? id ? `unit-1` ? `unit-8`, 1? ?? */
  unitIds: string[]
  /** ??? ? `1,3,5??` */
  unitLabel: string
}

const COURSE_SELECTION_KEY = 'loopin.curriculum.courseSelection'

/** ????? ??: `?2 ? NE??(?) ? 1,3,5??` */
export function formatCourseSelectionLabel(
  selection: CurriculumCourseSelection,
): string {
  return `${selection.gradeLabel} · ${selection.textbookLabel} · ${selection.unitLabel}`
}

export function saveCourseSelection(selection: CurriculumCourseSelection) {
  try {
    sessionStorage.setItem(COURSE_SELECTION_KEY, JSON.stringify(selection))
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearCourseSelection() {
  try {
    sessionStorage.removeItem(COURSE_SELECTION_KEY)
  } catch {
    /* ignore */
  }
}

export function loadCourseSelection(): CurriculumCourseSelection | null {
  try {
    const raw = sessionStorage.getItem(COURSE_SELECTION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CurriculumCourseSelection & {
      /** ??? ?? ?? */
      unitId?: string
    }
    if (!parsed?.gradeLabel || !parsed?.textbookLabel) return null

    let unitIds = Array.isArray(parsed.unitIds) ? parsed.unitIds : []
    if (unitIds.length === 0 && parsed.unitId) {
      unitIds = [parsed.unitId]
    }
    if (unitIds.length === 0 && !parsed.unitLabel) return null

    return {
      gradeId: parsed.gradeId,
      gradeLabel: parsed.gradeLabel,
      textbookId: parsed.textbookId,
      textbookLabel: parsed.textbookLabel,
      unitIds,
      unitLabel: parsed.unitLabel || unitIds.join(','),
    }
  } catch {
    return null
  }
}

/** ???? ??? ?? ? ??: `?2 ? ??(?) ? 5,6??` */
export function formatCourseListLabel(
  selection: CurriculumCourseSelection,
): string {
  return formatCourseSelectionLabel(selection)
}
