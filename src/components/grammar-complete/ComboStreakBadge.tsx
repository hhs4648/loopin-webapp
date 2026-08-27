import { figmaRectStyle } from './grammar-complete'

/**
 * 「연속 정답」 배지 — 불꽃 + 최고 콤보 수.
 *
 * 종합 완료 화면 **흰 카드 오른쪽 위 꼭짓점**에 붙인다(사용자 지정 2026-08-09).
 * 카드 실측: x35 y253 w327 (`assignment-complete-*.svg`). 마스코트는 왼쪽, 콤보는 오른쪽.
 *
 * **숫자는 에셋에서 떼어내고 여기서 그린다** — 콤보 수가 매번 다르기 때문.
 * 원본 `연속 정답.svg`(134×179)에서 흰 숫자 path만 제거한 것이 `combo-streak-badge.svg`다.
 */

/** 원본 SVG 박스 */
const SVG_BOX = { w: 134, h: 179 } as const

/** 원본에서 숫자 「3」이 있던 자리 — 렌더 실측(중심 64.3, 100.2) */
const NUMBER = { cx: 64.3, cy: 100.2, size: 46 } as const

/** 완료 화면 흰 결과 카드 */
const RESULT_CARD = { x: 35, y: 253, w: 327 } as const

/**
 * 프레임(393×852) 배치 — 카드 우상단.
 * 높이는 원본보다 줄여 카드 안으로 너무 깊게 들어가지 않게 한다.
 */
const BADGE_H = 110
const BADGE_W = Math.round((SVG_BOX.w / SVG_BOX.h) * BADGE_H)
const BADGE_PAD = 6
const BADGE = {
  x: RESULT_CARD.x + RESULT_CARD.w - BADGE_W - BADGE_PAD,
  // 카드 윗변에 걸쳐 앉힌다(불꽃 상단이 카드 위로 살짝 넘어감)
  y: RESULT_CARD.y - Math.round(BADGE_H * 0.42),
  w: BADGE_W,
  h: BADGE_H,
} as const

export function ComboStreakBadge({ combo }: { combo: number }) {
  if (combo < 2) return null

  return (
    <div
      className="pointer-events-none absolute z-[56] select-none"
      style={figmaRectStyle(BADGE)}
      role="img"
      aria-label={`최고 ${combo}연속 정답`}
    >
      <img
        src="/assets/combo-streak-badge.svg?v=1"
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full"
      />
      {/* 숫자는 SVG 뷰박스 안에 그려야 프레임이 커져도 같은 비율로 따라 커진다 */}
      <svg
        aria-hidden
        viewBox={`0 0 ${SVG_BOX.w} ${SVG_BOX.h}`}
        className="absolute inset-0 h-full w-full"
      >
        <text
          x={NUMBER.cx}
          y={NUMBER.cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={NUMBER.size}
          fontWeight="800"
          fill="#FFFFFF"
        >
          {combo}
        </text>
      </svg>
    </div>
  )
}
