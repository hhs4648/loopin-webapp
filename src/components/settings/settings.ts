/** Figma `설정 창` — ASCII: `settings-window.svg` (401×852, 하단 내비는 패널에서 크롭) */
/**
 * `?v=21` — 계정 카드에서 **「혼자 공부모드로 변경」 행을 지웠다**(2026-08-11).
 * React 히트영역이 아예 없던 죽은 행이라 눌러도 아무 일이 없었다. 라벨·쉐브론·구분선을
 * 빼고 카드를 한 행(51px)만큼 줄인 뒤, 아래 블록(이용 안내·로그아웃)을 같은 만큼
 * 끌어올려 섹션 간격을 원래대로 뒀다. 원본은 `_backup/settings-window.v20.svg`.
 *
 * `?v=22` — 맨 아래 **가짜 홈 인디케이터(검은 막대)를 지웠다.** iOS가 그 자리에
 * 자기 것을 그려서 두 겹이 되고, 안드로이드에서는 있지도 않은 막대가 붙는다.
 */
export const SETTINGS_WINDOW_ASSET = '/assets/settings-window.svg?v=22'

/**
 * 표시 영역: 에셋 전체 폭 · 하단 베이크 내비(≈81px)는 패널 `overflow`로 잘림.
 * React `MainHomeBottomNav`가 그 자리를 담당.
 */
export const SETTINGS_SOURCE = {
  canvasW: 401,
  canvasH: 852,
  contentX: 0,
  contentY: 0,
  contentW: 401,
  contentH: 771,
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

/**
 * @deprecated 공통 `FIGMA_HEADER_BACK_HIT` + `BackButtonOverlay` 사용.
 */
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

/** 설정 「문의 사항」— 기기 메일 앱으로 새 메일 작성 화면을 연다 */
export function openSettingsContactMail(): void {
  const href = `mailto:${SETTINGS_CONTACT_EMAIL}?subject=${encodeURIComponent('학습 문의')}`
  // `location.href`보다 `<a>` 클릭이 모바일·인앱 브라우저에서 mailto 처리가 안정적이다
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/** 온보딩·설정에 보이는 이름 최대 글자 수 (`NAME_MAX_LENGTH`와 동일) */
export const SETTINGS_DISPLAY_NAME_MAX = 5

/**
 * 베이크된 이름·연동 뱃지를 가리는 패치.
 * 단색 사각은 카드 그라데이션과 이음새가 생겨 `--`처럼 보였음 → 옆 하늘 복제 PNG.
 */
export const SETTINGS_PROFILE_STRIP = {
  x: 110,
  y: 148,
  w: 152,
  h: 34,
} as const

export const SETTINGS_PROFILE_NAME_PATCH =
  '/assets/settings-profile-name-patch.png?v=1'

/** @deprecated 단색 덮개 — `SETTINGS_PROFILE_NAME_PATCH` 사용 */
export const SETTINGS_PROFILE_COVER = '#E5F0FF'

/**
 * 프로필 이름 — 시안 글리프 높이 ≈19px → 17px bold.
 * 뱃지 왼쪽, 짧은 이름은 우측 정렬.
 */
export const SETTINGS_PROFILE_NAME = {
  x: 114,
  y: 152,
  w: 68,
  h: 24,
} as const

/** 연동 뱃지 (카카오/애플/구글). 시안 글자 높이 ≈10px */
export const SETTINGS_PROFILE_BADGE = {
  x: 185,
  y: 154,
  w: 70,
  h: 20,
} as const

/** 프로필 이름 타이포 — 시안 글리프 ≈19px */
export const SETTINGS_PROFILE_NAME_CLASS =
  "truncate font-['Pretendard',sans-serif] text-[18px] font-bold leading-none tracking-[-0.02em] text-[#111111]"

/** 연동 뱃지 타이포 */
export const SETTINGS_PROFILE_BADGE_CLASS =
  'inline-flex h-[18px] min-w-[54px] items-center justify-center rounded-full px-2 text-[11px] font-semibold leading-none'

/**
 * 계정 1줄 행 — 쉐브론 세로 중심 (401×852 시안).
 * 구분선 276/327/378/429 → 닉네임·연동·학년 중심 ≈301.5 / 352.5 / 403.5
 * 우측 React 값은 좌측 베이크 라벨과 광학적으로 맞추려고 +2px 내린다.
 */
const ACCOUNT_LINE_H = 34
const ACCOUNT_VALUE_Y_NUDGE = 2
const ACCOUNT_NICK_CY = 301.5 + ACCOUNT_VALUE_Y_NUDGE
const ACCOUNT_LINK_CY = 352.5 + ACCOUNT_VALUE_Y_NUDGE
const ACCOUNT_GRADE_CY = 403.5 + ACCOUNT_VALUE_Y_NUDGE

function accountLineY(centerY: number) {
  return centerY - ACCOUNT_LINE_H / 2
}

/** 닉네임 행 우측 값 — `>` 쉐브론은 가리지 않음 */
export const SETTINGS_NICKNAME_VALUE = {
  x: 248,
  y: accountLineY(ACCOUNT_NICK_CY),
  w: 104,
  h: ACCOUNT_LINE_H,
} as const

/** 연동 계정 행 우측 값 */
export const SETTINGS_LINKED_VALUE = {
  x: 248,
  y: accountLineY(ACCOUNT_LINK_CY),
  w: 104,
  h: ACCOUNT_LINE_H,
} as const

/** 학년 변경 행 우측 값 */
export const SETTINGS_GRADE_VALUE = {
  x: 218,
  y: accountLineY(ACCOUNT_GRADE_CY),
  w: 134,
  h: ACCOUNT_LINE_H,
} as const

/**
 * 계정 행 우측 값 타이포 — 닉네임·연동·학년 동일.
 */
export const SETTINGS_ACCOUNT_VALUE_CLASS =
  "truncate font-['Pretendard',sans-serif] text-[18px] font-medium leading-none tracking-[-0.01em] text-[#8C94A1]"

/** 시안에 구워진 기본 학년 문구 (프로필 grade 없을 때) */
export const SETTINGS_DEFAULT_GRADE_LABEL = '중학교 3학년'

/** 설정 「학년 변경」— 중1·중2·중3만 */
export type SettingsMiddleGradeId = '1' | '2' | '3'

export type SettingsGradeOption = {
  id: SettingsMiddleGradeId
  shortLabel: string
  value: string
}

export const SETTINGS_GRADE_OPTIONS: ReadonlyArray<SettingsGradeOption> = [
  { id: '1', shortLabel: '중1', value: '중학교 1학년' },
  { id: '2', shortLabel: '중2', value: '중학교 2학년' },
  { id: '3', shortLabel: '중3', value: '중학교 3학년' },
]

/** 학년 변경 행 전체 히트 */
export const SETTINGS_GRADE_HIT = {
  x: 20,
  y: ACCOUNT_GRADE_CY - 25,
  w: 361,
  h: 50,
} as const

/** 프로필/온보딩 grade 문자열 → 설정 표시용 */
export function formatSettingsGradeLabel(grade?: string | null): string {
  const raw = grade?.trim()
  if (!raw) return SETTINGS_DEFAULT_GRADE_LABEL
  // 학교급만 있는 온보딩 값 — 연도 미정
  if (raw === '초등' || raw === '중등' || raw === '고등') {
    return SETTINGS_DEFAULT_GRADE_LABEL
  }
  // 이미 「중학교 n학년」형태면 그대로
  if (raw.includes('학년')) return raw
  // `중3` / `중3학년` / `3` 등
  const m = raw.match(/([123])/)
  if (m) return `중학교 ${m[1]}학년`
  return raw
}

/** 저장된 grade → 중1·2·3 선택 id (없으면 null) */
export function parseSettingsGradeId(
  grade?: string | null,
): SettingsMiddleGradeId | null {
  const raw = grade?.trim()
  if (!raw) return null
  if (raw === '초등' || raw === '중등' || raw === '고등') return null
  const m = raw.match(/([123])/)
  if (!m) return null
  return m[1] as SettingsMiddleGradeId
}

/**
 * 설정 리스트 행 — 투명 히트 (이용안내·문의·로그아웃).
 * 실측: 이용안내 ≈550/600/660, 로그아웃 ≈730.
 */
export type SettingsListAction =
  | 'privacy'
  | 'terms'
  | 'marketing'
  | 'mailto'
  | 'logout'

export type SettingsListRow = {
  id: string
  ariaLabel: string
  canvas: { x: number; y: number; w: number; h: number }
  action: SettingsListAction
}

const ROW_X = 20
const ROW_W = 361
/** 「혼자 공부모드로 변경」을 뺀 만큼 아래 블록이 통째로 올라갔다 (`?v=21`) */
const REMOVED_ROW_H = 51

function row(centerY: number, h: number) {
  return { x: ROW_X, y: centerY - REMOVED_ROW_H - h / 2, w: ROW_W, h }
}

export const SETTINGS_LIST_ROWS: ReadonlyArray<SettingsListRow> = [
  {
    id: 'privacy',
    ariaLabel: '개인정보 처리방침',
    canvas: row(550, 50),
    action: 'privacy',
  },
  {
    id: 'terms',
    ariaLabel: '이용약관',
    canvas: row(600, 50),
    action: 'terms',
  },
  {
    id: 'inquiry',
    ariaLabel: `문의 사항, ${SETTINGS_CONTACT_EMAIL}로 메일 보내기`,
    canvas: row(660, 56),
    action: 'mailto',
  },
  {
    id: 'logout',
    ariaLabel: '로그아웃',
    canvas: row(730, 52),
    action: 'logout',
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
