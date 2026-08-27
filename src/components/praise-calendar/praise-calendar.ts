import type { StudentAssignment } from '../../lib/sync/types'

export const FRAME_W = 393
export const FRAME_H = 852

/**
 * Figma `칭찬캘린더.svg` → `praise-calendar.svg` (`?v=3`, 2026-08-11 새 시안).
 *
 * 배경이 하늘색 그라디언트에서 **흰색**으로, 달성 카드가 흰색에서 **연한 파랑
 * 그라디언트 + 장식 원 + 테두리**로 바뀌었다. 좌표는 예전 시안과 완전히 같아서
 * 오버레이 위치는 그대로 쓴다.
 *
 * 넣으면서 지운 것:
 * - OS가 그리는 것들 — 시계·셀룰러·와이파이·배터리·홈 인디케이터
 * - 달성 카드 안의 **예시 데이터**(75% 진행바·히어로 얼굴·제목·부제).
 *   예전엔 카드를 흰 사각으로 통째로 덮고 그 위에 실데이터를 그렸는데, 새 시안은
 *   카드 자체가 그림이라 덮으면 그라디언트도 장식 원도 다 가려진다. 그래서 카드는
 *   남기고 **안의 예시만** 걷어냈다.
 *
 * 원본은 `_backup/praise-calendar.v2.svg`.
 */
export const PRAISE_CALENDAR_ASSET = '/assets/praise-calendar.svg?v=4'

export const PRAISE_STATUS_FACE_ASSETS = {
  pass: '/assets/praise-status-pass.png',
  regrettable: '/assets/praise-status-regrettable.png',
  incomplete: '/assets/praise-status-incomplete.png',
} as const

/** 선생님이 설정에서 바꾸지 않았을 때 쓰는 기본 통과 기준 점수 */
export const DEFAULT_PASS_SCORE_THRESHOLD = 70

export type PraiseDayStatus = 'pass' | 'regrettable' | 'incomplete'

export type PraiseMonthSummary = {
  total: number
  completed: number
  percent: number
}

export type CalendarCell = {
  key: string
  day: number
  inMonth: boolean
  dateKey: string | null
  status: PraiseDayStatus | null
  isToday: boolean
}

export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const

/** Figma — 월 이동 버튼 */
export const MONTH_PREV_BTN = { x: 88.5, y: 97, w: 36, h: 36 }
export const MONTH_NEXT_BTN = { x: 268.5, y: 97, w: 36, h: 36 }
/** 구워진 연·월 글자 가리기 + React 타이틀 */
export const MONTH_TITLE_MASK = { x: 128, y: 100, w: 137, h: 30 }

/** Figma — 이번 달 달성 카드 */
export const PROGRESS_CARD = { x: 20, y: 153, w: 353, h: 130 }
export const PROGRESS_HERO_FACE = { x: 45, y: 174, w: 61, h: 61 }
export const PROGRESS_TITLE = { x: 118, y: 178, w: 230, h: 28 }
export const PROGRESS_SUBTITLE = { x: 118, y: 208, w: 230, h: 20 }
export const PROGRESS_TRACK = { x: 44, y: 249, w: 305, h: 10 }

/**
 * Figma — 달력 카드 (범례·하단 탭은 SVG 유지).
 * 시안 실측: y 299 → 630.9. 달력 내용은 React가 전부 그리므로 카드는 흰 덮개로
 * 가리고 테두리만 다시 그린다(`CARD_BORDER_COLOR`).
 * 5주 그리드는 마지막 줄 아래 623까지라 카드 안에 들어가고, 6주는
 * `getCellLayout`이 세로로 압축한다.
 */
export const CALENDAR_CARD = { x: 20, y: 299, w: 353, h: 331.9 }

/** 카드 테두리 — 새 시안(`?v=3`)에서 달성·달력·범례 카드가 모두 이 색 1px */
export const CARD_BORDER_COLOR = '#EEF1F5'

/** 그리드 하단 여백 — Today 라벨(`-bottom-3`)·카드 라운드 */
export const GRID_BOTTOM_INSET = 16

export const WEEKDAY_Y = 316
export const WEEKDAY_CENTERS_X = [55.1, 102.4, 149.4, 196.5, 243.6, 290.6, 337.5] as const

/*
  칸을 키우고 **간격을 그만큼 줄여 피치는 그대로** 뒀다(가로 47 · 세로 56).
  피치가 바뀌면 요일 머리글·카드 여백까지 전부 다시 맞춰야 하는데, 원한 건
  「이모티콘을 크게」 하나였다. `GRID_ORIGIN.x`만 2px 당겨서 칸 중심을 요일
  머리글(`WEEKDAY_CENTERS_X`)에 다시 맞춘다.
*/
export const GRID_ORIGIN = { x: 34, y: 339 }
export const CELL_W = 42
export const CELL_H = 52
export const COL_GAP = 5
export const ROW_GAP = 4
export const CELL_PITCH_X = CELL_W + COL_GAP
export const CELL_PITCH_Y = CELL_H + ROW_GAP
/** 칸(42×52) 안에서 날짜 숫자·여백을 뺀 나머지를 얼굴이 다 쓴다 */
export const FACE_SIZE = 36

export type CellLayout = {
  pitchY: number
  cellH: number
  faceSize: number
}

/** 해당 월이 몇 주 그리드인지 (월 시작 요일 포함) */
export function weekCountForMonth(year: number, monthIndex: number): number {
  const first = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const mondayOffset = (first.getDay() + 6) % 7
  return Math.ceil((mondayOffset + daysInMonth) / 7)
}

/**
 * 5주까지는 시안 피치 유지. 6주(예: 2026-08)는 카드 안에 맞춰 세로 압축.
 */
export function getCellLayout(weekCount: number): CellLayout {
  if (weekCount <= 5) {
    return { pitchY: CELL_PITCH_Y, cellH: CELL_H, faceSize: FACE_SIZE }
  }
  const maxBottom = CALENDAR_CARD.y + CALENDAR_CARD.h - GRID_BOTTOM_INSET
  const pitchY = (maxBottom - GRID_ORIGIN.y) / weekCount
  const cellH = Math.max(36, pitchY - 4)
  const faceSize = Math.max(24, Math.min(FACE_SIZE, cellH - 15))
  return { pitchY, cellH, faceSize }
}

export const STATUS_META: Record<
  PraiseDayStatus,
  { label: string; cellBg: string; cellBorder: string; dayColor: string }
> = {
  pass: {
    label: '통과',
    cellBg: '#EAF0FC',
    cellBorder: '#A8BDF0',
    dayColor: '#4763A8',
  },
  regrettable: {
    label: '아쉬움',
    cellBg: '#FFF4D6',
    cellBorder: '#F3CE6E',
    dayColor: '#B07B08',
  },
  incomplete: {
    label: '미제출',
    cellBg: '#E8E9E9',
    cellBorder: '#C5CAD3',
    dayColor: '#808BA6',
  },
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

export function cellRectStyle(col: number, row: number, layout: CellLayout) {
  return figmaRectStyle({
    x: GRID_ORIGIN.x + col * CELL_PITCH_X,
    y: GRID_ORIGIN.y + row * layout.pitchY,
    w: CELL_W,
    h: layout.cellH,
  })
}

/** `YYYY-MM-DD` (로컬 날짜) */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(key.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function formatYearMonthKo(year: number, monthIndex: number): string {
  return `${year}년 ${monthIndex + 1}월`
}

/** 연·월을 비교용 숫자로 (year*12 + monthIndex) */
export function monthCursorValue(year: number, monthIndex: number): number {
  return year * 12 + monthIndex
}

export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const next = new Date(year, monthIndex + delta, 1)
  return { year: next.getFullYear(), monthIndex: next.getMonth() }
}

/**
 * 칭찬 캘린더 달력 원점 — 이보다 이전 달로는 이동 불가.
 * 제품 런칭 달(2026년 7월).
 */
export const CALENDAR_EPOCH = { year: 2026, monthIndex: 6 } as const

function clampToEpoch(year: number, monthIndex: number) {
  const epochValue = monthCursorValue(CALENDAR_EPOCH.year, CALENDAR_EPOCH.monthIndex)
  if (monthCursorValue(year, monthIndex) < epochValue) {
    return { year: CALENDAR_EPOCH.year, monthIndex: CALENDAR_EPOCH.monthIndex }
  }
  return { year, monthIndex }
}

/**
 * 칭찬 캘린더 시작 달 — 학생이 앱(반 가입)을 시작한 달.
 * enrolledAt · 과제 lessonDate 중 가장 이른 달.
 * 없으면·그보다 이르면 **2026년 7월**(CALENDAR_EPOCH).
 */
export function resolveCalendarStartMonth(input: {
  enrolledAtList?: readonly string[]
  lessonDates?: readonly string[]
  now?: Date
}): { year: number; monthIndex: number } {
  const dates: Date[] = []

  for (const iso of input.enrolledAtList ?? []) {
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) dates.push(d)
  }
  for (const key of input.lessonDates ?? []) {
    const d = parseDateKey(key)
    if (d) dates.push(d)
  }

  if (dates.length === 0) {
    return { year: CALENDAR_EPOCH.year, monthIndex: CALENDAR_EPOCH.monthIndex }
  }

  dates.sort((a, b) => a.getTime() - b.getTime())
  const first = dates[0]!
  return clampToEpoch(first.getFullYear(), first.getMonth())
}

export function scoreToStatus(
  score: number,
  passThreshold: number = DEFAULT_PASS_SCORE_THRESHOLD,
): PraiseDayStatus {
  return score >= passThreshold ? 'pass' : 'regrettable'
}

/** `lessonDate`(YYYY-MM-DD) + `deadlineTime`(HH:mm / HH:mm:ss / ISO) → 마감 시각 */
export function getAssignmentDeadline(
  assignment: Pick<StudentAssignment, 'lessonDate' | 'deadlineTime'>,
): Date | null {
  const lesson = parseDateKey(assignment.lessonDate)
  const raw = assignment.deadlineTime?.trim() ?? ''
  if (!raw) {
    if (!lesson) return null
    return new Date(
      lesson.getFullYear(),
      lesson.getMonth(),
      lesson.getDate(),
      23,
      59,
      59,
      999,
    )
  }

  // 이미 날짜가 포함된 ISO/타임스탬프
  if (/^\d{4}-\d{2}-\d{2}/.test(raw) || raw.includes('T')) {
    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  if (!lesson) return null

  const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(raw)
  if (!timeMatch) {
    return new Date(
      lesson.getFullYear(),
      lesson.getMonth(),
      lesson.getDate(),
      23,
      59,
      59,
      999,
    )
  }

  const hours = Number(timeMatch[1])
  const minutes = Number(timeMatch[2])
  const seconds = Number(timeMatch[3] ?? '0')
  if (
    hours > 23 ||
    minutes > 59 ||
    seconds > 59 ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds)
  ) {
    return null
  }

  return new Date(
    lesson.getFullYear(),
    lesson.getMonth(),
    lesson.getDate(),
    hours,
    minutes,
    seconds,
    0,
  )
}

export function isAssignmentDeadlinePassed(
  assignment: Pick<StudentAssignment, 'lessonDate' | 'deadlineTime'>,
  now: Date = new Date(),
): boolean {
  const deadline = getAssignmentDeadline(assignment)
  if (!deadline) return true
  return now.getTime() >= deadline.getTime()
}

/**
 * 과제 1건 → 캘린더 이모티콘.
 * - 완료: 점수 기준 통과/아쉬움
 * - 미제출 + 마감 지남: 미제출
 * - 미제출 + 마감 전: null (이모티콘 없음)
 */
export function resolveAssignmentStatus(
  assignment: StudentAssignment,
  passThreshold: number = DEFAULT_PASS_SCORE_THRESHOLD,
  now: Date = new Date(),
): PraiseDayStatus | null {
  const done =
    assignment.status === 'completed' || Boolean(assignment.completedAt)
  if (!done) {
    return isAssignmentDeadlinePassed(assignment, now) ? 'incomplete' : null
  }

  const score = assignment.latestScore ?? assignment.firstScore
  if (score == null) {
    return isAssignmentDeadlinePassed(assignment, now) ? 'incomplete' : null
  }
  return scoreToStatus(score, passThreshold)
}

export function aggregateDayStatus(
  statuses: PraiseDayStatus[],
  scores: number[],
  passThreshold: number = DEFAULT_PASS_SCORE_THRESHOLD,
): PraiseDayStatus | null {
  if (statuses.length === 0) return null
  if (statuses.some((s) => s === 'incomplete')) return 'incomplete'
  if (scores.length === 0) return null
  const avg = scores.reduce((sum, n) => sum + n, 0) / scores.length
  return scoreToStatus(avg, passThreshold)
}

export function buildDayStatusByDate(
  assignments: readonly StudentAssignment[],
  passThreshold: number = DEFAULT_PASS_SCORE_THRESHOLD,
  now: Date = new Date(),
): Map<string, PraiseDayStatus> {
  const grouped = new Map<
    string,
    { statuses: PraiseDayStatus[]; scores: number[] }
  >()

  for (const assignment of assignments) {
    const parsed = parseDateKey(assignment.lessonDate)
    const dateKey = parsed
      ? toDateKey(parsed)
      : assignment.lessonDate.slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue

    const status = resolveAssignmentStatus(assignment, passThreshold, now)
    if (!status) continue

    const bucket = grouped.get(dateKey) ?? { statuses: [], scores: [] }
    bucket.statuses.push(status)
    if (status !== 'incomplete') {
      const score = assignment.latestScore ?? assignment.firstScore
      if (score != null) bucket.scores.push(score)
    }
    grouped.set(dateKey, bucket)
  }

  const result = new Map<string, PraiseDayStatus>()
  for (const [dateKey, bucket] of grouped) {
    const status = aggregateDayStatus(
      bucket.statuses,
      bucket.scores,
      passThreshold,
    )
    if (status) result.set(dateKey, status)
  }
  return result
}

export function summarizeMonth(
  assignments: readonly StudentAssignment[],
  year: number,
  monthIndex: number,
): PraiseMonthSummary {
  const inMonth = assignments.filter((assignment) => {
    const date = parseDateKey(assignment.lessonDate)
    return date?.getFullYear() === year && date.getMonth() === monthIndex
  })

  const total = inMonth.length
  const completed = inMonth.filter(
    (assignment) =>
      assignment.status === 'completed' || Boolean(assignment.completedAt),
  ).length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return { total, completed, percent }
}

/** 월요일 시작 그리드 (빈 칸 포함) */
export function buildMonthCells(
  year: number,
  monthIndex: number,
  statusByDate: Map<string, PraiseDayStatus>,
  todayKey: string,
): CalendarCell[] {
  const first = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const mondayOffset = (first.getDay() + 6) % 7

  const cells: CalendarCell[] = []

  for (let i = 0; i < mondayOffset; i += 1) {
    cells.push({
      key: `pad-start-${i}`,
      day: 0,
      inMonth: false,
      dateKey: null,
      status: null,
      isToday: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = toDateKey(new Date(year, monthIndex, day))
    cells.push({
      key: dateKey,
      day,
      inMonth: true,
      dateKey,
      status: statusByDate.get(dateKey) ?? null,
      isToday: dateKey === todayKey,
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `pad-end-${cells.length}`,
      day: 0,
      inMonth: false,
      dateKey: null,
      status: null,
      isToday: false,
    })
  }

  return cells
}
