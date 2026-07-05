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
}
