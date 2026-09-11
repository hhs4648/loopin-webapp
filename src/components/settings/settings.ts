/** Figma `설정` — ASCII: `settings-window.svg` (401×918, 하단 내비는 패널에서 크롭) */
/**
 * `?v=21` — 계정 카드에서 **「혼자 공부모드로 변경」 행을 지웠다**(2026-08-11).
 * React 히트영역이 아예 없던 죽은 행이라 눌러도 아무 일이 없었다. 라벨·쉐브론·구분선을
 * 빼고 카드를 한 행(51px)만큼 줄인 뒤, 아래 블록(이용 안내·로그아웃)을 같은 만큼
 * 끌어올려 섹션 간격을 원래대로 뒀다. 원본은 `_backup/settings-window.v20.svg`.
 *
 * `?v=22` — 맨 아래 **가짜 홈 인디케이터(검은 막대)를 지웠다.** iOS가 그 자리에
 * 자기 것을 그려서 두 겹이 되고, 안드로이드에서는 있지도 않은 막대가 붙는다.
 *
 * `?v=24` — 베이크 하단 내비·계정 우측 기본값을 SVG에서 숨김. 이미지 매핑을
 * contentH에 맞춰 글씨·구분선·React 내비 위치가 어긋나지 않게.
 *
 * `?v=25` — Figma `설정.svg`(401×918) 적용. 제목 「설정」, 회원탈퇴 카드·빨간
 * 로그아웃 버튼이 시안에 베이크됨. 하단 내비·홈 인디케이터는 SVG에서 숨김.
 *
 * `?v=26` — 918 전체(홈 인디케이터 포함)를 그리면 이미지가 아래로 붙어 **설정
 * 제목·프로필 상단이 상태바에 잘렸다.** 내비 위(836)만 viewBox로 두고 패널에
 * 1:1로 맞춘다.
 *
 * `?v=27` — 시안 상단 상태바 밴드(~54px)를 크롭해 앱이 시계·배터리를 그린 것처럼
 * 보이지 않게 한다. OS 상태바는 `app-shell` safe-area 패딩 위의 영역에서만 보인다.
 */
export const SETTINGS_WINDOW_ASSET = '/assets/settings-window.svg?v=27'

/**
 * 표시 영역: 에셋 폭 · 상태바 밴드 아래~내비 위.
 * React `MainHomeBottomNav`(NAV_H=81)가 하단을 담당.
 */
export const SETTINGS_SOURCE = {
  canvasW: 401,
  canvasH: 836,
  contentX: 0,
  /** Figma 상태바(시계·신호) 밴드 — 표시에서 제외 */
  contentY: 54,
  contentW: 401,
  contentH: 782,
} as const

/**
 * 설정 본문 패널에 에셋을 올릴 때.
 * 패널 높이 = contentH. 캔버스를 그리되 `contentY`만큼 위로 올려 상태바 밴드를 잘라
 * 좌표 %(contentH)와 픽셀이 맞는다.
 */
export function settingsWindowImageStyle() {
  const { canvasH, contentH, contentY } = SETTINGS_SOURCE
  return {
    position: 'absolute' as const,
    left: 0,
    top: `${(-contentY / contentH) * 100}%`,
    width: '100%',
    height: `${(canvasH / contentH) * 100}%`,
    maxWidth: 'none',
    objectFit: 'fill' as const,
    objectPosition: 'top',
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
 * 예전 PNG(266B)를 늘려 쓰면 뭉개져 보였다 → 카드 하늘톤 그라데이션으로 덮는다.
 */
export const SETTINGS_PROFILE_STRIP = {
  x: 110,
  y: 148,
  w: 152,
  h: 34,
} as const

export const SETTINGS_PROFILE_STRIP_BG =
  'linear-gradient(180deg, #EAF4FF 0%, #E3EFFF 55%, #DEECFF 100%)'

/** @deprecated 저해상 PNG — `SETTINGS_PROFILE_STRIP_BG` 사용 */
export const SETTINGS_PROFILE_NAME_PATCH =
  '/assets/settings-profile-name-patch.png?v=1'

/** @deprecated 단색 덮개 — `SETTINGS_PROFILE_STRIP_BG` 사용 */
export const SETTINGS_PROFILE_COVER = '#E5F0FF'

/**
 * 프로필 이름 — 시안보다 조금 또렷·굵게 (생동감).
 */
export const SETTINGS_PROFILE_NAME = {
  x: 114,
  y: 150,
  w: 68,
  h: 26,
} as const

/** 연동 뱃지 (카카오/애플/구글) */
export const SETTINGS_PROFILE_BADGE = {
  x: 185,
  y: 153,
  w: 72,
  h: 22,
} as const

/** 프로필 이름 타이포 */
export const SETTINGS_PROFILE_NAME_CLASS =
  "truncate font-sans text-[20px] font-extrabold leading-none tracking-[-0.04em] text-[#0B1220]"

/** 연동 뱃지 타이포 */
export const SETTINGS_PROFILE_BADGE_CLASS =
  'inline-flex h-[20px] min-w-[56px] items-center justify-center rounded-full px-2.5 text-[11px] font-bold leading-none shadow-[0_1px_2px_rgba(15,23,42,0.12)]'

/**
 * 계정 1줄 행 — 쉐브론 세로 중심 (401×836 시안).
 * 구분선 327 / 378 · 닉네임·연동·학년 중심 ≈ 302 / 353 / 403.5
 * 높이 28로 구분선과 겹치지 않게 (흰 패치가 밑줄을 자르던 회귀 방지).
 * `>` 는 x≈355. 값 박스 오른쪽을 328에서 끊어 화살표가 가려지지 않게 한다.
 */
const ACCOUNT_LINE_H = 28
const ACCOUNT_NICK_CY = 302
const ACCOUNT_LINK_CY = 353
const ACCOUNT_GRADE_CY = 403.5
const ACCOUNT_VALUE_RIGHT = 328
const ACCOUNT_VALUE_W = 100
const ACCOUNT_GRADE_W = 118

function accountLineY(centerY: number) {
  return centerY - ACCOUNT_LINE_H / 2
}

/** 닉네임 행 우측 값 — `>` 쉐브론 왼쪽 */
export const SETTINGS_NICKNAME_VALUE = {
  x: ACCOUNT_VALUE_RIGHT - ACCOUNT_VALUE_W,
  y: accountLineY(ACCOUNT_NICK_CY),
  w: ACCOUNT_VALUE_W,
  h: ACCOUNT_LINE_H,
} as const

/** 연동 계정 행 우측 값 */
export const SETTINGS_LINKED_VALUE = {
  x: ACCOUNT_VALUE_RIGHT - ACCOUNT_VALUE_W,
  y: accountLineY(ACCOUNT_LINK_CY),
  w: ACCOUNT_VALUE_W,
  h: ACCOUNT_LINE_H,
} as const

/** 학년 변경 행 우측 값 — 「중학교 n학년」이 길어서 조금 더 넓게 */
export const SETTINGS_GRADE_VALUE = {
  x: ACCOUNT_VALUE_RIGHT - ACCOUNT_GRADE_W,
  y: accountLineY(ACCOUNT_GRADE_CY),
  w: ACCOUNT_GRADE_W,
  h: ACCOUNT_LINE_H,
} as const

/**
 * 계정 행 우측 값 타이포 — 닉네임·연동·학년 동일.
 * 흐린 회색 medium → 또렷한 slate + semibold (베이크 라벨과 대비).
 */
export const SETTINGS_ACCOUNT_VALUE_CLASS =
  'truncate font-sans text-[17px] font-semibold leading-none tracking-[-0.02em] text-[#334155]'

/** 학년을 아직 고르지 않았을 때 — 온보딩 선택을 가짜 중3으로 채우지 않는다 */
export const SETTINGS_DEFAULT_GRADE_LABEL = ''

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

/**
 * 닉네임 행 전체 히트 — 이름 변경.
 * 시안에 `>` 쉐브론이 그려져 있어 누를 수 있게 보였는데 히트영역이 없었다.
 */
export const SETTINGS_NICKNAME_HIT = {
  x: 20,
  y: ACCOUNT_NICK_CY - 25,
  w: 361,
  h: 50,
} as const

/**
 * 연동 계정 행 전체 히트 — 연동 상태 확인만.
 * 회원탈퇴는 `SETTINGS_DELETE_HIT` (로그아웃 아래).
 */
export const SETTINGS_LINKED_HIT = {
  x: 20,
  y: ACCOUNT_LINK_CY - 25,
  w: 361,
  h: 50,
} as const

/**
 * 「회원탈퇴」 빨간 버튼 — 시안 y 743.5–797.5.
 * 글씨·아이콘은 별도 에셋(`settings-delete-account.svg`, Figma export `회원탈퇴.svg`).
 * 에셋 viewBox 381×74 = 버튼 361×54 + 좌우·상하 그림자 패딩 10.
 */
export const SETTINGS_DELETE_ASSET = '/assets/settings-delete-account.svg?v=1'

/** 그림자 패딩 포함 — 이미지 배치용 */
export const SETTINGS_DELETE_IMAGE = {
  x: 10,
  y: 734,
  w: 381,
  h: 74,
} as const

/** 빨간 카드 본체 — 투명 히트 */
export const SETTINGS_DELETE_HIT = {
  x: 20,
  y: 744,
  w: 361,
  h: 54,
} as const

/** 예전 온보딩·데모가 남긴 학교급/영문 id — 중n을 지어내지 않는다 */
const LEGACY_SCHOOL_LEVEL_LABEL: Record<string, string> = {
  초등: '초등',
  중등: '중등',
  고등: '고등',
  elementary: '초등',
  middle: '중등',
  high: '고등',
}

/** 프로필/온보딩 grade → 설정 행. 온보딩·시트와 같이 중1·중2·중3 */
export function formatSettingsGradeLabel(grade?: string | null): string {
  const id = parseSettingsGradeId(grade)
  if (id) {
    return SETTINGS_GRADE_OPTIONS.find((row) => row.id === id)?.shortLabel ?? ''
  }
  const raw = grade?.trim()
  if (!raw) return SETTINGS_DEFAULT_GRADE_LABEL
  return LEGACY_SCHOOL_LEVEL_LABEL[raw] ?? raw
}

/** 저장된 grade → 중1·2·3 선택 id (없으면 null) */
export function parseSettingsGradeId(
  grade?: string | null,
): SettingsMiddleGradeId | null {
  const raw = grade?.trim()
  if (!raw) return null
  if (raw in LEGACY_SCHOOL_LEVEL_LABEL) return null
  const m = raw.match(/([123])/)
  if (!m) return null
  return m[1] as SettingsMiddleGradeId
}

/**
 * 설정 리스트 행 — 투명 히트 (이용안내·문의·로그아웃).
 * `설정.svg` 실측: 구분선 535.5 / 586.5, 로그아웃 카드 y=677.5, 회원탈퇴 빨간 버튼 y=743.5.
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

export const SETTINGS_LIST_ROWS: ReadonlyArray<SettingsListRow> = [
  {
    id: 'privacy',
    ariaLabel: '개인정보 처리방침',
    canvas: { x: ROW_X, y: 485, w: ROW_W, h: 50 },
    action: 'privacy',
  },
  {
    id: 'terms',
    ariaLabel: '이용약관',
    canvas: { x: ROW_X, y: 536, w: ROW_W, h: 50 },
    action: 'terms',
  },
  {
    id: 'inquiry',
    ariaLabel: `문의 사항, ${SETTINGS_CONTACT_EMAIL}로 메일 보내기`,
    canvas: { x: ROW_X, y: 587, w: ROW_W, h: 65 },
    action: 'mailto',
  },
  {
    id: 'logout',
    ariaLabel: '로그아웃',
    canvas: { x: ROW_X, y: 678, w: ROW_W, h: 54 },
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
