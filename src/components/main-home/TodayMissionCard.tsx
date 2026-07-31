import {
  cardRectStyle,
  figmaRectStyle,
  getRemainingCount,
  getRemainingMinutes,
  MISSION_BADGE_RECT,
  MISSION_BUTTON_RECT,
  MISSION_CARD_RECT,
  MISSION_PROGRESS_TRACK_RECT,
  MISSION_SUBTITLE_RECT,
  MISSION_TITLE_RECT,
  pickPrimaryAssignment,
} from './today-mission'
import type { StudentAssignment } from '../../lib/sync/types'

type TodayMissionCardProps = {
  assignments: StudentAssignment[]
  onOpen: (assignment: StudentAssignment) => void
}

/** Figma export `current-learning-cta-card.svg`를 그대로 옮긴 좌표 기반 카드 — 실데이터만 얹는다 */
export function TodayMissionCard({ assignments, onOpen }: TodayMissionCardProps) {
  const assignment = pickPrimaryAssignment(assignments)
  const remainingCount = assignment ? getRemainingCount(assignment) : 0
  const remainingMinutes = getRemainingMinutes(remainingCount)
  const started = !!assignment && assignment.progressPercent > 0
  const fillPercent = assignment ? Math.min(100, Math.max(0, assignment.progressPercent)) : 0
  const percentLabel = `${Math.round(fillPercent)}%`

  return (
    <div
      className={`pointer-events-auto absolute rounded-[18px] shadow-[0_0_20px_rgba(46,90,130,0.22)] ${
        !assignment && assignments.length > 0
          ? 'border border-[#D6EBFF] bg-gradient-to-br from-white via-white to-[#EDF6FF]'
          : 'bg-white'
      }`}
      style={figmaRectStyle(MISSION_CARD_RECT)}
    >
      {assignment ? (
        <>
          <div
            className="absolute flex items-center justify-center whitespace-nowrap rounded-full bg-[#4F91EB] px-3"
            style={{ ...cardRectStyle(MISSION_BADGE_RECT), width: 'auto' }}
          >
            <p className="whitespace-nowrap text-[14px] font-semibold leading-none text-white">
              {started ? '현재 학습 중' : '오늘의 미션'}
            </p>
          </div>

          <div
            className="absolute flex items-center"
            style={cardRectStyle(MISSION_TITLE_RECT)}
          >
            <p className="truncate text-[23px] font-bold leading-tight text-[#1F242E]">
              {assignment.title}
            </p>
          </div>

          <div
            className="absolute flex items-center"
            style={cardRectStyle(MISSION_SUBTITLE_RECT)}
          >
            <p className="truncate text-[16px] font-normal leading-none text-[#6B7382]">
              {remainingCount > 0
                ? `약 ${remainingMinutes}분 소요`
                : '오늘의 미션을 모두 풀었어요!'}
            </p>
          </div>

          <div
            className="absolute flex items-center gap-2"
            style={{
              ...cardRectStyle({
                x: MISSION_PROGRESS_TRACK_RECT.x,
                y: MISSION_PROGRESS_TRACK_RECT.y - 4,
                w: MISSION_PROGRESS_TRACK_RECT.w + 48,
                h: MISSION_PROGRESS_TRACK_RECT.h + 8,
              }),
            }}
          >
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#D9E3F7]">
              {fillPercent > 0 && (
                <div
                  className="h-full rounded-full bg-[#4F91EB] transition-[width] duration-300 ease-out"
                  style={{ width: `${fillPercent}%` }}
                />
              )}
            </div>
            <span className="shrink-0 text-[13px] font-semibold leading-none tabular-nums text-[#4F91EB]">
              {percentLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpen(assignment)}
            className="pointer-events-auto absolute flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] bg-[#4F91EB] px-2 text-center text-[15px] font-semibold leading-none text-white active:opacity-90"
            style={cardRectStyle(MISSION_BUTTON_RECT)}
          >
            <span>{started ? '이어서 학습하기' : '시작하기'}</span>
            <svg
              aria-hidden
              className="shrink-0"
              width="28"
              height="10"
              viewBox="0 0 28 10"
              fill="none"
            >
              <path
                d="M1 5H24.5M20 1.5L25.5 5L20 8.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      ) : assignments.length === 0 ? (
        <div className="flex h-full items-center gap-3.5 px-5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF]"
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F91EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="5" width="16" height="16" rx="3" />
              <path d="M8 3v4M16 3v4M4 10h16" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate font-['Pretendard',sans-serif] text-[15px] font-bold text-[#1F242E]">
              아직 배정된 과제가 없어요
            </p>
            <p className="mt-0.5 truncate font-['Pretendard',sans-serif] text-[12px] font-medium text-[#6B7382]">
              선생님이 과제를 내주시면 여기에 표시돼요
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            className="absolute flex items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-[#5BA3F5] to-[#4F91EB] px-3 shadow-[0_2px_6px_rgba(79,145,235,0.28)]"
            style={{ ...cardRectStyle(MISSION_BADGE_RECT), width: 'auto' }}
          >
            <p className="whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] font-semibold leading-none text-white">
              오늘 완료
            </p>
          </div>

          <div
            className="absolute flex items-center"
            style={cardRectStyle(MISSION_TITLE_RECT)}
          >
            <p className="truncate font-['Pretendard',sans-serif] text-[23px] font-bold leading-tight text-[#1F242E]">
              오늘의 미션을 모두 완료했어요!
            </p>
          </div>

          <div
            className="absolute flex items-center"
            style={cardRectStyle(MISSION_SUBTITLE_RECT)}
          >
            <p className="truncate font-['Pretendard',sans-serif] text-[16px] font-normal leading-none text-[#6B7382]">
              수고했어요, 내일도 함께 해요
            </p>
          </div>

          <div
            className="absolute flex items-center gap-2"
            style={{
              ...cardRectStyle({
                x: MISSION_PROGRESS_TRACK_RECT.x,
                y: MISSION_PROGRESS_TRACK_RECT.y - 4,
                w: MISSION_PROGRESS_TRACK_RECT.w + 48,
                h: MISSION_PROGRESS_TRACK_RECT.h + 8,
              }),
            }}
          >
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#D9E3F7]">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-[#5BA3F5] to-[#4F91EB]" />
            </div>
            <span className="shrink-0 text-[13px] font-semibold leading-none tabular-nums text-[#4F91EB]">
              100%
            </span>
          </div>
        </>
      )}
    </div>
  )
}
