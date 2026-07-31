import type { StudentAssignment } from '../../lib/sync/types'

export const FRAME_W = 393
export const FRAME_H = 852

/** Figma Export — `praise-calendar-source.png`(실제 SVG) → `praise-calendar.svg` */
export const PRAISE_CALENDAR_ASSET = '/assets/praise-calendar.svg?v=1'

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

/** Figma — 달력 카드 (범례·하단 탭은 SVG 유지) */
export const CALENDAR_CARD = { x: 20, y: 299, w: 353, h: 332 }

export const WEEKDAY_Y = 316
export const WEEKDAY_CENTERS_X = [55.1, 102.4, 149.4, 196.5, 243.6, 290.6, 337.5] as const

export const GRID_ORIGIN = { x: 36, y: 339 }
export const CELL_W = 38
export const CELL_H = 48
export const COL_GAP = 9
export const ROW_GAP = 8
export const CELL_PITCH_X = CELL_W + COL_GAP
export const CELL_PITCH_Y = CELL_H + ROW_GAP
export const FACE_SIZE = 30

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

export function cellRectStyle(col: number, row: number) {
  return figmaRectStyle({
    x: GRID_ORIGIN.x + col * CELL_PITCH_X,
    y: GRID_ORIGIN.y + row * CELL_PITCH_Y,
    w: CELL_W,
    h: CELL_H,
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
