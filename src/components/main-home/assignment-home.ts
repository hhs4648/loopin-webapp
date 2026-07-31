export const MAIN_HOME_ASSETS = {
  /**
   * 학원/학교 메인 맵 — 1~21성 × 5세트 (연속 타일, 빈 갭 없음).
   * 백업: `main-home-academy-map.before-extend.svg`
   */
  map: '/assets/main-home-academy-map.svg?v=20',
  /** @deprecated 동일 원본 — `map` 사용 */
  mapLong: '/assets/main-home-map-long.svg?v=7',
  mapScroll: '/assets/main-home-map-scroll.svg',
  mapFrame: '/assets/main-home-assignment-received.svg',
  castleGray: '/assets/castle-gray.svg',
  /** 맵 성 슬롯 오버레이 */
  mapCastle: '/assets/map-castle-red-flag.png',
  /** 시작 깃발 — React 오버레이(`flag.svg`). 하늘 크롭 아래에 배치 · 항상 표시 */
  startFlag: '/assets/flag.svg?v=3',
  /** 하단 탭바 */
  bottomNav: '/assets/main-home-bottom-nav.svg?v=2',
  /**
   * 완료 별표 — `별표.svg` → `mission-star.svg`.
   * 렌더는 `MissionCheckBadge`가 성 색으로 다시 그림(에셋은 시안 참고).
   */
  missionStar: '/assets/mission-star.svg',
  /** @deprecated 체크 시안 — 완료는 `missionStar` / `MissionCheckBadge` */
  missionCheck: '/assets/mission-check.svg',
  /** 루핀 — 시작 지점 대기. 원본: `루핀 캐릭터 시작.svg` */
  mascotWave: '/assets/loopin-character-start.svg?v=1',
  /** 루핀 — 성 도착·현재 위치 만세. 원본: `만세 캐릭터.svg` → `mascot-banzai.svg` */
  mascotCheer: '/assets/mascot-banzai.svg?v=1',
  /**
   * @deprecated 배치 참고용만 — 렌더에 쓰지 않음.
   * Figma `캐릭터 성도착.svg` → `character-castle-arrive.svg`
   */
  castleArrive: '/assets/character-castle-arrive.svg?v=1',
  /** 완료 성 재도전 확인 — Figma `재도전 화면.svg` (하늘 색은 무시) */
  castleRetryScreen: '/assets/castle-retry-screen.svg?v=1',
} as const

/** 재도전 화면 — 취소 버튼 (Figma path ≈ x30–155 y690–750) */
export const CASTLE_RETRY_CANCEL_HIT = { x: 30, y: 690, w: 125, h: 60 }
/** 재도전 화면 — 「재도전」 버튼 (Figma path ≈ x165–356 y690–750) */
export const CASTLE_RETRY_CONFIRM_HIT = { x: 165, y: 690, w: 191, h: 60 }
/** 재도전 화면 — 헤더 `<` (에셋에 베이크 · 히트만) */
export const CASTLE_RETRY_BACK_HIT = { x: 6, y: 70, w: 44, h: 40 }

/**
 * `main-home-full-map.svg`에 그려진 성 메인 컬러(타워 fill stop) 순서.
 * 완료 체크 뱃지도 같은 색을 쓴다 — 노란 성에 빨간 체크가 뜨면 안 됨.
 */
export const CASTLE_ACCENT_COLORS = [
  '#FD3D3D', // 1 빨강
  '#FFA10A', // 2 노랑/주황
  '#FEE331', // 3 라임 노랑
  '#39B548', // 4 초록
  '#1A78F2', // 5 파랑
  '#981AF2', // 6 보라
  '#FF4CC0', // 7 핑크
  '#DE4DAB', // 8 핫핑크
] as const

export function getCastleAccentColor(index: number): string {
  return CASTLE_ACCENT_COLORS[index % CASTLE_ACCENT_COLORS.length]!
}

export const FRAME_W = 393
/** Initial viewport height (Figma frame) */
export const FRAME_H = 852

/** `학원학교 학생용 메인화면` LONG (1~21성 × 5세트) */
export const MAP_LONG_W = 360
/** crop 2565 + natural period 2192 × 4 */
export const MAP_LONG_H = 11333
/** 가로 393 기준 LONG 높이 */
export const MAP_CONTENT_H = Math.round((FRAME_W * MAP_LONG_H) / MAP_LONG_W)
const MAP_SCALE = FRAME_W / MAP_LONG_W

/**
 * LONG 상단 하늘 크롭(원본 y). 풀 본색은 ≈266부터.
 * 그 위 하늘·전이 띠를 남기면 고정 하늘과 색이 어긋나 이상한 선이 생긴다.
 */
export const MAP_SKY_CROP_LONG = 266
export const MAP_SKY_CROP = Math.round(MAP_SKY_CROP_LONG * MAP_SCALE)
/** 스크롤 맵 높이(하늘 제외) */
export const MAP_SCROLL_H = MAP_CONTENT_H - MAP_SKY_CROP

/** 맵 풀 바탕 — LONG 실측 rgb(171,231,219) */
export const MAIN_HOME_GRASS = '#ABE7DB'

/**
 * 뷰포트 고정 하늘 — 드래그/스크롤 불가.
 * 회차 필·미션 카드 영역. 풀은 이 아래부터 바로 시작(위로 당김).
 */
export const SKY_FIXED_H = 200

/**
 * @deprecated LONG 단일 맵 — `MAP_CONTENT_H` / `MAP_SKY_CROP` 사용
 */
export const FULL_MAP_H = MAP_CONTENT_H
export const FULL_MAP_SKY_CROP = MAP_SKY_CROP
export const FULL_MAP_CONTENT_H = MAP_SCROLL_H
/** Sky / header — fixed, no scroll */
export const SKY_H = SKY_FIXED_H
/** Bottom navigation — fixed, always on top */
export const NAV_H = 81
/** Grass map — scrollable region in design coordinates */
export const GRASS_SCROLL_H = MAP_SCROLL_H
export const TOTAL_MAP_H = SKY_FIXED_H + MAP_SCROLL_H

/**
 * 1~21성 한 세트.
 * period = 성1→다음 성1 자연 간격(2192). 빈 갭 없이 이어 붙임.
 */
export const MAP_CASTLE_BUNDLE_SIZE = 21
export const MAP_CASTLE_PERIOD_LONG = 2192
/** 미리 준비하는 세트 수 */
export const MAP_CASTLE_SET_COUNT = 5

/** 한 세트(1~21) */
export const BAKED_MAP_CASTLE_COUNT = MAP_CASTLE_BUNDLE_SIZE
/** 추가 세트 (2~5) */
export const EXTRA_MAP_CASTLE_COUNT =
  MAP_CASTLE_BUNDLE_SIZE * (MAP_CASTLE_SET_COUNT - 1)
/** 21 × 5 = 105 */
export const FREE_MAP_CASTLE_COUNT =
  BAKED_MAP_CASTLE_COUNT + EXTRA_MAP_CASTLE_COUNT

/** @deprecated */
export const MAP_BRIDGE_H = 0
/** @deprecated */
export const MAP_SEGMENT_H = 0
/** @deprecated */
export const MAP_BRIDGE_OVERLAP = 0

/** 마지막 부여 성 아래 여유(프레임 px) — 내비는 스크롤 영역 밖 */
export const MAP_END_PADDING = 56

/**
 * 부여된 마지막 성 너머로 드래그해 미리 볼 수 있는 성 개수.
 * (맵 SVG에 구워진 다음 성·자물쇠가 보이도록 스크롤 상한만 확장)
 */
export const MAP_SCROLL_LOOKAHEAD_CASTLES = 2

export function resolveMapSegmentCount(_assignedCount: number): number {
  return 0
}

export function resolveMapHasBridge(_assignedCount: number): boolean {
  return false
}

function longToFrameCastle(
  id: string,
  longCx: number,
  longFloorY: number,
  longW: number,
): MapCastle {
  const w = Math.round(longW * MAP_SCALE)
  /** `캐릭터 성도착` 성 비율(폭77 · 높이~61 → ≈0.79) */
  const h = Math.round(w * (61 / 77))
  const centerX = longCx * MAP_SCALE
  const floorY = longFloorY * MAP_SCALE
  return {
    id,
    x: centerX - w / 2,
    y: floorY - h,
    w,
    h,
  }
}

/** 가운데 → 오른쪽 → 왼쪽 */
const CASTLE_PATTERN = [
  { cx: 182, w: 74 },
  { cx: 287, w: 72 },
  { cx: 74, w: 79 },
] as const

/** LONG SVG 실측 성 밑변 — 1~21성 한 묶음 (22성 제외) */
const BUNDLE_CASTLE_FLOORS = [
  426, 549, 670, 748, 871, 992, 1060, 1183, 1304, 1372, 1495, 1616, 1683,
  1806, 1927, 1995, 2118, 2239, 2306, 2429, 2550,
] as const

function castleFloorLong(index: number): number {
  const bundle = Math.floor(index / MAP_CASTLE_BUNDLE_SIZE)
  const phase = index % MAP_CASTLE_BUNDLE_SIZE
  return BUNDLE_CASTLE_FLOORS[phase]! + MAP_CASTLE_PERIOD_LONG * bundle
}

/**
 * 성 슬롯 — 1~21 × 5세트 (period 2192, 연속).
 */
export const MAP_CASTLE_SLOTS: MapCastle[] = Array.from(
  { length: FREE_MAP_CASTLE_COUNT },
  (_, index) => {
    const pattern = CASTLE_PATTERN[index % 3]!
    return longToFrameCastle(
      `castle-${index + 1}`,
      pattern.cx,
      castleFloorLong(index),
      pattern.w,
    )
  },
)

/** @deprecated use MAP_CASTLE_SLOTS[0] */
export const FULL_MAP_STAR_1_CASTLE = MAP_CASTLE_SLOTS[0]!
/** @deprecated use MAP_CASTLE_SLOTS[1] */
export const FULL_MAP_STAR_2_CASTLE = MAP_CASTLE_SLOTS[1]!

/**
 * 맵에 구워진 자물쇠 중심(1·2회차 참고값).
 * 완료 시 `castleCompleteMarkerCenter` + `MissionCheckBadge`(별표)로 덮는다.
 */
export const FULL_MAP_STAR_1_MARKER = { cx: 205, cy: 330 }
export const FULL_MAP_STAR_2_MARKER = { cx: 322, cy: 510 }

/** LONG 자물쇠 중심 X (가운데·오른쪽·왼쪽) */
const LOCK_CX_LONG = [184, 287, 73.5] as const
/**
 * 성 바닥 → 자물쇠 중심 거리(LONG).
 * 1성(스타 자리)만 117, 이후 가운데 패턴은 98.
 */
function lockAboveFloorLong(index: number): number {
  const phase = index % 3
  if (phase === 1) return 94
  if (phase === 2) return 100
  const inBundle = index % MAP_CASTLE_BUNDLE_SIZE
  return inBundle === 0 ? 117 : 98
}

/** 완료 별표가 덮을 자물쇠 중심(프레임 좌표) */
export function castleCompleteMarkerCenter(index: number): {
  cx: number
  cy: number
} {
  const phase = index % 3
  const floor = castleFloorLong(index)
  return {
    cx: LOCK_CX_LONG[phase]! * MAP_SCALE,
    cy: (floor - lockAboveFloorLong(index)) * MAP_SCALE,
  }
}

/** `메인화면` PNG 실측 배경 톤 */
/**
 * 시작 깃발(`flag.svg` 49×69) — 맵 좌표.
 * 상단 = MAP_SKY_CROP + 여유 → 고정 하늘·크롭에 절대 안 잘림.
 * 가로는 LONG 폴(x≈35)에 맞춤.
 */
export const START_FLAG_RECT = {
  x: Math.round(30 * MAP_SCALE),
  y: MAP_SKY_CROP + 6,
  w: Math.round(49 * MAP_SCALE),
  h: Math.round(69 * MAP_SCALE),
} as const

/**
 * 루핀 캐릭터(대기 포즈) — 시작 깃발 오른쪽 「현재 위치」.
 * 성이 완료되어 현재 위치가 옮겨지면 숨긴다.
 * 기준 크기 42×58 → 2배(발·가로 중심 유지).
 */
export const MASCOT_WAVE_RECT = {
  x: START_FLAG_RECT.x + START_FLAG_RECT.w - 4 - 21,
  y: START_FLAG_RECT.y + START_FLAG_RECT.h - 116 + 14,
  w: 84,
  h: 116,
}

/** 시작 지점 「현재 위치」 필 — 루핀 발 아래 */
export const START_LOCATION_PILL_RECT = {
  x: MASCOT_WAVE_RECT.x + (MASCOT_WAVE_RECT.w - 72) / 2,
  y: MASCOT_WAVE_RECT.y + MASCOT_WAVE_RECT.h - 2,
  w: 72,
  h: 28,
} as const

/**
 * 스크롤 콘텐츠 높이 — 풀맵 배경 유지(`MAP_SCROLL_H`).
 * 드래그 상한은 `resolveMapScrollLimitY` / `resolveMapMaxScrollTop`.
 */
export function resolveMapScrollContentHeight(_assignedCount: number): number {
  return MAP_SCROLL_H
}

/**
 * 드래그 허용 하단(하늘 크롭 후 프레임 px).
 * 부여된 마지막 성 + 룩어헤드(+2) 밑변 + 여유 — 이보다 아래로 스크롤하지 않음.
 */
export function resolveMapScrollLimitY(assignedCount: number): number {
  if (assignedCount <= 0) {
    const flagBottom = START_FLAG_RECT.y + START_FLAG_RECT.h
    return Math.min(
      MAP_SCROLL_H,
      Math.max(flagBottom - MAP_SKY_CROP + MAP_END_PADDING, 200),
    )
  }
  const visibleCount = Math.min(
    assignedCount + MAP_SCROLL_LOOKAHEAD_CASTLES,
    MAP_CASTLE_SLOTS.length,
  )
  const last = MAP_CASTLE_SLOTS[visibleCount - 1]!
  const limitY = last.y + last.h - MAP_SKY_CROP + MAP_END_PADDING
  return Math.min(MAP_SCROLL_H, Math.max(limitY, 200))
}

/** 스크롤 컨테이너 기준 maxScrollTop (풀맵 유지 + 상한 클램프) */
export function resolveMapMaxScrollTop(
  assignedCount: number,
  scrollEl: HTMLElement,
): number {
  const limitY = resolveMapScrollLimitY(assignedCount)
  const contentH = scrollEl.scrollHeight
  if (contentH <= 0) return 0
  const allowedPx = (limitY / MAP_SCROLL_H) * contentH
  return Math.max(0, allowedPx - scrollEl.clientHeight)
}

/**
 * 현재 위치(프레임 Y)가 스크롤 뷰포트 세로 중앙에 오도록 하는 scrollTop.
 * 부여 성 드래그 상한 안으로 클램프.
 */
export function resolveMapCenterScrollTop(
  focusFrameY: number,
  assignedCount: number,
  scrollEl: HTMLElement,
): number {
  const contentH = scrollEl.scrollHeight
  if (contentH <= 0) return 0
  const focusInScroll = focusFrameY - MAP_SKY_CROP
  const focusPx = (focusInScroll / MAP_SCROLL_H) * contentH
  const target = focusPx - scrollEl.clientHeight / 2
  const maxScroll = resolveMapMaxScrollTop(assignedCount, scrollEl)
  return Math.min(maxScroll, Math.max(0, target))
}

/**
 * `캐릭터 성도착.svg` 참고 실측 (렌더 에셋 아님, 배치 비율만 사용).
 * viewBox 90×94
 * - 성 바닥 y ≈ 87.78 · 성 폭 ≈ 77 · 성 높이 ≈ 61
 * - 루핀 발끝 y ≈ 89 · 루핀 박스 ≈ 40×46 (기존 mascot-cheer)
 * → 발끝 ≈ 성바닥, 루핀 높이 ≈ 성 높이 × (46/61)
 */
export const CASTLE_ARRIVE_REF = {
  castleW: 77,
  castleH: 61,
  castleFloorY: 87.78,
  mascotW: 40,
  mascotH: 46,
  mascotFeetY: 89,
} as const

export const CASTLE_MASCOT_SIZE = {
  w: CASTLE_ARRIVE_REF.mascotW,
  h: CASTLE_ARRIVE_REF.mascotH,
} as const

/**
 * 맵 성 위 환호 루핀 박스.
 * 가로 중앙 · 박스 밑변(발끝) = 성 밑변 `castle.y + castle.h`.
 */
export function castleMascotClipRect(castle: {
  id?: string
  x: number
  y: number
  w: number
  h: number
}) {
  const { castleH, mascotW, mascotH } = CASTLE_ARRIVE_REF
  const h = Math.round(castle.h * (mascotH / castleH))
  const w = Math.round(h * (mascotW / mascotH))
  const centerX = castle.x + castle.w / 2
  const floorY = castle.y + castle.h
  return {
    x: Math.round(centerX - w / 2),
    y: Math.round(floorY - h),
    w,
    h,
  }
}

/** @deprecated `castleMascotClipRect`와 동일 */
export function castleArriveOverlayRect(castle: {
  x: number
  y: number
  w: number
  h: number
}) {
  const box = castleMascotClipRect(castle)
  return {
    ...box,
    footX: box.x + box.w / 2,
    footY: box.y + box.h,
  }
}

/** @deprecated clip 내부는 비율 유지로 width%만 씀 */
export function castleMascotInnerRect(castle: { x: number; y: number; w: number; h: number }) {
  return castleMascotClipRect(castle)
}

/** @deprecated `castleMascotClipRect` 사용 */
export function castleMascotRect(castle: { x: number; y: number; w: number; h: number }) {
  return castleMascotClipRect(castle)
}

/** 완료 성 양옆 반짝이 — 입구에 앉은 루핀 좌·우 */
export function castleSparkleRects(castle: { x: number; y: number; w: number; h: number }) {
  const mascot = castleMascotClipRect(castle)
  const size = Math.max(8, mascot.w * 0.28)
  return {
    left: {
      x: mascot.x - size * 0.85,
      y: mascot.y + mascot.h * 0.12,
      w: size,
      h: size,
    },
    right: {
      x: mascot.x + mascot.w + size * 0.05,
      y: mascot.y + mascot.h * 0.02,
      w: size,
      h: size,
    },
  }
}

/**
 * 성 바로 아래 「현재 위치」 파란 필.
 * 발끝(성 밑변)과 겹치지 않게 여유를 둔다.
 */
export const CURRENT_LOCATION_PILL = { w: 72, h: 28 } as const
/** 발끝 → 필 상단 간격 (참고 시안 ≈ 성 밑변 아래 여유) */
const PILL_GAP_BELOW_FEET = 8

/** 완료 별표(자물쇠) 자리 「재도전 중!」 필 — 별표와 같은 중심 */
export const CASTLE_RETRYING_PILL = { w: 102, h: 30 } as const

/** 자물쇠/별표 중심에 재도전 필 배치 (재도전 중엔 별표 대신 표시) */
export function castleRetryingPillStyle(cx: number, cy: number) {
  const { w, h } = CASTLE_RETRYING_PILL
  return fullMapRectStyle(cx - w / 2, cy - h / 2, w, h)
}

export function currentLocationPillRect(castle: {
  id?: string
  x: number
  y: number
  w: number
  h: number
}) {
  const { w, h } = CURRENT_LOCATION_PILL
  const mascot = castleMascotClipRect(castle)
  return {
    x: mascot.x + (mascot.w - w) / 2,
    y: mascot.y + mascot.h + PILL_GAP_BELOW_FEET,
    w,
    h,
  }
}

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
]

/** Figma filter34 — 노란색 2회차 성 */
export const STAR_2_YELLOW_CASTLE: MapCastle = {
  id: 'star-2-yellow',
  x: 273.573,
  y: 457.026,
  w: 89.7832,
  h: 74.4551,
}

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
    assigned: true,
    completed: false,
    castle: STAR_2_YELLOW_CASTLE,
    marker: {
      cx: STAR_2_YELLOW_CASTLE.x + STAR_2_YELLOW_CASTLE.w / 2,
      cy: STAR_2_YELLOW_CASTLE.y + STAR_2_YELLOW_CASTLE.h / 2,
    },
  },
  {
    id: 3,
    assigned: false,
    completed: false,
    castle: { id: 'star-3', x: 30, y: 560, w: 88, h: 72 },
    marker: { cx: 74, cy: 549 },
  },
  {
    id: 4,
    assigned: false,
    completed: false,
    castle: { id: 'star-4', x: 200, y: 680, w: 88, h: 72 },
    marker: { cx: 244, cy: 665 },
  },
]

/** Figma — 2회차 노란 성 터치 영역 */
export const STAR_2_CASTLE_HIT = {
  x: STAR_2_YELLOW_CASTLE.x - 4,
  y: STAR_2_YELLOW_CASTLE.y - 6,
  w: STAR_2_YELLOW_CASTLE.w + 12,
  h: STAR_2_YELLOW_CASTLE.h + 12,
}

/** Figma — 2회차 성 상단 자물쇠 마커 (노란 성 위) */
export const STAR_2_LOCK_MARKER = {
  cx: STAR_2_YELLOW_CASTLE.x + STAR_2_YELLOW_CASTLE.w / 2,
  cy: STAR_2_YELLOW_CASTLE.y - 36,
}

const MARKER_SIZE = 58

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

/** 393×MAP_SCROLL_H 스크롤 맵(하늘 크롭 후) 오버레이 좌표 */
export function fullMapRectStyle(x: number, y: number, w: number, h: number) {
  return {
    left: `${(x / FRAME_W) * 100}%`,
    top: `${((y - MAP_SKY_CROP) / MAP_SCROLL_H) * 100}%`,
    width: `${(w / FRAME_W) * 100}%`,
    height: `${(h / MAP_SCROLL_H) * 100}%`,
  }
}

export function fullMapMarkerStyle(cx: number, cy: number) {
  const half = MARKER_SIZE / 2
  return fullMapRectStyle(cx - half, cy - half, MARKER_SIZE, MARKER_SIZE)
}

/** 과제 미부여 성 — 회색 성 오버레이 */
export function getGrayCastleOverlays(): MapCastle[] {
  return [
    ...TEST_STARS.filter((star) => star.castle && !star.assigned).map(
      (star) => star.castle!,
    ),
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

/** 하단 탭 — Figma `메인화면(과제 부여 받은후)` 4등분 */
export type MainHomeNavTabId = 'home' | 'vocab' | 'review' | 'menu'

export type MainHomeNavTab = {
  id: MainHomeNavTabId
  label: string
  ariaLabel: string
}

export const MAIN_HOME_NAV_TABS: MainHomeNavTab[] = [
  { id: 'home', label: '홈', ariaLabel: '홈' },
  { id: 'vocab', label: '단어장', ariaLabel: '단어장' },
  { id: 'review', label: '복습노트', ariaLabel: '복습노트' },
  { id: 'menu', label: '전체', ariaLabel: '전체' },
]
