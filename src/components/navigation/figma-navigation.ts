import { FRAME_H, FRAME_W } from '../main-home/assignment-home'

export type FigmaNavRect = { x: number; y: number; w: number; h: number }

/**
 * **모든 화면 공통 뒤로가기 자리.** Figma 393×852 기준.
 *
 * 전에는 화면마다 좌표가 제각각이었다(2026-08-08 전수 실측):
 * | 화면 | 구워진 `<` 위치 | 크기 |
 * |------|----------------|------|
 * | 문제화면 | x 32.5~47.5, y 79~100 | 15×21 |
 * | 성 학습 | x 19.5~27, y 27.5~37.5 | 7.5×10 (상태바 높이!) |
 * | 완료화면 | x 18.5~41, y 105~135 | 22×30 |
 *
 * 히트 영역도 세 갈래로 갈려 있었다. 지금은 **구워진 화살표를 덮고**(`BackButtonMask`)
 * 여기 한 자리에 다시 그린다.
 *
 * **2026-08-11: 상태바 시계(18:00) 바로 아래.** 전에는 (6, 6)으로 좌상단 끝에 둬서
 * 시계·신호 아이콘과 **같은 줄**에 겹쳤다. 상태바(~y 0–50) 아래로 내려
 * 시계 밑에 `<`가 오게 한다. 44×44 탭 영역은 유지.
 * 에셋에 구워진 `<`를 덮는 `BackButtonMask` 좌표는 **원래 자리 그대로 둬야 한다**
 * (덮개는 그림을 가리는 것이고, 새 화살표만 여기로 옮긴 것이다).
 *
 * **세로 위치(56)는 OS 상태바를 피한 값이다**(2026-08-11).
 * 우리가 그리던 가짜 상태바는 걷어냈지만, 실기기에서는 그 자리에 **OS가 진짜 상태바를
 * 그린다** — 시안이 비워 둔 53px이 바로 그 자리다. 거기에 버튼을 두면 시계·배터리에
 * 가려지고, iOS는 상태바 탭을 「맨 위로 스크롤」로 먹어 버려 눌리지도 않는다.
 * 그래서 44×44 탭 영역이 y 56~100으로 그 밴드 **완전히 아래**에 오게 잡았다.
 * 가로(6)는 모서리에 붙인 그대로 — 좌우는 가리는 게 없다.
 */
export const BACK_BUTTON_HIT: FigmaNavRect = { x: 6, y: 56, w: 44, h: 44 }

/** 뒤로가기 `<` 색 — 문제화면·완료화면 실측값(성 학습만 `#212633`이었다) */
export const BACK_CHEVRON_COLOR = '#A0AEB9'

/** `<` 획 크기 — 문제화면 구운 화살표 실측(15×21)에 맞춘 값. `BACK_BUTTON_HIT` 안 좌표 */
export const BACK_CHEVRON = { w: 15, h: 21, strokeWidth: 2.4 } as const

/**
 * 에셋에 구워진 `<`를 가리는 덮개. 화면마다 위치·배경색이 달라 화면 쪽에서 넘긴다.
 * 덮개 없이 새 화살표만 그리면 화살표가 두 개로 보인다.
 */
export type BackButtonMask = { rect: FigmaNavRect; color: string }

/**
 * 문제·학습 화면(흰 배경)의 구운 `<`를 덮는다.
 *
 * **실측 방법 주의**: 에셋을 `object-fit: contain`으로 렌더해서 재면 좌표가 밀린다
 * (SVG 원본 비율이 393:852와 달라 레터박싱된다). 앱은 `w-full h-full`로 **393×852에 늘려서**
 * 그리므로, 반드시 같은 방식으로 재야 한다. 한 번 이걸로 좌표를 틀리게 잡아 덮개가
 * 엉뚱한 데 깔린 적이 있다(2026-08-08).
 *
 * 실측값(393×852 기준): 대부분 x 31~45, y 81~103. 여유를 두고 덮는다.
 * 적용 대상은 **`<`가 실제로 구워져 있고 그 자리가 순백인 화면만** —
 * `word-a/b-start`, `word-c`, `body-text-a/c`, `grammar-type-1/2`.
 */
export const BACK_MASK_WHITE_HEADER: BackButtonMask = {
  rect: { x: 27, y: 76, w: 26, h: 32 },
  color: '#FFFFFF',
}

/**
 * 설정 창 — `settings-window.svg` 구운 `<`(≈x23–29, y77–87, 401 폭).
 * 프레임 393 환산 후 여유를 두고 덮는다. 마스크 없으면 React `<`와 겹쳐 두 개로 보인다.
 */
export const BACK_MASK_SETTINGS: BackButtonMask = {
  rect: { x: 16, y: 70, w: 32, h: 34 },
  color: '#FFFFFF',
}

/**
 * 성 학습 — 이 화면은 헤더에 구운 `<`가 **없다**(실측 y 126~171에 잡힌 건 마스코트 캐릭터였다).
 * 덮개를 씌우면 캐릭터 머리가 잘리므로 쓰지 않는다.
 * @deprecated `BACK_MASK_NONE`(기본값)을 쓸 것.
 */
export const BACK_MASK_CASTLE_LEARNING = null

/**
 * 완료 화면 — 구운 `<`(x 20~37, y 103~134).
 *
 * 이 자리 배경은 **단색이 아니라 세로 그라데이션**이라(위 `#ECFAFF` → 아래 `#E2F7FF`)
 * 단색으로 덮으면 이음새가 보인다. 그래서 같은 방향 그라데이션으로 덮는다.
 */
export const BACK_MASK_COMPLETE: BackButtonMask = {
  rect: { x: 15, y: 99, w: 28, h: 40 },
  color: 'linear-gradient(180deg, #ECFAFF 0%, #E2F7FF 100%)',
}

/**
 * 구운 `<`가 **아예 없는** 화면 — 덮개를 쓰지 않는다(기본값).
 *
 * 실측(2026-08-08): `body-text-complete` · `word-part-complete` ·
 * `sentence-grammar-complete-*` · `praise-calendar` 는 헤더에 화살표가 없는데도
 * 기본 흰 덮개가 깔려서 **하늘색 배경 위에 흰 사각형**이 보였다.
 */
export const BACK_MASK_NONE = null

/** @deprecated 화면별 좌표를 쓰지 말 것 — `BACK_BUTTON_HIT` 하나로 통일했다 */
export const FIGMA_HEADER_BACK_HIT = BACK_BUTTON_HIT

export function figmaNavRectStyle(rect: FigmaNavRect) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
