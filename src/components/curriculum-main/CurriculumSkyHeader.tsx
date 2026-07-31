import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  FRAME_H,
  FRAME_W,
  SKY_H,
  type CurriculumCourseSelection,
  formatCourseListLabel,
} from './curriculum-main'

/** 하늘 영역 안 상대 좌표 → % (하늘 박스 기준) */
function skyStyle(rect: { x: number; y: number; w: number; h: number }): CSSProperties {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / SKY_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / SKY_H) * 100}%`,
  }
}

function TrashIcon() {
  return (
    <svg aria-hidden width="16" height="18" viewBox="0 0 16 18" fill="none">
      <path
        d="M1 4.5h14M5.5 4.5V3a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 10.5 3v1.5M3 4.5l.8 11.2A1.5 1.5 0 0 0 5.3 17h5.4a1.5 1.5 0 0 0 1.5-1.3L13 4.5"
        stroke="#888888"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 8v5.5M9.5 8v5.5"
        stroke="#888888"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * `커리큘럼 드롭다운.svg` 시안 — 선택 코스 행 + 삭제 + 「새 코스 추가하기」
 */
function CourseDropdownPanel({
  selection,
  onSelect,
  onDelete,
  onAddCourse,
}: {
  selection: CurriculumCourseSelection
  onSelect: () => void
  onDelete: () => void
  onAddCourse: () => void
}) {
  const label = formatCourseListLabel(selection)

  return (
    <div
      role="listbox"
      aria-label="코스 선택"
      className="pointer-events-auto absolute z-40 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.06)]"
      style={{
        left: '50%',
        top: `${((96 + 36 + 8) / SKY_H) * 100}%`,
        width: `${(320 / FRAME_W) * 100}%`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-2 rounded-xl bg-[#EFF6FF] px-3 py-2.5">
        <button
          type="button"
          role="option"
          aria-selected
          className="min-w-0 flex-1 truncate text-left font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#155DFC]"
          onClick={onSelect}
        >
          {label}
        </button>
        <button
          type="button"
          aria-label="코스 삭제"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg active:bg-[#E0E7FF]"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <TrashIcon />
        </button>
      </div>

      <div className="mx-1 my-2 h-px bg-[#E5E7EB]" />

      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left active:bg-[#F8FAFC]"
        onClick={onAddCourse}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4F91EB]/[0.12]">
          <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 2.5v9M2.5 7h9"
              stroke="#4F91EB"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="font-['Pretendard',sans-serif] text-[14px] font-semibold text-[#4F91EB]">
          새 코스 추가하기
        </span>
      </button>
    </div>
  )
}

/**
 * `커리큘럼 메인화면` 하늘 —
 * 타이틀 · (학년·교재·단원) 칩 · 학교/학원 메인과 같은 미션 카드 UI.
 * 칩 클릭 시 `커리큘럼 드롭다운` 시안 패널을 연다.
 */
export function CurriculumSkyHeader({
  courseTitle = '특별 내신코스',
  courseSubtitle = '혼자 공부 · 내신 코스',
  selection,
  progressPercent = 0,
  onAddCourse,
  onDeleteCourse,
}: {
  courseTitle?: string
  courseSubtitle?: string
  selection: CurriculumCourseSelection
  progressPercent?: number
  onAddCourse: () => void
  onDeleteCourse: () => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectionLabel = formatCourseListLabel(selection)

  const titleY = 52
  /** 칩: 내용 폭 + 가운데 정렬 (하늘 y만 고정) */
  const dropdownY = 96
  const dropdownH = 36
  const card = { x: 20, y: 148, w: 353, h: 116 }

  const fill = Math.min(100, Math.max(0, progressPercent))
  const notStarted = fill <= 0

  useEffect(() => {
    if (!open) return

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
  }, [open])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-x-0 top-0 z-20"
      style={{
        height: `${(SKY_H / FRAME_H) * 100}%`,
        background:
          'linear-gradient(180deg, #FFFFFF 0%, #F2FAFF 35%, #D9F3FF 65%, #CFF2FF 85%, #BFE8FF 100%)',
      }}
    >
      <div
        className="absolute flex items-baseline gap-2 px-1"
        style={skyStyle({ x: 22, y: titleY, w: 350, h: 36 })}
      >
        <h1 className="shrink-0 font-['Pretendard',sans-serif] text-[22px] font-bold leading-none tracking-[-0.02em] text-[#1F242E]">
          {courseTitle}
        </h1>
        <p className="truncate font-['Pretendard',sans-serif] text-[13px] font-medium leading-none text-[#9AA3B0]">
          {courseSubtitle}
        </p>
      </div>

      <button
        type="button"
        aria-label={`코스 선택 ${selectionLabel}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="pointer-events-auto absolute left-1/2 flex max-w-[88%] -translate-x-1/2 items-center gap-1.5 rounded-[12px] bg-white px-3.5 shadow-[0_4px_14px_rgba(46,90,130,0.14)]"
        style={{
          top: `${(dropdownY / SKY_H) * 100}%`,
          height: `${(dropdownH / SKY_H) * 100}%`,
          width: 'max-content',
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#1F242E]">
          {selectionLabel}
        </span>
        <svg
          aria-hidden
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M1.5 1.25L5 4.75L8.5 1.25"
            stroke="#4A93EE"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <CourseDropdownPanel
          selection={selection}
          onSelect={() => setOpen(false)}
          onDelete={() => {
            setOpen(false)
            onDeleteCourse()
          }}
          onAddCourse={() => {
            setOpen(false)
            onAddCourse()
          }}
        />
      ) : null}

      {/* 학교/학원 메인 미션 카드와 동일 구조 — 0%면 시작 전 카피.
          드롭다운이 열리면 카드 아래로 깔리도록 z를 낮춘다. */}
      <div
        className={`absolute flex flex-col justify-between rounded-[18px] bg-white px-5 py-4 shadow-[0_0_20px_rgba(46,90,130,0.22)] ${
          open ? 'z-10' : 'z-0'
        }`}
        style={skyStyle(card)}
      >
        <div className="min-w-0">
          <div
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1 ${
              notStarted
                ? 'bg-[#4F91EB]'
                : 'bg-gradient-to-r from-[#5BA3F5] to-[#4F91EB] shadow-[0_2px_6px_rgba(79,145,235,0.28)]'
            }`}
          >
            <span className="font-['Pretendard',sans-serif] text-[12px] font-semibold leading-none text-white">
              {notStarted ? '오늘의 미션' : '현재 학습 중'}
            </span>
          </div>

          <p className="mt-2.5 truncate font-['Pretendard',sans-serif] text-[18px] font-bold leading-tight text-[#1F242E]">
            {notStarted
              ? '오늘의 미션을 시작해 볼까요?'
              : '학습을 이어가 볼까요?'}
          </p>
          <p className="mt-1 truncate font-['Pretendard',sans-serif] text-[13px] font-normal leading-none text-[#6B7382]">
            {notStarted
              ? '첫 학습을 시작하면 진도가 표시돼요'
              : '이어서 학습하면 진도가 올라가요'}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#D9E3F7]">
            {fill > 0 ? (
              <div
                className="h-full rounded-full bg-[#4F91EB]"
                style={{ width: `${fill}%` }}
              />
            ) : null}
          </div>
          <span className="shrink-0 font-['Pretendard',sans-serif] text-[13px] font-semibold leading-none tabular-nums text-[#4F91EB]">
            {Math.round(fill)}%
          </span>
        </div>
      </div>
    </div>
  )
}
