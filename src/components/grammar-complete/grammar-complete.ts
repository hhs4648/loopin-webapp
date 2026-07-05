import { SESSION_TOTAL_STEPS } from '../exercise/session-questions'

export { SESSION_TOTAL_STEPS as SESSION_TOTAL_QUESTIONS }

export const FRAME_W = 393
export const FRAME_H = 852

export const GRAMMAR_COMPLETE_ASSET = '/assets/문법종료시.svg'

/** Figma — 점수 숫자 */
export const GRAMMAR_COMPLETE_SCORE = { x: 118, y: 400, w: 130, h: 76 }

/** Figma — 정답 개수 (예: 5문제 중 4개 정답) */
export const GRAMMAR_COMPLETE_CORRECT_LABEL = { x: 72, y: 512, w: 248, h: 32 }

/** Figma — SVG에 박힌 하단 부가 문구 가림 */
export const GRAMMAR_COMPLETE_BAKED_SUBTITLE_MASK = { x: 24, y: 538, w: 345, h: 40 }

/** Figma — SVG 하단 버튼(다음 세션/홈) 가림 */
export const GRAMMAR_COMPLETE_BAKED_BUTTONS_MASK = { x: 24, y: 630, w: 345, h: 200 }

/** Figma — 전부 재도전 */
export const GRAMMAR_COMPLETE_RETRY_ALL_BTN = { x: 30, y: 620, w: 333, h: 52 }

/** Figma — 오답만 풀기 */
export const GRAMMAR_COMPLETE_RETRY_WRONG_BTN = { x: 30, y: 684, w: 333, h: 52 }

/** Figma — 홈 */
export const GRAMMAR_COMPLETE_HOME_BTN = { x: 30, y: 748, w: 333, h: 52 }

export const GRAMMAR_COMPLETE_BG_GRADIENT =
  'linear-gradient(to bottom, #D3EFFE 0%, #F0FAFF 100%)'

export function calcSessionScore(correctCount: number): number {
  return Math.round((correctCount / SESSION_TOTAL_STEPS) * 100)
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

export function figmaCamouflageStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    ...figmaRectStyle(rect),
    background: GRAMMAR_COMPLETE_BG_GRADIENT,
    backgroundSize: `100% ${FRAME_H}px`,
    backgroundPosition: `0 -${rect.y}px`,
  }
}
