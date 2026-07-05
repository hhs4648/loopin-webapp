import { BODY_TEXT_TOTAL_QUESTIONS } from '../exercise/session-questions'

export { BODY_TEXT_TOTAL_QUESTIONS }

export const FRAME_W = 393
export const FRAME_H = 852

export const BODY_TEXT_COMPLETE_ASSET = '/assets/본문 끝.svg'

/** Figma — 점수 숫자 (예: 85) */
export const BODY_TEXT_COMPLETE_SCORE = { x: 118, y: 400, w: 130, h: 76 }

/** Figma — 정답 개수 텍스트 (예: 12문제 중 8개 정답) */
export const BODY_TEXT_COMPLETE_CORRECT_LABEL = { x: 72, y: 512, w: 248, h: 32 }

/** Figma — SVG에 박힌 하단 부가 문구 가림 */
export const BODY_TEXT_COMPLETE_BAKED_SUBTITLE_MASK = { x: 24, y: 538, w: 345, h: 40 }

/** Figma — 확인 버튼 */
export const BODY_TEXT_COMPLETE_PRIMARY_BTN = { x: 33, y: 654, w: 232, h: 60 }

export const BODY_TEXT_COMPLETE_BG_GRADIENT =
  'linear-gradient(to bottom, #D3EFFE 0%, #F0FAFF 100%)'

export function calcBodyTextScore(correctCount: number): number {
  return Math.round((correctCount / BODY_TEXT_TOTAL_QUESTIONS) * 100)
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

/** SVG 배경 그라데이션과 맞춰 마스크 박스가 보이지 않게 함 */
export function figmaCamouflageStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    ...figmaRectStyle(rect),
    background: BODY_TEXT_COMPLETE_BG_GRADIENT,
    backgroundSize: `100% ${FRAME_H}px`,
    backgroundPosition: `0 -${rect.y}px`,
  }
}
