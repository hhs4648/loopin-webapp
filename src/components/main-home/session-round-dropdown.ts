/** Figma frame */
export const FRAME_W = 393
export const FRAME_H = 852

/** session-dropdown-dialog.svg export size */
export const DIALOG_W = 203
export const DIALOG_H = 185

/** Figma — top header class / round pill (filter16) */
export const PILL = { x: 145.5, y: 69, w: 117.85, h: 44 }

/** Baked SVG label glyphs — mask only this strip (pill surface is white) */
export const PILL_LABEL_MASK = { x: 156, y: 81.5, w: 76, h: 17 }

/** Replacement label — centered in pill, text only (no background) */
export const PILL_LABEL_TEXT = {
  x: PILL.x + 6,
  y: PILL.y,
  w: PILL.w - 42,
  h: PILL.h,
}

/** Main home sky — matches FigmaAssetFrame bgClassName */
export const MAIN_HOME_SKY = '#E2F7FF'

/** Header pill surface — matches baked SVG rect fill */
export const PILL_SURFACE = '#FFFFFF'

/** invite SVG full-screen dim layer (black @ 45%) over white pill */
export const INVITE_DIM_OVERLAY_OPACITY = 0.45

export function dimmedSurface(base: { r: number; g: number; b: number }, opacity = INVITE_DIM_OVERLAY_OPACITY) {
  const scale = 1 - opacity
  const toHex = (channel: number) =>
    Math.round(channel * scale)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(base.r)}${toHex(base.g)}${toHex(base.b)}`
}

/** White pill after invite dim overlay */
export const PILL_DIMMED_SURFACE = dimmedSurface({ r: 255, g: 255, b: 255 })

/** Chevron tap target — right side of header pill */
export const CHEVRON = { x: 230, y: 74, w: 32, h: 34 }

export type SessionRound = {
  id: number
  label: string
  date: string
  isCurrent?: boolean
}

/** 테스트: 1회차가 현재 회차 */
export const SESSION_ROUNDS: SessionRound[] = [
  { id: 1, label: '1회차', date: '7월 6일 (월)', isCurrent: true },
  { id: 2, label: '2회차', date: '7월 8일 (수)' },
  { id: 3, label: '3회차', date: '7월 10일 (금)' },
  { id: 4, label: '4회차', date: '7월 13일 (월)' },
]

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

export function dialogPanelStyle() {
  const left = PILL.x + PILL.w / 2 - DIALOG_W / 2
  const top = PILL.y + PILL.h - 4
  return {
    left: `${(left / FRAME_W) * 100}%`,
    top: `${(top / FRAME_H) * 100}%`,
    width: `${(DIALOG_W / FRAME_W) * 100}%`,
    height: `${(DIALOG_H / FRAME_H) * 100}%`,
  }
}
