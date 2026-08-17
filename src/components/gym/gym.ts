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
export const GYM_ASSET = '/assets/gym-main.svg?v=4'

/**
 * **이 시안에는 하단 내비가 구워져 있다**(y 770, 393×82 · 5칸).
 * 그래서 React 내비(`MainHomeBottomNav`)를 위에 또 올리지 않는다 — 두 겹이 된다.
 * 대신 구워진 칸 위에 **투명 히트영역만** 얹어 탭이 동작하게 한다.
 *
 * 슬롯은 내비 시안(`nav-bar.svg`)과 같은 5등분이다.
 */
export const GYM_NAV_BAR = { y: 770, h: 82 } as const
export const GYM_NAV_TAB_COUNT = 5

/** 탭 슬롯 대비 클릭 가능 폭 — 다른 내비와 같은 비율(좌우 여백으로 오탭 방지) */
export const GYM_NAV_HIT_WIDTH_RATIO = 0.52

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
