import { FRAME_H, FRAME_W } from '../main-home/session-round-dropdown'

/** Figma 393×852 — header `<` (온보딩과 동일 좌표) */
export const FIGMA_HEADER_BACK_HIT = { x: 6, y: 70, w: 44, h: 40 }

export type FigmaNavRect = { x: number; y: number; w: number; h: number }

export function figmaNavRectStyle(rect: FigmaNavRect) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
