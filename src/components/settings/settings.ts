/** Figma `설정 창` — ASCII: `settings-window.svg` (원본 캔버스 553×1012) */
export const SETTINGS_WINDOW_ASSET = '/assets/settings-window.svg?v=6'

/**
 * 표시 영역: 폰 시트(clip 393×852 @ x80 y50) + 베이크 내비 제외.
 * - 가로: x 80…473 (393)
 * - 세로: y 50…814 (764)
 */
export const SETTINGS_SOURCE = {
  canvasW: 553,
  canvasH: 1012,
  contentX: 80,
  contentY: 50,
  contentW: 393,
  contentH: 764,
} as const

/** 설정 본문 패널(내비 위)에 크롭 이미지를 가로·세로 꽉 채움 */
export function settingsWindowImageStyle() {
  const { canvasW, canvasH, contentX, contentY, contentW, contentH } =
    SETTINGS_SOURCE
  return {
    position: 'absolute' as const,
    width: `${(canvasW / contentW) * 100}%`,
    height: `${(canvasH / contentH) * 100}%`,
    left: `${(-contentX / contentW) * 100}%`,
    top: `${(-contentY / contentH) * 100}%`,
    maxWidth: 'none',
    objectFit: 'fill' as const,
  }
}

/** 설정 화면 좌상단 닫기(뒤로) 히트 — 공통 헤더 `<`와 동일 터치 크기 */
export const SETTINGS_CLOSE_HIT = { x: 19, y: 68, w: 44, h: 44 }

/** 크롭 좌표 → 설정 본문 패널 % */
export function settingsContentRectStyle(rect: {
  x: number
  y: number
  w: number
  h: number
}) {
  const { contentW, contentH } = SETTINGS_SOURCE
  return {
    left: `${(rect.x / contentW) * 100}%`,
    top: `${(rect.y / contentH) * 100}%`,
    width: `${(rect.w / contentW) * 100}%`,
    height: `${(rect.h / contentH) * 100}%`,
  }
}

/** 캔버스 절대좌표 → 크롭(표시) 좌표 */
export function settingsCanvasToCropRect(canvas: {
  x: number
  y: number
  w: number
  h: number
}) {
  return {
    x: canvas.x - SETTINGS_SOURCE.contentX,
    y: canvas.y - SETTINGS_SOURCE.contentY,
    w: canvas.w,
    h: canvas.h,
  }
}

export const SETTINGS_CONTACT_EMAIL = 'contact@haksup.com'

/**
 * 베이크된 이름·카카오 텍스트를 가리는 연속 덮개.
 * (개별 박스가 보이면 그라데이션과 어긋남)
 */
export const SETTINGS_PROFILE_STRIP = {
  x: 196,
  y: 182,
  w: 150,
  h: 32,
} as const

/**
 * 프로필 이름 (최대 5자) — 뱃지 바로 왼쪽, 짧은 이름은 우측 정렬.
 */
export const SETTINGS_PROFILE_NAME = {
  x: 208,
  y: 186,
  w: 62,
  h: 24,
} as const

/** 시안 카카오 필 자리 — 연동 뱃지 고정 (이름 길이와 무관) */
export const SETTINGS_PROFILE_BADGE = {
  x: 273.836,
  y: 186,
  w: 67.609,
  h: 24,
} as const

/** 온보딩·설정에 보이는 이름 최대 글자 수 */
export const SETTINGS_DISPLAY_NAME_MAX = 5

/** 계정 > 닉네임 행 우측 값 */
export const SETTINGS_NICKNAME_VALUE = {
  x: 320,
  y: 332,
  w: 100,
  h: 28,
} as const

/** 계정 > 연동 계정 행 우측 값 */
export const SETTINGS_LINKED_VALUE = {
  x: 320,
  y: 400,
  w: 100,
  h: 28,
} as const

/** 프로필 배너 위 덮개 색 (그라데이션 근사) */
export const SETTINGS_PROFILE_COVER = '#E8F2FE'

/**
 * 설정 리스트 행 — 풀폭 카드에 맞춘 히트.
 */
export type SettingsListAction = 'privacy' | 'terms' | 'marketing' | 'mailto'

export type SettingsListRow = {
  id: string
  ariaLabel: string
  canvas: { x: number; y: number; w: number; h: number }
  action: SettingsListAction
}

const ROW_X = 103
const ROW_W = 347

export const SETTINGS_LIST_ROWS: ReadonlyArray<SettingsListRow> = [
  {
    id: 'privacy',
    ariaLabel: '개인정보 처리방침',
    canvas: { x: ROW_X, y: 314, w: ROW_W, h: 66 },
    action: 'privacy',
  },
  {
    id: 'terms',
    ariaLabel: '서비스 이용약관',
    canvas: { x: ROW_X, y: 380, w: ROW_W, h: 67 },
    action: 'terms',
  },
  {
    id: 'marketing',
    ariaLabel: '마케팅 수신 안내',
    canvas: { x: ROW_X, y: 447, w: ROW_W, h: 67 },
    action: 'marketing',
  },
  {
    id: 'inquiry',
    ariaLabel: '문의 사항',
    canvas: { x: ROW_X, y: 563.5, w: ROW_W, h: 66 },
    action: 'mailto',
  },
  {
    id: 'inquiry-email',
    ariaLabel: `문의 이메일 ${SETTINGS_CONTACT_EMAIL}`,
    canvas: { x: ROW_X, y: 629.5, w: ROW_W, h: 67 },
    action: 'mailto',
  },
]

/** 약관·방침 — `public/legal/` 정적 페이지 */
export const SETTINGS_DOC_URLS: Partial<
  Record<'privacy' | 'terms' | 'marketing', string>
> = {
  privacy: '/legal/privacy.html',
  terms: '/legal/terms.html',
  marketing: '/legal/marketing.html',
}