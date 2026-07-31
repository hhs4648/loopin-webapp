import {
  COLOR_CORRECT_BG,
  COLOR_WRONG_BG,
  EXERCISE_CTA_CLASS,
  EXERCISE_FEEDBACK_HINT_CLASS,
  exerciseFeedbackTitleClass,
} from './exercise-typography'
import { useEnterToContinue } from './use-enter-to-continue'

/** 제출하기와 동일 슬롯 — 계속하기도 여기 */
export const EXERCISE_CONTINUE_BTN = { x: 30, y: 751, w: 333, h: 60 } as const

type Rect = { x: number; y: number; w: number; h: number }

function rectStyle(rect: Rect) {
  return {
    left: `${(rect.x / 393) * 100}%`,
    top: `${(rect.y / 852) * 100}%`,
    width: `${(rect.w / 393) * 100}%`,
    height: `${(rect.h / 852) * 100}%`,
  }
}

type ExerciseContinueButtonProps = {
  kind: 'correct' | 'wrong'
  /** 기본 = 제출하기와 동일 슬롯 */
  rect?: Rect
  onContinue?: () => void
  /** 시트 없이 버튼 위 안내 (정답/오답 제목·힌트) */
  title?: string
  hint?: string
}

/**
 * 정·오답 후 「계속하기」 — 하단 팝업 시트 대신 제출하기와 같은 위치의 단색 버튼.
 * 탭 사운드는 호출측 `onContinue`에서 처리.
 */
export function ExerciseContinueButton({
  kind,
  rect = EXERCISE_CONTINUE_BTN,
  onContinue,
  title,
  hint,
}: ExerciseContinueButtonProps) {
  useEnterToContinue(onContinue)

  const isCorrect = kind === 'correct'
  const showCopy = Boolean(title || hint)

  return (
    <>
      {showCopy ? (
        <div
          aria-live="polite"
          className="pointer-events-none absolute z-20 flex flex-col items-center justify-end px-8 pb-2"
          style={rectStyle({ x: 0, y: 620, w: 393, h: 120 })}
        >
          {title ? (
            <p className={exerciseFeedbackTitleClass(isCorrect)}>{title}</p>
          ) : null}
          {hint ? <p className={EXERCISE_FEEDBACK_HINT_CLASS}>{hint}</p> : null}
        </div>
      ) : null}
      {onContinue ? (
        <button
          type="button"
          aria-label="계속하기"
          className={`absolute z-20 flex cursor-pointer items-center justify-center rounded-2xl border border-white ${EXERCISE_CTA_CLASS} ${
            isCorrect ? COLOR_CORRECT_BG : COLOR_WRONG_BG
          }`}
          style={rectStyle(rect)}
          onClick={onContinue}
        >
          계속하기
        </button>
      ) : null}
    </>
  )
}
