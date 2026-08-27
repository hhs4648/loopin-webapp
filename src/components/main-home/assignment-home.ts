export const MAIN_HOME_ASSETS = {
  /*
    **구 맵 이미지 3종은 여기 없다.** 2026-08-08에 벡터 맵으로 대체됐고,
    2026-08-22에 `public/assets`에서 `_design-source/`로 옮겼다.

    6.2MB짜리 `main-home-academy-map.svg`는 SVG 껍데기 안에 가로 360px PNG가 통째로
    박혀 있었다. 최대 540px 폭 · DPR 2~3에서 3~4배로 확대돼 흐릿하고 채도가 죽었다.
    지금은 `mapPathTile` + `mapCastle` + 장식 에셋 조합(전부 벡터)이 대신한다.

    렌더에 안 쓰는데 `public/assets`에 있으면 **학생 기기로 배포되는 용량만 7.5MB**
    늘어난다(받지는 않지만 배포본에 실린다). 대조용 원본은 `_design-source/`에 있다:
      main-home-academy-map.svg · main-home-map-long.svg · main-home-map-scroll.svg
    되살리지 말 것 — 되살리면 화질 회귀다.
  */
  mapFrame: '/assets/main-home-assignment-received.svg?v=3',
  castleGray: '/assets/castle-gray.svg',
  /**
   * 맵 길 — **벡터 타일 1장**을 세로 반복해 맵 전체를 만든다(`MAP_PATH_*`).
   * 6.2MB SVG(안에 360px 폭 PNG가 박혀 있었다)를 대체한다.
   */
  mapPathTile: '/assets/map-path-tile.svg?v=4',
  /**
   * 길의 첫 주기 — 둥근 캡으로 시작한다(반복 타일은 위아래가 이어져 있어 캡이 없다).
   *
   * **이 SVG들을 고치면 `?v=` 숫자를 반드시 올릴 것.** 브라우저가 파일을 캐시해서
   * 고쳐도 화면이 그대로인 일이 실제로 있었다(2026-08-08, 지운 리드인이 계속 보였다).
   */
  mapPathStart: '/assets/map-path-start.svg?v=5',
  /** @deprecated Figma 원본 export — 렌더에는 `mapPathTile`을 쓴다 (좌표 변환·이음새 처리 포함) */
  mapPathSource: '/assets/map-path.svg',
  /** @deprecated 성은 색을 입혀야 해서 `MapCastleSprite`(인라인 SVG)로 그린다 */
  mapCastle: '/assets/map-castle.svg',
  /** 아직 안 준 성에 붙는 자물쇠 배지 — 벡터(30×30) */
  mapLockBadge: '/assets/map-lock-badge.svg?v=2',
  /**
   * 연속 학습 배지 — 별 + 무지개 + 구름 (151×93 / 1일용 149×92).
   * 원본 `연속학습.svg` · `1일.svg` 에서 **글자를 떼어낸** 버전이다.
   * 숫자·문구는 `StudyStreakBadge`가 그린다 (숫자가 매일 바뀌고, 1일 에셋의 구운 글자는
   * 원본 상태로는 거의 렌더되지 않았다).
   */
  streakBadge: '/assets/streak-badge.svg?v=1',
  streakBadgeDay1: '/assets/streak-badge-day1.svg?v=1',
  /**
   * 맵 장식 — 커리큘럼 맵과 같은 에셋을 공유한다(`MainHomeMapDecor`).
   * 예전에는 맵 이미지에 구워져 있어서 배경과 같이 뭉개졌다.
   */
  decorDinosaur: '/assets/curriculum-dinosaur.svg?v=2',
  decorTreeRound: '/assets/curriculum-tree-round.png',
  decorTreeTall: '/assets/curriculum-tree-tall.png',
  /** @deprecated 저해상도(100×114) — `mapCastle` 사용 */
  mapCastleLegacy: '/assets/map-castle-red-flag.png',
  /** 시작 깃발 — React 오버레이(`flag.svg`). 하늘 크롭 아래에 배치 · 항상 표시 */
  startFlag: '/assets/flag.svg?v=3',
  /** 하단 탭바 */
  /** 5칸 공통 내비 — 원본 `네비게이션바.svg` */
  bottomNav: '/assets/nav-bar.svg?v=1',
  /** 복습 탭 활성 (아이콘·라벨 #333333) */
  bottomNavReview: '/assets/main-home-bottom-nav-review.svg?v=3',
  /**
   * 완료 별표 — `별표.svg` → `mission-star.svg`.
   * 렌더는 `MissionCheckBadge`가 성 색으로 다시 그림(에셋은 시안 참고).
   */
  missionStar: '/assets/mission-star.svg',
  /** @deprecated 체크 시안 — 완료는 `missionStar` / `MissionCheckBadge` */
  missionCheck: '/assets/mission-check.svg',
  /** 마스코트 — 시작 지점 대기. 원본: `마스코트 캐릭터 시작.svg` */
  mascotWave: '/assets/mascot-character-start.svg?v=2',
  /** 마스코트 — 성 도착·현재 위치 만세. 원본: `만세 캐릭터.svg` → `mascot-banzai.svg` */
  mascotCheer: '/assets/mascot-banzai.svg?v=1',
  /**
   * @deprecated 배치 참고용만 — 렌더에 쓰지 않음.
   * Figma `캐릭터 성도착.svg` → `character-castle-arrive.svg`
   */
  castleArrive: '/assets/character-castle-arrive.svg?v=1',
  /** 완료 성 재도전 확인 — Figma `재도전 화면.svg` (하늘 색은 무시) */
  castleRetryScreen: '/assets/castle-retry-screen.svg?v=4',
} as const

/** 재도전 화면 — 취소 버튼 (Figma path ≈ x30–155 y690–750) */
export const CASTLE_RETRY_CANCEL_HIT = { x: 30, y: 690, w: 125, h: 60 }
/** 재도전 화면 — 「재도전」 버튼 (Figma path ≈ x165–356 y690–750) */
export const CASTLE_RETRY_CONFIRM_HIT = { x: 165, y: 690, w: 191, h: 60 }
/**
 * 재도전 화면 — 헤더 `<`.
 * @deprecated 공통 `BACK_BUTTON_HIT`(`navigation/figma-navigation.ts`)를 쓸 것.
 * 화면마다 좌표를 따로 두다가 세 갈래로 갈렸던 이력이 있어 2026-08-08에 하나로 합쳤다.
 */
export const CASTLE_RETRY_BACK_HIT = { x: 20, y: 68, w: 44, h: 44 }

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

/**
 * 393 기준 크기를 **프레임 폭에 맞춰** 스케일한 CSS 길이.
 *
 * 프레임은 `min(100vw, 540px, var(--app-vh) × 393/852)`다(`index.css`). `vw`만 쓰면 화면이
 * 넓고 낮을 때(노트북 창 등) 프레임은 높이에 걸려 좁아지는데 글씨는 안 줄어든다.
 * 그래서 **프레임과 같은 세 항목**을 그대로 쓴다.
 *
 * 고정 `px`로 크기를 정하면 프레임이 줄어도 그대로라 상자를 넘친다.
 * 「칭찬 캘린더」 알약이 아이폰 SE에서 그렇게 8px 넘쳤다.
 */
export function framePx(pxAt393: number): string {
  const vw = (pxAt393 / 393) * 100
  const max = (pxAt393 * 540) / 393
  return `min(${vw.toFixed(2)}vw, ${max.toFixed(1)}px, calc(var(--app-vh) * ${pxAt393} / 852))`
}

export const FRAME_W = 393
/** Initial viewport height (Figma frame) */
export const FRAME_H = 852

/**
 * 학원/학교 메인 하늘.
 * 위 흰색 → 아래 `#C5EBFE`.
 */
export const MAIN_HOME_SKY_TOP = '#FFFFFF'
export const MAIN_HOME_SKY_BOTTOM = '#C5EBFE'

/**
 * 고정 하늘 밴드(`SKY_FIXED_H`)에 쓰는 그라데이션.
 * 위→아래, 중간 스톱은 밴딩 완화용.
 */
export const MAIN_HOME_SKY_GRADIENT = `linear-gradient(180deg, ${MAIN_HOME_SKY_TOP} 0%, #E4F5FF 50%, ${MAIN_HOME_SKY_BOTTOM} 100%)`

/**
 * 맵 풀밭 그라데이션 — 시안 실측(`메인화면.png` 상단 #74EDB2 → 하단 #ADE0E9).
 *
 * 마지막 스톱 이후는 색이 그대로 유지되므로, 맵 위쪽에서만 초록빛이 돌고 아래는 균일해진다
 * (구 맵의 풀색이 거의 균일했던 것과 같은 인상).
 */
export const MAP_GRASS_TOP = '#74EDB2'
export const MAP_GRASS_BOTTOM = '#ADE0E9'

/**
 * 프레임 바깥 레터박스처럼 **단색**이 필요한 자리.
 * 하늘 밴드 아래쪽 색과 맞춰 이어 보이게 한다.
 */
export const MAIN_HOME_SKY = MAIN_HOME_SKY_BOTTOM

/** 초대 SVG 전체 딤(검정 45%) 아래 표면 근사 */
export const INVITE_DIM_OVERLAY_OPACITY = 0.45

export function dimmedSurface(
  base: { r: number; g: number; b: number },
  opacity = INVITE_DIM_OVERLAY_OPACITY,
) {
  const scale = 1 - opacity
  const toHex = (channel: number) =>
    Math.round(channel * scale)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(base.r)}${toHex(base.g)}${toHex(base.b)}`
}

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

/** 맵 풀 바탕 — LONG 실측 rgb(173,228,222) */
export const MAIN_HOME_GRASS = '#ADE4DE'

/**
 * 뷰포트 고정 하늘 — 드래그/스크롤 불가. 연속 학습 배지·오늘의 미션 카드가 여기 들어간다.
 * 풀은 이 아래부터 바로 시작(위로 당김).
 *
 * **풀밭 높이를 Figma 지정값 477로 맞춘 값이다** (2026-08-08).
 * `852(프레임) − 81(하단 내비) − 477(풀밭) = 294`
 * 그래서 이 값을 바꾸면 풀밭 높이가 같이 바뀐다 — `MAP_GRASS_VISIBLE_H`로 검산할 것.
 * 오늘의 미션 카드 아랫변(y=250)도 이 안에 들어와야 한다.
 */
export const SKY_FIXED_H = 294

/** 화면에 보이는 풀밭 높이 — Figma 지정 477 */
export const MAP_GRASS_VISIBLE_H = FRAME_H - SKY_FIXED_H - 81

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

/**
 * 길 타일 파라미터. 좌표는 전부 **프레임(393폭) px**.
 *
 * `map-path.svg`는 시작 (41, 29.07) → 끝 (28, 396.87)로 **정확히 1주기**인 곡선이다.
 * 아래 값은 구 맵 위에 겹쳐 렌더해 맞춘 실측값이다 — 임의로 바꾸면 성이 길에서 벗어난다.
 *
 * **주기를 `성 묶음 ÷ 7`로 못박은 이유**: 성 한 묶음(21개)이 `MAP_CASTLE_PERIOD_LONG`마다
 * 반복되고 `CASTLE_PATTERN`이 3개 주기(가운데·오른쪽·왼쪽)다. 길 1주기에 성이 정확히 3개
 * 들어가야 두 패턴이 영원히 안 어긋난다 → 묶음당 길 7주기.
 */
export const MAP_PATH_SOURCE_PERIOD = 367.8053
export const MAP_PATH_PERIOD = (MAP_CASTLE_PERIOD_LONG * MAP_SCALE) / 7
/** 원본 곡선을 세로로 눌러 주기를 맞추는 배율 */
export const MAP_PATH_SCALE_Y = MAP_PATH_PERIOD / MAP_PATH_SOURCE_PERIOD
/** 곡선 원본의 시작 y — 변환 기준점 */
export const MAP_PATH_SOURCE_TOP = 29.0667
/** 맵 최상단 기준 첫 타일 위치 */
export const MAP_PATH_PHASE = 21.8
/** 곡선을 프레임 안 제자리로 옮기는 가로 이동 */
export const MAP_PATH_OFFSET_X = 39

/**
 * 길이 **시작**하는 y (둥근 끝 캡이 보이는 지점).
 *
 * 반복 타일만 깔면 화면 맨 위에서 길이 잘린 채 흘러나와 어색하다. 하늘 크롭 바로 아래
 * (= 스크롤 영역 최상단, 시작 깃발 자리)에서 처음 오는 주기 시작점을 길의 출발점으로 삼는다.
 * 이 위쪽에는 길을 그리지 않는다.
 */
export const MAP_PATH_START_Y =
  MAP_PATH_PHASE +
  Math.ceil((MAP_SKY_CROP - MAP_PATH_PHASE) / MAP_PATH_PERIOD) * MAP_PATH_PERIOD

/**
 * `map-path-start.svg` 상단 여백(프레임 px = SVG 단위).
 * viewBox를 곡선 시작 y에 붙이면 둥근 캡·흰 글로우가 잘려 출발선이 얇고
 * 白い 사각으로 보인다. 패딩만큼 위를 연 SVG와 같은 값이어야 한다.
 */
export const MAP_PATH_START_PAD = 40
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
 * 부여분 + 이 값만큼 자물쇠 성을 보여 「다음에 올 길」만 살짝 보이게 한다.
 * (너무 많이 보여 주면 「과제 N개인데 잠긴 성이 더 있다」로 오해하기 쉬움)
 */
export const MAP_SCROLL_LOOKAHEAD_CASTLES = 1

export function resolveMapSegmentCount(_assignedCount: number): number {
  return 0
}

export function resolveMapHasBridge(_assignedCount: number): boolean {
  return false
}

/**
 * 성 에셋(`map-castle.svg`) 원본 비율 — 74×82라 **세로가 더 길다.**
 *
 * 예전에는 `61/77`(≈0.79, 가로가 더 긴 값)을 썼다. 구 맵에 구워진 성을 실측한 값인데,
 * 벡터 성을 그 비율로 그리면 세로가 71%로 눌려 납작해 보인다.
 */
const CASTLE_ASPECT = 82 / 74

/**
 * 성 스프라이트에서 **깃대·깃발이 차지하는 윗부분** 비율.
 *
 * `map-castle.svg`(74×82)에서 성 몸통(흉벽 꼭대기 y=20.58 ~ 바닥 81.58)은 61이고
 * 그 위 21은 깃대다. 예전 `castle.h`는 **몸통 높이**였는데 지금은 깃대까지 포함한 전체라,
 * 성 높이를 기준으로 잡던 값들(캐릭터 크기·마커 위치)을 그대로 두면 다 커지고 위로 뜬다.
 * → 그런 계산은 `castleBodyRect`를 거쳐야 한다.
 */
const CASTLE_FLAG_RATIO = 21 / 82

/**
 * 성 크기 배율 — 여기 숫자만 바꾸면 된다.
 *
 * **1.0이 「원래 크기」다.** 구 비율(`61/77`)이 성을 세로로 71% 눌러 납작하게 그리고 있었고,
 * 그걸 바로잡은 것만으로 제 크기가 된다. 여기서 더 키우면 성이 길을 덮는다.
 */
const CASTLE_SIZE_SCALE = 1

function longToFrameCastle(
  id: string,
  longCx: number,
  longFloorY: number,
  longW: number,
): MapCastle {
  const w = Math.round(longW * MAP_SCALE * CASTLE_SIZE_SCALE)
  const h = Math.round(w * CASTLE_ASPECT)
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

/**
 * LONG 실측 베이크 자물쇠(흰 원) 중심 — 1~21성. **맵이 래스터였던 시절의 좌표다.**
 *
 * 성마다 어긋나 있다 — 1성은 통일 좌표보다 18px 위, 나머지는 성 패턴 3주기를 따라
 * 1~4px씩 흔들린다. **마커 자리로 쓰지 말 것**(자물쇠 포함 — 2026-08-09까지 자물쇠만
 * 이걸 쓰고 있어서 「성마다 자물쇠 높이가 다르다」가 됐다). 배경이 벡터가 된 뒤로는
 * 구운 자물쇠 자체가 없어 덮개 용도도 없고, 지금은 성 슬롯이 없을 때의 fallback으로만 남는다.
 */
const LOCK_MARKERS_LONG = [
  { cx: 183.5, cy: 308.5 },
  { cx: 286.5, cy: 453.5 },
  { cx: 73, cy: 568.5 },
  { cx: 181, cy: 648.5 },
  { cx: 286.5, cy: 775.5 },
  { cx: 73, cy: 890.5 },
  { cx: 181, cy: 960.5 },
  { cx: 286.5, cy: 1087.5 },
  { cx: 73, cy: 1202.5 },
  { cx: 181, cy: 1272.5 },
  { cx: 286.5, cy: 1399.5 },
  { cx: 73, cy: 1514.5 },
  { cx: 181, cy: 1583.5 },
  { cx: 286.5, cy: 1710.5 },
  { cx: 73, cy: 1825.5 },
  { cx: 181, cy: 1895.5 },
  { cx: 286.5, cy: 2022.5 },
  { cx: 73, cy: 2137.5 },
  { cx: 181, cy: 2206.5 },
  { cx: 286.5, cy: 2333.5 },
  { cx: 73, cy: 2448.5 },
] as const

/**
 * 성 꼭대기(y) → 자물쇠/별표/깃발 중심.
 * 2~21성 베이크 실측 평균(≈−42.8)에 맞춤 — 열·회차 공통.
 * (1성 베이크만 유난히 위쪽이라 덮개로 가리고 여기로 통일)
 */
const MARKER_OFFSET_FROM_CASTLE_TOP = -43

/** 맵 SVG에 구워진 자물쇠 중심(프레임) — 잔디 덮개 전용 */
export function bakedLockMarkerCenter(index: number): {
  cx: number
  cy: number
} {
  const bundle = Math.floor(index / MAP_CASTLE_BUNDLE_SIZE)
  const phase = index % MAP_CASTLE_BUNDLE_SIZE
  const base = LOCK_MARKERS_LONG[phase]!
  return {
    cx: base.cx * MAP_SCALE,
    cy: (base.cy + MAP_CASTLE_PERIOD_LONG * bundle) * MAP_SCALE,
  }
}

/** 상태 마커(별표·깃발·필) 중심 — 성 슬롯 기준 통일 */
export function castleCompleteMarkerCenter(index: number): {
  cx: number
  cy: number
} {
  const castle = MAP_CASTLE_SLOTS[index]
  if (!castle) {
    return bakedLockMarkerCenter(index)
  }
  // 성 **몸통** 꼭대기 기준 — 전체 높이를 쓰면 깃대만큼 위로 떠 버린다
  return {
    cx: castle.x + castle.w / 2,
    cy: castleBodyRect(castle).y + MARKER_OFFSET_FROM_CASTLE_TOP,
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
 * `mascot-character-start.svg`는 586×586 **정사각** 안에 캐릭터가 여백을 두고 들어 있다.
 * (`mascot-banzai.svg`는 내용이 박스를 꽉 채우는데 이 에셋만 다르다 — 파일만 보고 같다고 치면 안 된다.)
 * 아래는 내장 PNG 알파 실측 비율이다.
 *
 * **이 여백을 무시한 것이 「시작 캐릭터 위치가 이상하다」의 원인이었다**(2026-08-09 수정).
 * 박스를 캐릭터 크기로 착각해 84×116으로 잡았는데, `object-contain`이라 실제로는
 * 정사각 84×84로 축소돼 그려지고 그 안에서 캐릭터는 45×53만 차지했다. 결과적으로
 * 발끝이 의도한 지면(395)보다 18px 떠 있고, 「현재 위치」 필과 16px 벌어져 보였다.
 */
const START_MASCOT_ART = {
  left: 0.2209,
  top: 0.1579,
  right: 0.7528,
  bottom: 0.7847,
} as const

/**
 * 시작 마스코트 — **보이는 캐릭터** 기준값(박스가 아니라 그림 자체).
 *
 * 깃발(x≈33–86, 밑동 y≈371) 바로 오른쪽에 선다. 깃발과만 안 겹치면 된다.
 * 예전 `cx:150 / feetY:395`는 1성과 겹쳐 이상해 보였다.
 * 높이 53은 성 도착 마스코트(`castleMascotClipRect` ≈ 50)과 맞춤.
 */
const START_MASCOT_VISIBLE = { cx: 102, feetY: 370, h: 53 } as const

/**
 * 보이는 캐릭터를 원하는 자리에 놓기 위한 `<img>` 박스 역산.
 * 정사각 박스를 쓰면 `object-contain`이 이미지를 박스에 정확히 맞춘다 —
 * 그래야 여백 비율을 그대로 곱해 그림 위치를 계산할 수 있다.
 */
function startMascotBox() {
  const artW = START_MASCOT_ART.right - START_MASCOT_ART.left
  const artH = START_MASCOT_ART.bottom - START_MASCOT_ART.top
  const side = START_MASCOT_VISIBLE.h / artH
  return {
    x: START_MASCOT_VISIBLE.cx - (START_MASCOT_ART.left + artW / 2) * side,
    y: START_MASCOT_VISIBLE.feetY - START_MASCOT_ART.bottom * side,
    w: side,
    h: side,
  }
}

export const MASCOT_WAVE_RECT = startMascotBox()

/**
 * 스크롤 콘텐츠 높이 — 풀맵 배경 유지(`MAP_SCROLL_H`).
 * 드래그 상한은 `resolveMapScrollLimitY` / `resolveMapMaxScrollTop`.
 */
export function resolveMapScrollContentHeight(_assignedCount: number): number {
  return MAP_SCROLL_H
}

/**
 * 드래그 허용 하단(하늘 크롭 후 프레임 px).
 * 부여된 마지막 성 + 룩어헤드(`MAP_SCROLL_LOOKAHEAD_CASTLES`) 밑변 + 여유 —
 * 이보다 아래로 스크롤하지 않음.
 */
export function resolveMapScrollLimitY(assignedCount: number): number {
  if (assignedCount <= 0) {
    // 깃발·시작 마스코트·「현재 위치」 필이 잘리지 않게
    const startBottom =
      START_LOCATION_PILL_RECT.y +
      START_LOCATION_PILL_RECT.h -
      MAP_SKY_CROP
    return Math.min(
      MAP_SCROLL_H,
      Math.max(startBottom + MAP_END_PADDING, 200),
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
 * - 마스코트 발끝 y ≈ 89 · 마스코트 박스 ≈ 40×46 (기존 mascot-cheer)
 * → 발끝 ≈ 성바닥, 마스코트 높이 ≈ 성 높이 × (46/61)
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
 * 성 **몸통** 박스 — 깃대를 뺀 부분.
 *
 * 성 대비 크기·위치를 잡는 계산은 전부 이걸 기준으로 해야 한다. 전체 높이(`castle.h`)를 쓰면
 * 깃대만큼 과하게 커지거나 위로 뜬다. `CASTLE_ARRIVE_REF`의 `castleH`(61)도 몸통 기준값이다.
 */
export function castleBodyRect(castle: {
  x: number
  y: number
  w: number
  h: number
}) {
  const flagH = castle.h * CASTLE_FLAG_RATIO
  return { x: castle.x, y: castle.y + flagH, w: castle.w, h: castle.h - flagH }
}

/**
 * 맵 성 위 환호 마스코트 박스.
 * 가로 중앙 · 박스 밑변(발끝) = 성 밑변 `castle.y + castle.h`.
 *
 * 크기는 **몸통** 높이 기준이다 — 전체 높이로 재면 마스코트가 성만큼 커진다.
 */
export function castleMascotClipRect(castle: {
  id?: string
  x: number
  y: number
  w: number
  h: number
}) {
  const { castleH, mascotW, mascotH } = CASTLE_ARRIVE_REF
  const h = Math.round(castleBodyRect(castle).h * (mascotH / castleH))
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

/** 완료 성 양옆 반짝이 — 입구에 앉은 마스코트 좌·우 */
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

/**
 * 시작 지점 「현재 위치」 필 — 마스코트 **발끝** 아래.
 * 성 도착 마스코트(`currentLocationPillRect`)과 같은 크기·같은 간격을 쓴다.
 * (`CURRENT_LOCATION_PILL` 선언 뒤여야 해서 여기 있다 — 위치가 아니라 초기화 순서 문제)
 */
export const START_LOCATION_PILL_RECT = {
  x: START_MASCOT_VISIBLE.cx - CURRENT_LOCATION_PILL.w / 2,
  y: START_MASCOT_VISIBLE.feetY + PILL_GAP_BELOW_FEET,
  w: CURRENT_LOCATION_PILL.w,
  h: CURRENT_LOCATION_PILL.h,
} as const

/** 완료 별표(자물쇠) 자리 「재도전 중!」 필 — 별표와 같은 중심 */
export const CASTLE_RETRYING_PILL = { w: 102, h: 30 } as const

/**
 * 「틀린문제 푸는중!」 — 「재도전 중!」보다 글자가 길어 필도 넓다.
 * 13px bold 한글 8자 ≈ 100px + 좌우 여백.
 */
export const CASTLE_WRONG_ONLY_PILL = { w: 124, h: 30 } as const

/** 자물쇠/별표 중심에 틀린문제 필 배치 */
export function castleWrongOnlyPillStyle(cx: number, cy: number) {
  const { w, h } = CASTLE_WRONG_ONLY_PILL
  return fullMapRectStyle(cx - w / 2, cy - h / 2, w, h)
}

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

/** 완료 별표 크기 — 자물쇠·성 꼭대기를 충분히 덮음 */
const MARKER_SIZE = 58
/**
 * 부여·미시작 성 — SVG 베이크 자물쇠(흰 원 ≈29px LONG)만 가림.
 * 32px면 뱃지는 덮고 깃발·성 꼭대기는 거의 안 밟음(36+는 깃발 침범).
 */
const LOCK_COVER_SIZE = Math.round(32 * MAP_SCALE)

export function frameRectStyle(x: number, y: number, w: number, h: number) {
  return {
    left: `${(x / FRAME_W) * 100}%`,
    top: `${(y / FRAME_H) * 100}%`,
    width: `${(w / FRAME_W) * 100}%`,
    height: `${(h / FRAME_H) * 100}%`,
  }
}

export function figmaRectStyle(rect: {
  x: number
  y: number
  w: number
  h: number
}) {
  return frameRectStyle(rect.x, rect.y, rect.w, rect.h)
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

/**
 * 자물쇠 배지 자리 — 별표·깃발(`fullMapMarkerStyle`)과 **같은 중심**에 놓는다.
 * 크기만 작다: 별표/깃발 에셋은 67 뷰박스에 은은한 아우라가 포함돼 있고 실제 원은
 * 그 중 35px 정도라, 아우라가 없는 자물쇠(30×30)는 그 원 크기에 맞춘다.
 */
export function fullMapLockBadgeStyle(cx: number, cy: number) {
  const half = LOCK_COVER_SIZE / 2
  return fullMapRectStyle(cx - half, cy - half, LOCK_COVER_SIZE, LOCK_COVER_SIZE)
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
export type MainHomeNavTabId = 'home' | 'vocab' | 'review' | 'gym' | 'menu'

export type MainHomeNavTab = {
  id: MainHomeNavTabId
  label: string
  ariaLabel: string
}

/**
 * 하단 내비 5칸 (2026-08-11 · 시안 `nav-bar.svg`).
 * 순서·개수가 시안 슬롯과 1:1이어야 클릭 자리가 맞는다 — 시안은 393을 5등분(78.62)한다.
 */
export const MAIN_HOME_NAV_TABS: MainHomeNavTab[] = [
  { id: 'home', label: '홈', ariaLabel: '홈' },
  { id: 'vocab', label: '단어장', ariaLabel: '단어장' },
  { id: 'review', label: '복습하기', ariaLabel: '복습하기' },
  { id: 'gym', label: '헬스장', ariaLabel: '헬스장' },
  { id: 'menu', label: '전체', ariaLabel: '전체' },
]

/**
 * 하단 내비 시안 — **활성 칸별로 한 장씩**.
 *
 * 예전에는 `nav-bar.svg` 한 장뿐이었고 그 안에서 1번 칸(홈)이 진하게 칠해져 있었다.
 * 그래서 복습하기·헬스장·전체에 들어가도 홈이 켜진 채였고, 지금 어디인지 알 수가
 * 없었다.
 *
 * 원본에서 칸을 나눠 색만 바꿔 5장을 만들었다(활성 `#333333` · 비활성 `#DCDCDC`).
 * 시안이 새로 오면 같은 이름으로 덮으면 되고, 여기 코드는 손댈 필요가 없다.
 * 원본은 `_design-source/nav-bar.original.svg`.
 */
const NAV_ASSET_BY_TAB: Record<MainHomeNavTabId, string> = {
  home: '/assets/nav-bar-home.svg?v=1',
  vocab: '/assets/nav-bar-vocab.svg?v=1',
  review: '/assets/nav-bar-review.svg?v=1',
  gym: '/assets/nav-bar-gym.svg?v=1',
  menu: '/assets/nav-bar-menu.svg?v=1',
}

export function mainHomeNavAssetFor(activeId: MainHomeNavTabId): string {
  return NAV_ASSET_BY_TAB[activeId] ?? MAIN_HOME_ASSETS.bottomNav
}

