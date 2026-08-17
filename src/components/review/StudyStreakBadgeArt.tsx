import type { CSSProperties, ReactNode } from 'react'

import { MAIN_HOME_ASSETS } from '../main-home/assignment-home'
import { MIN_STREAK_DAYS_TO_SHOW } from '../../features/review/review-streak'

/**
 * 「연속 학습」 별·구름 배지의 **그림 부분만**. 크기·위치는 부모가 정한다.
 *
 * 메인 맵 위 작은 배지(`StudyStreakBadge`)와 축하 화면의 큰 배지
 * (`StreakCelebrationScreen`)가 같은 그림을 쓰는데, 안쪽 글자 좌표가 실측값이라
 * 양쪽에 복사해 두면 한쪽만 고쳐지고 어긋난다. 그래서 여기 한 곳에 모은다.
 *
 * 에셋은 두 벌이다.
 * - **1일**: 별에 숫자 대신 웃는 얼굴 (`streak-badge-day1.svg`)
 * - **2일 이상**: 별에 숫자 (`streak-badge.svg`)
 *
 * **글자(숫자·구름 문구)는 SVG에서 떼어내고 여기서 그린다.** 숫자가 매일 바뀌어 구운
 * 글자로는 안 되고, 1일 에셋의 구름 글자는 원본 상태로는 거의 렌더되지 않았다(1배에서 0픽셀).
 *
 * 글자를 HTML이 아니라 **같은 viewBox의 SVG로** 얹는 이유는, 배지가 커져도 글자가 그림과
 * **같은 비율로** 따라 커지게 하려는 것이다.
 */

export const STREAK_BADGE_SVG_BOX = { w: 151, h: 93 } as const

/**
 * SVG(151×93) 안에서 도형이 실제로 차지하는 자리 — 렌더해서 실측한 값.
 * 나머지는 드롭섀도가 번질 여백이다. 에셋을 다시 뽑으면 이 값도 다시 재야 한다.
 */
export const STREAK_BADGE_SHAPE_IN_SVG = {
  x: 18.3,
  y: 18.3,
  w: 113.5,
  h: 55.8,
} as const

/** 별 안 숫자 — 원본 「2일」 잉크 실측(중심 39.5, 44.2 · 높이 10.4) */
const NUMBER = { cx: 39.5, cy: 44.2, size: 14, color: '#8A5A12' } as const

/** 구름 글자 — 원본 「연속 학습 중」 잉크 실측(중심 87.0, 61.6 · 높이 8.8) */
const CLOUD = { cx: 87, cy: 61.6, size: 11.5, color: '#6D6D6D' } as const

/** 1일차 구름 문구 — 디자이너 시안과 동일. 바꾸려면 여기만 고치면 된다 */
const DAY1_LABEL = '학습 시작!'
const STREAK_LABEL = '연속 학습 중'

/** 「도형이 이만큼 넓었으면」 → 그림자 여백까지 포함한 `<img>` 박스 크기 */
export function streakBadgeBoxForShapeWidth(shapeWidth: number): {
  w: number
  h: number
} {
  const scale = shapeWidth / STREAK_BADGE_SHAPE_IN_SVG.w
  return {
    w: STREAK_BADGE_SVG_BOX.w * scale,
    h: STREAK_BADGE_SVG_BOX.h * scale,
  }
}

/** 1일차는 별에 웃는 얼굴이 들어가 있어 숫자를 그리지 않는다 */
export function isStreakDay1(days: number): boolean {
  return days < MIN_STREAK_DAYS_TO_SHOW
}

export function StudyStreakBadgeArt({
  days,
  /** 별 안 숫자에 얹을 애니메이션 등 — 축하 화면이 「숫자가 바뀌는」 연출에 쓴다 */
  numberStyle,
  /** 숫자 옆에 겹쳐 그릴 것(반짝임 등). 같은 viewBox 좌표계에 들어간다 */
  overlay,
  ariaLabel,
  className = '',
  style,
}: {
  days: number
  numberStyle?: CSSProperties
  overlay?: ReactNode
  /** 없으면 순수 장식으로 취급해 스크린리더에서 숨긴다 */
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}) {
  const day1 = isStreakDay1(days)

  return (
    <div
      className={`relative ${className}`}
      style={style}
      {...(ariaLabel ? { role: 'img', 'aria-label': ariaLabel } : { 'aria-hidden': true })}
    >
      <img
        src={day1 ? MAIN_HOME_ASSETS.streakBadgeDay1 : MAIN_HOME_ASSETS.streakBadge}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
      />

      <svg
        aria-hidden
        viewBox={`0 0 ${STREAK_BADGE_SVG_BOX.w} ${STREAK_BADGE_SVG_BOX.h}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        {day1 ? null : (
          <text
            x={NUMBER.cx}
            y={NUMBER.cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={NUMBER.size}
            fontWeight="800"
            fill={NUMBER.color}
            style={{
              // 숫자만 커졌다 줄어들려면 자기 중심이 기준이어야 한다
              transformOrigin: `${NUMBER.cx}px ${NUMBER.cy}px`,
              ...numberStyle,
            }}
          >
            {days}일
          </text>
        )}
        <text
          x={CLOUD.cx}
          y={CLOUD.cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={CLOUD.size}
          fontWeight="700"
          fill={CLOUD.color}
        >
          {day1 ? DAY1_LABEL : STREAK_LABEL}
        </text>
        {overlay}
      </svg>
    </div>
  )
}
