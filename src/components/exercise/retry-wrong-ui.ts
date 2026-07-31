import { useEffect, useRef } from 'react'
import { figmaRectStyle as figmaRectStyleFromBar } from './ExerciseProgressBar'

export const FRAME_W = 393
export const FRAME_H = 852

/** Figma — 오답만 풀기 완료 시트 (하단) */
export const RETRY_WRONG_COMPLETE_SHEET = { x: 0, y: 648, w: 393, h: 204 }

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return figmaRectStyleFromBar(rect)
}

export type RetryWrongExerciseProps = {
  hideProgressBar?: boolean
  isFinalRetrySection?: boolean
  onRetryFlowHome?: () => void
  /** 과제 동기화 등 동적 세션의 전체 문항 수 */
  sessionTotalSteps?: number
}

/**
 * 오답 재도전 등에서 문항 0개로 들어온 화면 — 다음 섹션으로 넘김.
 * (undefined → 전체 은행 fallback 과 구분: 빈 배열은 “이 섹션 스킵”)
 */
export function useAdvanceWhenNoQuestions(
  questionCount: number,
  onEmpty: () => void,
) {
  const onEmptyRef = useRef(onEmpty)
  onEmptyRef.current = onEmpty
  const didAdvanceRef = useRef(false)
  useEffect(() => {
    if (questionCount > 0) {
      didAdvanceRef.current = false
      return
    }
    if (didAdvanceRef.current) return
    didAdvanceRef.current = true
    onEmptyRef.current()
  }, [questionCount])
}
