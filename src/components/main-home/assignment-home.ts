export const MAIN_HOME_ASSETS = {
  mapScroll: '/assets/main-home-map-scroll.svg',
  mapFrame: '/assets/main-home-assignment-received.svg',
  castleGray: '/assets/castle-gray.svg',
  missionCheck: '/assets/mission-check.svg',
} as const

export const FRAME_W = 393
/** Initial viewport height (Figma frame) */
export const FRAME_H = 852
/** Sky / header — fixed, no scroll */
export const SKY_H = 227
/** Bottom navigation — fixed, always on top */
export const NAV_H = 81
/** Grass map — scrollable region in design coordinates */
export const GRASS_SCROLL_H = 1304
export const TOTAL_MAP_H = SKY_H + GRASS_SCROLL_H

export type MapCastle = {
  id: string
  x: number
  y: number
  w: number
  h: number
}

export type MapStar = {
  id: number
  assigned: boolean
  completed: boolean
  castle?: MapCastle
  marker: { cx: number; cy: number }
}

/** 과제 미부여 성 (락 마커 없음) */
export const EXTRA_GRAY_CASTLES: MapCastle[] = [
  { id: 'castle-mid-1', x: 158.765, y: 326.905, w: 93.9903, h: 77.877 },
  { id: 'castle-mid-2', x: 270.577, y: 457.108, w: 89.7832, h: 74.4551 },
]

/** 테스트: 1번만 과제 부여, 전부 미완료 */
export const TEST_STARS: MapStar[] = [
  {
    id: 1,
    assigned: true,
    completed: false,
    marker: { cx: 211.922, cy: 283 },
  },
  {
    id: 2,
    assigned: false,
    completed: false,
    castle: { id: 'star-2', x: 277.265, y: 394.706, w: 86.1387, h: 70.0801 },
    marker: { cx: 312.121, cy: 421 },
  },
  {
    id: 3,
    assigned: false,
    completed: false,
    castle: { id: 'star-3', x: 35.2646, y: 521.706, w: 86.1387, h: 70.0801 },
    marker: { cx: 90, cy: 545 },
  },
  {
    id: 4,
    assigned: false,
    completed: false,
    castle: { id: 'star-4', x: 219.206, y: 730.702, w: 88.9082, h: 73.2207 },
    marker: { cx: 261, cy: 675 },
  },
]

const MARKER_SIZE = 46

export function frameRectStyle(x: number, y: number, w: number, h: number) {
  return {
    left: `${(x / FRAME_W) * 100}%`,
    top: `${(y / FRAME_H) * 100}%`,
    width: `${(w / FRAME_W) * 100}%`,
    height: `${(h / FRAME_H) * 100}%`,
  }
}

export function frameMarkerStyle(cx: number, cy: number) {
  const half = MARKER_SIZE / 2
  return frameRectStyle(cx - half, cy - half, MARKER_SIZE, MARKER_SIZE)
}

/** 과제 미부여 성 — 회색 성 오버레이 */
export function getGrayCastleOverlays(): MapCastle[] {
  return [
    ...TEST_STARS.filter((star) => star.castle).map((star) => star.castle!),
    ...EXTRA_GRAY_CASTLES,
  ]
}

export function grassRectStyle(x: number, y: number, w: number, h: number) {
  return {
    left: `${(x / FRAME_W) * 100}%`,
    top: `${((y - SKY_H) / GRASS_SCROLL_H) * 100}%`,
    width: `${(w / FRAME_W) * 100}%`,
    height: `${(h / GRASS_SCROLL_H) * 100}%`,
  }
}

export function grassMarkerStyle(cx: number, cy: number) {
  const half = MARKER_SIZE / 2
  return grassRectStyle(cx - half, cy - half, MARKER_SIZE, MARKER_SIZE)
}
