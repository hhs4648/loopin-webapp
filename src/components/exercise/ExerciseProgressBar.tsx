import { EXERCISE_PROGRESS_CLASS } from './exercise-typography'
import { getSessionProgressRatio } from './session-questions'

export const FRAME_W = 393
export const FRAME_H = 852

/** Figma — 상단 진행률 바 (공통, SVG 내장 진행률 가림) */
export const EXERCISE_PROGRESS_BAR = { x: 33, y: 141, w: 326, h: 18 }

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

type ExerciseProgressBarProps = {
  /** 세션 내 이 유형 시작 전 완료된 문제 수 */
  sessionOffset: number
  /** 현재 유형에서 완료한 문제 수 */
  completedInSection: number
}

export function ExerciseProgressBar({
  sessionOffset,
  completedInSection,
}: ExerciseProgressBarProps) {
  const progressRatio = getSessionProgressRatio(sessionOffset, completedInSection)
  const progressPercent = Math.round(progressRatio * 100)
  const fillWidth = progressPercent > 0 ? `${progressRatio * 100}%` : '0px'

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[15] flex items-center justify-center"
      style={figmaRectStyle(EXERCISE_PROGRESS_BAR)}
    >
      {/* SVG에 박힌 진행률(회색·파란 막대)을 완전히 덮는 불투명 마스크 */}
      <div className="absolute -inset-[3px] rounded-[12px] bg-[#E3E7EA]" />
      <div className="absolute inset-0 overflow-hidden rounded-[9px] bg-[#E3E7EA]">
        {progressPercent > 0 && (
          <div
            className="h-full rounded-[9px] bg-[#3C86FF] transition-[width] duration-300 ease-out"
            style={{ width: fillWidth }}
          />
        )}
      </div>
      <p className={`relative z-10 leading-none ${EXERCISE_PROGRESS_CLASS}`}>
        {progressPercent}%
      </p>
    </div>
  )
}

/** SVG에 박힌 진행률(퍼센트) 막대 가림 — 오답만 풀기 등 */
export function BakedProgressBarMask({ className = 'bg-white' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[15]"
      style={figmaRectStyle(EXERCISE_PROGRESS_BAR)}
    >
      <div className={`absolute -inset-[3px] rounded-[12px] ${className}`} />
    </div>
  )
}
