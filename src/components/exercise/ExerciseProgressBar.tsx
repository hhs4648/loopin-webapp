import { EXERCISE_PROGRESS_CLASS } from './exercise-typography'
import { getSessionProgressRatio, SESSION_TOTAL_STEPS } from './session-questions'

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
      className="pointer-events-none absolute z-[15]"
      style={figmaRectStyle(EXERCISE_PROGRESS_BAR)}
    >
      {/*
        **알약 하나로 그린다.**
        예전에는 시안에 구워진 막대를 가리는 회색 사각(`-inset-3`, r12)을 깔고 그 위에
        트랙(r9)을 또 얹었다. 반지름이 서로 달라서 양 끝이 뭉툭하게 겹쳐 보였고,
        파란 막대 둘레에 회색 테가 한 겹 도는 것처럼 보였다. 지금은 바깥 알약 하나가
        곧 트랙이다 — 구워진 막대도 이 하나로 덮인다.
      */}
      <div className="absolute -inset-[3px] overflow-hidden rounded-full bg-[#E3E7EA]">
        <p
          className={`absolute inset-0 flex items-center justify-center leading-none ${EXERCISE_PROGRESS_CLASS}`}
        >
          {progressPercent}%
        </p>
        {/*
          채운 부분은 **같은 크기의 레이어를 잘라서** 보여준다. 퍼센트 글자를 한 번 더
          흰색으로 얹어 두면, 막대가 글자를 지날 때 글자 색이 자연스럽게 넘어간다.
          (가운데 정렬 글자 하나만 두면 파란 막대 위에서 회색 글자가 읽히지 않는다.)
        */}
        <div
          className="absolute inset-0 bg-[#3C86FF] transition-[clip-path] duration-300 ease-out"
          style={{ clipPath: `inset(0 ${100 - progressPercent}% 0 0)` }}
        >
          <p
            className={`absolute inset-0 flex items-center justify-center leading-none ${EXERCISE_PROGRESS_CLASS} text-white`}
          >
            {progressPercent}%
          </p>
        </div>
      </div>
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
