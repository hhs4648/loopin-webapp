import { FRAME_H, FRAME_W } from '../main-home/assignment-home'

/**
 * 헬스장 화면 — Figma `헬스장.svg` → `gym-main.svg`.
 *
 * 원본은 1254² PNG가 283.6² 자리에 박혀 있어 729KB였다. 표시 크기의 3배(852²)로
 * 줄여 533KB로 낮췄다(2026-08-11). 그림 자체가 큰 일러스트라 더는 줄이기 어렵다.
 *
 * 시안에 구워져 있던 **가짜 시계(x22, y37)는 지웠다**(`?v=2`) — 실기기에서는 OS가
 * 진짜 상태바를 그려서 두 겹이 되고, 하드코딩된 시각이 실제와 달라 고장처럼 보인다.
 *
 * 러닝머신 옆에 구워져 있던 **빨간 `NEW` 배지(봉투 아이콘 포함)도 지웠다**(`?v=3`).
 * 그림에 박혀 있으니 밀린 오답이 하나도 없어도 늘 떠 있어서, 새 문제가 온 것처럼
 * 보였다. 새 문제 알림은 상태에 따라 붙었다 떨어져야 하므로 `GymNewBadge`가 맡는다.
 * 원본은 `_backup/gym-main.v2.svg`.
 *
 * 맨 아래 **가짜 홈 인디케이터(검은 막대, y839)도 지웠다**(`?v=4`, `_backup/…v3.svg`).
 * 시계·와이파이와 같은 이유다 — iOS가 그리는 것이라 실기기에서 두 겹이 되고,
 * 안드로이드에서는 있지도 않은 막대가 그려진다.
 */
export const GYM_ASSET = '/assets/gym-main.svg?v=5'

/** 오답 대기 없음 — Figma `헬스장_빈상태.svg` */
export const GYM_EMPTY_ASSET = '/assets/gym-empty.svg?v=2'

/** 캐릭터 탭 후 — Figma `헬스장_문제풀기시작.svg` */
export const GYM_START_ASSET = '/assets/gym-start.svg?v=2'

/** 오답 1개 이상 — Figma `헬스장_완료화면.svg` */
export const GYM_COMPLETE_ASSET = '/assets/gym-complete.svg?v=2'

/** 백점 — Figma `헬스장_완료화면_전체정답.svg` */
export const GYM_COMPLETE_PERFECT_ASSET = '/assets/gym-complete-perfect.svg?v=2'

/** 완료 화면 파란 CTA — 시안 실측 305×52 @ (44, 644) */
export const GYM_COMPLETE_CTA_HIT = { x: 44, y: 644, w: 305, h: 52 } as const

/**
 * 오답 있을 때만 — 시안 「다음에 풀게요, 홈으로 가기」(회색 링크).
 * 파란 버튼(y644)과 내비(y770) 사이.
 */
export const GYM_COMPLETE_HOME_HIT = { x: 44, y: 704, w: 305, h: 36 } as const

/**
 * 시안 데모 「1단원 연습 완료!」·「5문제 중 4개 정답」.
 * 흰 배경으로 덮고 실제 단원·문항 수를 올린다.
 */
export const GYM_COMPLETE_HEADING_MASK = { x: 44, y: 490, w: 305, h: 32 } as const
export const GYM_COMPLETE_SUMMARY_MASK = { x: 44, y: 528, w: 305, h: 26 } as const
/** 오답 있을 때만 — 시안 「틀린 문제 1개가 있어요」 */
export const GYM_COMPLETE_WRONG_HINT_MASK = {
  x: 44,
  y: 610,
  w: 305,
  h: 28,
} as const

/**
 * 시작 화면 구운 `<`(M37 68 → 28.5 76.5 → 37 85). 투명 히트만 얹는다 —
 * 다시 그리면 화살표가 두 개가 된다.
 */
export const GYM_START_BACK_HIT = { x: 16, y: 56, w: 44, h: 44 } as const

/**
 * 시작 화면 파란 카드 전체 — 시안 실측 353×294 @ (20, 138).
 * 「지금 시작하기 →」 흰 버튼(305×48 @ 44, 362)과 그 위 문구를 같이 담는다.
 */
export const GYM_START_CTA_HIT = { x: 20, y: 138, w: 353, h: 294 } as const

export const GYM_START_CARD_BLUE = '#24A0FF'

/** 흰 알약 — 구운 글자를 덮고 「오답 풀기」를 다시 쓴다 */
export const GYM_START_BADGE = { x: 44, y: 160, w: 112, h: 24 } as const

/**
 * 구운 단원 제목·부제. 오른쪽 아이콘(x264)은 남긴다.
 * 카드색으로 덮은 뒤 React 제목을 올린다 — 시안 데모 문구가 비치면 안 된다.
 */
export const GYM_START_TITLE_MASK = { x: 44, y: 186, w: 214, h: 82 } as const
export const GYM_START_TITLE = { x: 44, y: 196, w: 214, h: 64 } as const

/**
 * 구분선(y274) ~ 「지금 시작하기」버튼(y362) 사이.
 * 시안 데모 「12문제 / 틀린 문항」「8분 / 예상 시간」을 카드색으로 덮고 React로 다시 쓴다.
 */
export const GYM_START_METRICS_MASK = { x: 44, y: 278, w: 305, h: 80 } as const
export const GYM_START_METRICS = { x: 44, y: 296, w: 305, h: 52 } as const
export const GYM_START_METRIC_LABEL_COLOR = '#D1E6FF'

/**
 * 빈상태 시안에 구워진 가짜 시계(9:41 @ y≈26–37). 실기기 OS 상태바와 두 겹이 되므로
 * 흰 덮개로 가린다. 제목(「헬스장」 y≈68)은 건드리지 않는다.
 */
export const GYM_EMPTY_STATUS_BAR_H = 53

/** 빈상태 「홈으로 가기」 CTA — 시안 실측 329×56 @ (32, 672) */
export const GYM_EMPTY_HOME_HIT = {
  x: 32,
  y: 672,
  w: 329,
  h: 56,
} as const

/**
 * **이 시안에는 하단 내비가 구워져 있다**(y≈769~852 · 5칸, 헬스장 활성).
 *
 * 예전에는 그 그림 위에 투명 히트영역만 얹었다(`GymNavHits`). 그런데 5칸 중 단어장은
 * 갈 화면이 없어 내비에서 뺐고, 그림은 그대로라 **없는 탭이 계속 보였다.**
 * 그래서 구워진 내비를 흰색으로 지우고 다른 화면과 같은 `MainHomeBottomNav`를 올린다 —
 * 내비가 한 곳(`MAIN_HOME_NAV_TABS`)에서만 정해지므로 다시 어긋날 수 없다.
 *
 * 실측(2026-09-09): 내비 윗변 y≈769, 그 위(y 765)는 5장 모두 순백이라 흰색으로 덮는다.
 * `MainHomeBottomNav`는 y 771부터 그리므로 덮개가 그 위 몇 px을 메운다.
 */
export const GYM_BAKED_NAV_COVER = { x: 0, y: 766, w: 393, h: 86 } as const

/**
 * 운동하는 캐릭터(일러스트) 자리 — 시안 실측 283.594² @ (39, 257.164).
 * 여기를 누르면 밀린 오답 과제 중 **가장 오래된 것**부터 푼다.
 */
export const GYM_CHARACTER_HIT = {
  x: 39,
  y: 257,
  w: 283.6,
  h: 283.6,
} as const

/** 프레임(393×852) 기준 rect → % 스타일 */
export function gymRectStyle(rect: {
  x: number
  y: number
  w: number
  h: number
}) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
