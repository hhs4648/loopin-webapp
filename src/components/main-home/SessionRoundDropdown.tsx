import { useEffect, useMemo, useRef, useState } from 'react'
import type { StudentAssignment } from '../../lib/sync/types'
import {
  dialogPanelStyle,
  formatAssignmentLessonDate,
  formatClassAssignmentPill,
  FRAME_H,
  PILL,
  PILL_DIMMED_SURFACE,
  resolveCurrentLocationAssignment,
  SESSION_ROUNDS,
  type SessionRound,
} from './session-round-dropdown'

const SCROLL_LIST_CLASS =
  'min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

type SessionRoundDropdownProps = {
  /** 선생님 웹에서 지정한 반 이름 — 예: `A반` */
  className?: string
  /** 서버 과제 목록(order 순). 없으면 데모 SESSION_ROUNDS */
  assignments?: StudentAssignment[]
  /** 초대/대기 미리보기 — 딤 처리·비활성 */
  surface?: 'pill' | 'dimmed'
  /**
   * 필 top(프레임 y). 생략 시 `PILL.y`.
   * 완료 화면 등 상태바 아래 배치용.
   */
  topY?: number
  /** 루트 z-index 클래스 (기본 z-20) */
  zClassName?: string
}

function SessionDropdownPanel({
  className,
  assignments,
  selectedId,
  currentLocationId,
  onSelectAssignment,
  fallbackRounds,
  selectedFallbackId,
  onSelectFallback,
  pillTopY,
}: {
  className: string
  assignments: StudentAssignment[]
  selectedId: string | null
  /** 맵 현재 위치에 해당하는 과제 id */
  currentLocationId: string | null
  onSelectAssignment: (a: StudentAssignment) => void
  fallbackRounds: SessionRound[]
  selectedFallbackId: number
  onSelectFallback: (round: SessionRound) => void
  pillTopY: number
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const useServer = assignments.length > 0

  useEffect(() => {
    const key = useServer ? selectedId : String(selectedFallbackId)
    const selectedEl = listRef.current?.querySelector<HTMLElement>(
      `[data-round-id="${key}"]`,
    )
    selectedEl?.scrollIntoView({ block: 'nearest' })
  }, [selectedId, selectedFallbackId, useServer])

  return (
    <div
      className="pointer-events-auto absolute z-30 flex flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)]"
      style={dialogPanelStyle(pillTopY)}
      role="presentation"
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 -translate-y-full border-x-[7px] border-b-[7px] border-x-transparent border-b-white"
      />

      <div
        ref={listRef}
        role="listbox"
        aria-label="과제 선택"
        className={`${SCROLL_LIST_CLASS} max-h-[200px] px-2 pb-2 pt-2`}
      >
        {useServer
          ? assignments.map((assignment) => {
              const isSelected = assignment.assignmentId === selectedId
              const isCurrentLocation =
                assignment.assignmentId === currentLocationId
              return (
                <button
                  key={assignment.assignmentId}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-round-id={assignment.assignmentId}
                  className={`w-full rounded-xl px-2 py-2 text-center ${
                    isSelected ? 'bg-[#EFF6FF]' : 'bg-transparent'
                  }`}
                  onClick={() => onSelectAssignment(assignment)}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`min-w-0 truncate font-['Pretendard',sans-serif] text-[16px] font-semibold leading-5 ${
                        isSelected ? 'text-[#155DFC]' : 'text-[#0A0A0A]'
                      }`}
                    >
                      {formatClassAssignmentPill(className, assignment.title)}
                    </span>
                    {isCurrentLocation ? (
                      <span className="shrink-0 rounded-full bg-[#DBEAFE] px-2 py-0.5 font-['Pretendard',sans-serif] text-[11px] font-medium leading-4 text-[#155DFC]">
                        현재 위치
                      </span>
                    ) : null}
                  </div>
                  <p className="font-['Pretendard',sans-serif] text-[12px] leading-4 text-[#9AA3B0]">
                    {formatAssignmentLessonDate(assignment.lessonDate)}
                  </p>
                </button>
              )
            })
          : fallbackRounds.map((round) => {
              const isSelected = round.id === selectedFallbackId
              return (
                <button
                  key={round.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-round-id={round.id}
                  className={`w-full rounded-xl px-2 py-2 text-center ${
                    isSelected ? 'bg-[#EFF6FF]' : 'bg-transparent'
                  }`}
                  onClick={() => onSelectFallback(round)}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`font-['Pretendard',sans-serif] text-[16px] font-semibold leading-5 ${
                        isSelected ? 'text-[#155DFC]' : 'text-[#0A0A0A]'
                      }`}
                    >
                      {formatClassAssignmentPill(className, round.label)}
                    </span>
                    {round.isCurrent ? (
                      <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 font-['Pretendard',sans-serif] text-[11px] font-medium leading-4 text-[#155DFC]">
                        현재 위치
                      </span>
                    ) : null}
                  </div>
                  <p className="font-['Pretendard',sans-serif] text-[12px] leading-4 text-[#9AA3B0]">
                    {round.date}
                  </p>
                </button>
              )
            })}
      </div>
    </div>
  )
}

/**
 * 학원 학생 홈 상단 — `A반 3회차` 형태 드롭다운.
 * 반 이름·과제 제목은 선생님 웹에서 지정한 값을 그대로 쓴다.
 */
export function SessionRoundDropdown({
  className = 'A반',
  assignments = [],
  surface = 'pill',
  topY,
  zClassName = 'z-20',
}: SessionRoundDropdownProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fallbackId, setFallbackId] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const sortedAssignments = useMemo(
    () => [...assignments].sort((a, b) => a.order - b.order),
    [assignments],
  )

  const currentLocationId = useMemo(
    () => resolveCurrentLocationAssignment(sortedAssignments)?.assignmentId ?? null,
    [sortedAssignments],
  )

  useEffect(() => {
    if (sortedAssignments.length === 0) {
      setSelectedId(null)
      return
    }
    setSelectedId((current) => {
      if (current && sortedAssignments.some((a) => a.assignmentId === current)) {
        return current
      }
      // 맵 현재 위치 과제 → 없으면 미완료 최우선 → 첫 과제
      if (
        currentLocationId &&
        sortedAssignments.some((a) => a.assignmentId === currentLocationId)
      ) {
        return currentLocationId
      }
      const primary =
        sortedAssignments.find((a) => a.status !== 'completed') ??
        sortedAssignments[0]!
      return primary.assignmentId
    })
  }, [sortedAssignments, currentLocationId])

  const selectedAssignment = sortedAssignments.find(
    (a) => a.assignmentId === selectedId,
  )
  const fallbackRound =
    SESSION_ROUNDS.find((r) => r.id === fallbackId) ?? SESSION_ROUNDS[0]!

  const pillLabel = selectedAssignment
    ? formatClassAssignmentPill(className, selectedAssignment.title)
    : formatClassAssignmentPill(className, fallbackRound.label)

  useEffect(() => {
    if (!open || surface === 'dimmed') return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open, surface])

  const isDimmed = surface === 'dimmed'
  const resolvedTopY = topY ?? PILL.y
  const pillTopPct = (resolvedTopY / FRAME_H) * 100

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 ${zClassName}`}
    >
      <button
        type="button"
        aria-label="반·과제 선택"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isDimmed}
        className={`pointer-events-auto absolute left-1/2 flex max-w-[92%] -translate-x-1/2 items-center gap-2.5 rounded-[16px] px-5 py-3.5 font-['Pretendard',sans-serif] text-[17px] font-bold leading-none tracking-[-0.02em] shadow-[0_2px_10px_rgba(30,36,47,0.12)] ${
          isDimmed
            ? 'cursor-default text-[#1E242F]'
            : 'cursor-pointer bg-white text-[#1E242F]'
        }`}
        style={{
          top: `${pillTopPct}%`,
          minHeight: `${(PILL.h / FRAME_H) * 100}%`,
          backgroundColor: isDimmed ? PILL_DIMMED_SURFACE : '#FFFFFF',
        }}
        onClick={() => {
          if (!isDimmed) setOpen((value) => !value)
        }}
      >
        <span className="min-w-0 truncate">{pillLabel}</span>
        <svg
          aria-hidden
          width="14"
          height="9"
          viewBox="0 0 11 7"
          fill="none"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M9.5 1.5L5.5 5.5L1.5 1.5"
            stroke="#4A93EE"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && !isDimmed ? (
        <SessionDropdownPanel
          className={className}
          assignments={sortedAssignments}
          selectedId={selectedId}
          currentLocationId={currentLocationId}
          pillTopY={resolvedTopY}
          onSelectAssignment={(a) => {
            setSelectedId(a.assignmentId)
            setOpen(false)
          }}
          fallbackRounds={SESSION_ROUNDS}
          selectedFallbackId={fallbackId}
          onSelectFallback={(round) => {
            setFallbackId(round.id)
            setOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
