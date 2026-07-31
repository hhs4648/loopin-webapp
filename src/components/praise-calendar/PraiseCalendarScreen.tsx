import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { StudentAssignment } from '../../lib/sync/types'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  buildDayStatusByDate,
  buildMonthCells,
  CALENDAR_CARD,
  CALENDAR_EPOCH,
  cellRectStyle,
  DEFAULT_PASS_SCORE_THRESHOLD,
  figmaRectStyle,
  formatYearMonthKo,
  monthCursorValue,
  MONTH_NEXT_BTN,
  MONTH_PREV_BTN,
  MONTH_TITLE_MASK,
  PRAISE_CALENDAR_ASSET,
  PRAISE_STATUS_FACE_ASSETS,
  PROGRESS_CARD,
  PROGRESS_HERO_FACE,
  PROGRESS_SUBTITLE,
  PROGRESS_TITLE,
  PROGRESS_TRACK,
  shiftMonth,
  STATUS_META,
  summarizeMonth,
  toDateKey,
  WEEKDAY_CENTERS_X,
  WEEKDAY_LABELS,
  WEEKDAY_Y,
  type PraiseDayStatus,
} from './praise-calendar'

/** 진입 시 시작 달 → 오늘 달까지 빠르게 넘기는 간격 */
const MONTH_ROLL_MS = 70

type PraiseCalendarScreenProps = {
  assignments?: StudentAssignment[]
  /** 선생님이 설정에서 정한 통과 기준 점수 (없으면 기본값 70) */
  passThreshold?: number
  /**
   * 캘린더 시작 달 — 학생이 앱을 시작한 달.
   * 이보다 이전 달로는 이동 불가. 없으면·그보다 이르면 2026년 7월.
   */
  startYear?: number
  startMonthIndex?: number
}

function StatusFaceImg({
  status,
  className,
  alt,
}: {
  status: PraiseDayStatus
  className?: string
  alt?: string
}) {
  return (
    <img
      src={PRAISE_STATUS_FACE_ASSETS[status]}
      alt={alt ?? ''}
      draggable={false}
      className={`pointer-events-none select-none object-contain ${className ?? ''}`}
    />
  )
}

function DayCell({
  day,
  status,
  isToday,
  style,
}: {
  day: number
  status: PraiseDayStatus | null
  isToday: boolean
  style: CSSProperties
}) {
  if (isToday && !status) {
    return (
      <div className="absolute z-[3] flex flex-col items-center" style={style}>
        <div className="flex h-full w-full flex-col items-center justify-center rounded-[13px] bg-[#2AA3FF]">
          <span className="font-['Pretendard',sans-serif] text-[13px] font-bold text-white">
            {day}
          </span>
        </div>
        <span className="absolute -bottom-3 font-['Pretendard',sans-serif] text-[8px] font-medium text-[#8B95A1]">
          Today
        </span>
      </div>
    )
  }

  if (status) {
    const meta = STATUS_META[status]
    return (
      <div className="absolute z-[3] flex flex-col items-center" style={style}>
        <div
          className="flex h-full w-full flex-col items-center rounded-[13px] border pt-0.5"
          style={{ background: meta.cellBg, borderColor: meta.cellBorder }}
          aria-label={`${day}일 ${meta.label}`}
        >
          <span
            className="font-['Pretendard',sans-serif] text-[11px] font-semibold leading-none"
            style={{ color: meta.dayColor }}
          >
            {day}
          </span>
          <StatusFaceImg
            status={status}
            className="mt-0.5 h-[30px] w-[30px]"
            alt={meta.label}
          />
        </div>
        {isToday ? (
          <span className="absolute -bottom-3 font-['Pretendard',sans-serif] text-[8px] font-medium text-[#8B95A1]">
            Today
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className="absolute z-[3] flex items-start justify-center pt-1"
      style={style}
    >
      <span className="font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#94A3B8]">
        {day}
      </span>
    </div>
  )
}

export function PraiseCalendarScreen({
  assignments = [],
  passThreshold = DEFAULT_PASS_SCORE_THRESHOLD,
  startYear,
  startMonthIndex,
}: PraiseCalendarScreenProps) {
  const today = useMemo(() => new Date(), [])
  const todayKey = toDateKey(today)
  const start = useMemo(() => {
    const y = startYear ?? CALENDAR_EPOCH.year
    const m = startMonthIndex ?? CALENDAR_EPOCH.monthIndex
    const epochValue = monthCursorValue(CALENDAR_EPOCH.year, CALENDAR_EPOCH.monthIndex)
    if (monthCursorValue(y, m) < epochValue) {
      return { year: CALENDAR_EPOCH.year, monthIndex: CALENDAR_EPOCH.monthIndex }
    }
    return { year: y, monthIndex: m }
  }, [startYear, startMonthIndex])

  const todayCursor = useMemo(
    () => ({ year: today.getFullYear(), monthIndex: today.getMonth() }),
    [today],
  )

  /** 진입 시 시작 달부터 오늘까지 쭉 넘기기 위해 시작 달에서 출발 */
  const [{ year, monthIndex }, setCursor] = useState(() => ({
    year: start.year,
    monthIndex: start.monthIndex,
  }))
  const [rolling, setRolling] = useState(false)
  const rollCancelRef = useRef(false)

  useEffect(() => {
    rollCancelRef.current = false
    const from = monthCursorValue(start.year, start.monthIndex)
    const to = monthCursorValue(todayCursor.year, todayCursor.monthIndex)
    if (to <= from) {
      setCursor({ year: todayCursor.year, monthIndex: todayCursor.monthIndex })
      return
    }

    setRolling(true)
    setCursor({ year: start.year, monthIndex: start.monthIndex })
    let current = from
    const timer = window.setInterval(() => {
      if (rollCancelRef.current) {
        window.clearInterval(timer)
        setRolling(false)
        return
      }
      current += 1
      setCursor({
        year: Math.floor(current / 12),
        monthIndex: current % 12,
      })
      if (current >= to) {
        window.clearInterval(timer)
        setRolling(false)
      }
    }, MONTH_ROLL_MS)

    return () => {
      rollCancelRef.current = true
      window.clearInterval(timer)
      setRolling(false)
    }
    // 진입 시 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statusByDate = useMemo(
    () => buildDayStatusByDate(assignments, passThreshold),
    [assignments, passThreshold],
  )
  const summary = useMemo(
    () => summarizeMonth(assignments, year, monthIndex),
    [assignments, year, monthIndex],
  )
  const cells = useMemo(
    () => buildMonthCells(year, monthIndex, statusByDate, todayKey),
    [year, monthIndex, statusByDate, todayKey],
  )

  const cursorValue = monthCursorValue(year, monthIndex)
  const canGoPrev =
    !rolling && cursorValue > monthCursorValue(start.year, start.monthIndex)
  /** 2026년 7월부터 이후 달로 계속 넘길 수 있음 */
  const canGoNext = !rolling

  return (
    <FigmaAssetFrame
      src={PRAISE_CALENDAR_ASSET}
      alt="칭찬 캘린더"
      bgClassName="bg-[#E2F7FF]"
      backButton="labeled"
    >
      {/* 구워진 연·월 글자 가림 */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[2] bg-[#E2F7FF]"
        style={figmaRectStyle(MONTH_TITLE_MASK)}
      />
      <p
        className="pointer-events-none absolute z-[3] flex items-center justify-center font-['Pretendard',sans-serif] text-[18px] font-bold text-[#1E242F]"
        style={figmaRectStyle(MONTH_TITLE_MASK)}
        aria-live="polite"
      >
        {formatYearMonthKo(year, monthIndex)}
      </p>
      <button
        type="button"
        aria-label="이전 달"
        disabled={!canGoPrev}
        className="absolute z-[4] cursor-pointer bg-transparent disabled:cursor-default"
        style={figmaRectStyle(MONTH_PREV_BTN)}
        onClick={() => {
          if (!canGoPrev) return
          setCursor((prev) => shiftMonth(prev.year, prev.monthIndex, -1))
        }}
      />
      <button
        type="button"
        aria-label="다음 달"
        disabled={!canGoNext}
        className="absolute z-[4] cursor-pointer bg-transparent disabled:cursor-default"
        style={figmaRectStyle(MONTH_NEXT_BTN)}
        onClick={() => {
          if (!canGoNext) return
          setCursor((prev) => shiftMonth(prev.year, prev.monthIndex, 1))
        }}
      />

      {/* 달성 카드 — SVG 예시 덮고 실데이터 */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[2] rounded-[24px] bg-white"
        style={figmaRectStyle(PROGRESS_CARD)}
      />
      <div
        className="pointer-events-none absolute z-[3]"
        style={figmaRectStyle(PROGRESS_HERO_FACE)}
      >
        <StatusFaceImg status="pass" className="h-full w-full" alt="" />
      </div>
      <p
        className="pointer-events-none absolute z-[3] flex items-center font-['Pretendard',sans-serif] text-[16px] font-bold leading-tight text-[#1E293B]"
        style={figmaRectStyle(PROGRESS_TITLE)}
      >
        이번 달 {summary.percent}% 달성 중 ✨
      </p>
      <p
        className="pointer-events-none absolute z-[3] flex items-center font-['Pretendard',sans-serif] text-[12px] font-medium text-[#2563EB]"
        style={figmaRectStyle(PROGRESS_SUBTITLE)}
      >
        {summary.total}개 중 {summary.completed}개 완료
        {summary.completed > 0 ? ' · 최고 기록!' : ''}
      </p>
      <div
        className="pointer-events-none absolute z-[3] overflow-hidden rounded-full bg-[#E8F1FA]"
        style={figmaRectStyle(PROGRESS_TRACK)}
      >
        <div
          className="h-full rounded-full bg-[#3B82F6]"
          style={{ width: `${Math.min(100, summary.percent)}%` }}
        />
      </div>

      {/* 달력 카드 본문 — 범례·탭은 SVG 유지 */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[2] rounded-[24px] bg-white"
        style={figmaRectStyle(CALENDAR_CARD)}
      />

      {WEEKDAY_LABELS.map((label, index) => {
        const cx = WEEKDAY_CENTERS_X[index]!
        return (
          <span
            key={label}
            className="pointer-events-none absolute z-[3] -translate-x-1/2 font-['Pretendard',sans-serif] text-[12px] font-medium text-[#AAB1BD]"
            style={{
              left: `${(cx / 393) * 100}%`,
              top: `${(WEEKDAY_Y / 852) * 100}%`,
            }}
          >
            {label}
          </span>
        )
      })}

      {cells.map((cell, index) => {
        if (!cell.inMonth) return null
        const col = index % 7
        const row = Math.floor(index / 7)
        return (
          <DayCell
            key={cell.key}
            day={cell.day}
            status={cell.status}
            isToday={cell.isToday}
            style={cellRectStyle(col, row)}
          />
        )
      })}
    </FigmaAssetFrame>
  )
}
