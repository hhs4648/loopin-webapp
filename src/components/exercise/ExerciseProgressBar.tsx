import { getSessionProgressRatio, SESSION_TOTAL_STEPS } from './session-questions'

export const FRAME_W = 393
export const FRAME_H = 852

/**
 * 에셋에 구워진 옛 진행률 바.
 * 막대(33,141,326×18) + 바깥 스트로크(stroke 8 → 약 x 25~367, y 133~167).
 * 알약 덮개는 `#F0F5FA` 테두리를 남기므로, 여유 있는 **사각형**으로 덮는다.
 */
export const EXERCISE_PROGRESS_BAR_BAKED = { x: 12, y: 118, w: 370, h: 56 }

/**
 * 헤더 게이지 바깥 링(`#F0F5FA`) — 시안 스트로크 자리.
 * 안쪽 트랙은 이보다 4px 안(원래 막대 18px + 링 4px).
 */
export const EXERCISE_PROGRESS_BAR = { x: 62, y: 78, w: 218, h: 26 }

const TRACK_INSET = {
  top: `${(4 / EXERCISE_PROGRESS_BAR.h) * 100}%`,
  right: `${(4 / EXERCISE_PROGRESS_BAR.w) * 100}%`,
  bottom: `${(4 / EXERCISE_PROGRESS_BAR.h) * 100}%`,
  left: `${(4 / EXERCISE_PROGRESS_BAR.w) * 100}%`,
}

const HALO_OUTSET = {
  top: `${(-4 / EXERCISE_PROGRESS_BAR.h) * 100}%`,
  right: `${(-4 / EXERCISE_PROGRESS_BAR.w) * 100}%`,
  bottom: `${(-4 / EXERCISE_PROGRESS_BAR.h) * 100}%`,
  left: `${(-4 / EXERCISE_PROGRESS_BAR.w) * 100}%`,
}

/**
 * 에셋에 구워진 유형 제목(「짝맞추기」 등, 실측 x≈72~320 / y≈82~98).
 * 뒤로가기 다음~오른쪽 끝까지, **제목 줄만** 덮는다. 높이 52로 내리면
 * 헤더 아래 문제(스피커·카드, y 108~)를 지운다.
 */
export const EXERCISE_BAKED_TITLE_MASK = { x: 50, y: 76, w: 329, h: 26 }

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
  /** 전체 문항 수. 없으면 데모 세션 고정 합계 */
  totalSteps?: number
}

export function ExerciseProgressBar({
  sessionOffset,
  completedInSection,
  totalSteps = SESSION_TOTAL_STEPS,
}: ExerciseProgressBarProps) {
  const progressRatio = getSessionProgressRatio(
    sessionOffset,
    completedInSection,
    totalSteps,
  )
  const progressPercent = Math.round(progressRatio * 100)

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[20]"
      style={figmaRectStyle(EXERCISE_PROGRESS_BAR)}
    >
      <div className="absolute rounded-full bg-[#F0F5FA]" style={HALO_OUTSET} />
      <div
        className="absolute overflow-hidden rounded-full bg-[#E3E7EA]"
        style={{
          ...TRACK_INSET,
          boxShadow: 'inset 0 4px 4px rgba(166, 168, 180, 0.25)',
        }}
      >
        <p className="absolute inset-0 flex items-center justify-center text-[length:clamp(9px,2.6cqw,11px)] font-semibold leading-none tabular-nums text-[#9E9FA7]">
          {progressPercent}%
        </p>
        <div
          className="absolute inset-0 bg-[#3C86FF] transition-[clip-path] duration-300 ease-out"
          style={{ clipPath: `inset(0 ${100 - progressPercent}% 0 0)` }}
        >
          <p className="absolute inset-0 flex items-center justify-center text-[length:clamp(9px,2.6cqw,11px)] font-semibold leading-none tabular-nums text-white">
            {progressPercent}%
          </p>
        </div>
      </div>
    </div>
  )
}

/** SVG에 박힌 유형 제목 가림 — 문제 화면 공통 */
export function BakedExerciseTitleMask() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[8] bg-white"
      style={figmaRectStyle(EXERCISE_BAKED_TITLE_MASK)}
    />
  )
}

/** SVG에 박힌 진행률(퍼센트) 막대 가림 — 오답만 풀기 등 */
export function BakedProgressBarMask({ className = 'bg-white' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute z-[1] ${className}`}
      style={figmaRectStyle(EXERCISE_PROGRESS_BAR_BAKED)}
    />
  )
}
