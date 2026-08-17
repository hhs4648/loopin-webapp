import type { CSSProperties } from 'react'
import { dimmedSurface, framePx, SKY_FIXED_H } from './assignment-home'

/** 풀밭 윗변에서 버튼 윗변까지 — 시안 실측(하늘 200 시절 y=220) */
const PRAISE_CALENDAR_TOP_GAP = 20

/**
 * ★칭찬캘린더 버튼 — `메인화면` 시안 흰 박스 실측(원본 899×1750 → 393 환산).
 * 맵에 구워진 잔상은 이 좌표로 가리고, 실제 버튼은 **뷰포트 고정**으로 올린다.
 *
 * y를 숫자로 박지 않고 **`SKY_FIXED_H`에서 파생**시킨다. 예전에는 220으로 고정돼 있었는데,
 * 하늘 밴드를 200 → 294로 키우자 버튼이 풀밭이 아니라 오늘의 미션 카드 위에 얹혔다
 * (2026-08-08). 풀밭 시작 바로 아래라는 관계를 코드로 붙들어 두면 다시 어긋나지 않는다.
 */
export const PRAISE_CALENDAR_FIXED_RECT = {
  x: 256,
  y: SKY_FIXED_H + PRAISE_CALENDAR_TOP_GAP,
  w: 107,
  h: 42,
}

/** @deprecated 맵 스크롤과 함께 움직이던 히트 영역 — `PRAISE_CALENDAR_FIXED_RECT` 사용 */
export const PRAISE_CALENDAR_MAP_RECT = PRAISE_CALENDAR_FIXED_RECT

/** 초대코드 화면(FRAME 좌표) 미리보기용 */
export const PRAISE_CALENDAR_FRAME_RECT = { x: 248, y: 268, w: 128, h: 42 }

const SURFACE_STYLE: Record<'default' | 'dimmed', CSSProperties> = {
  default: {
    background: '#FFFFFF',
    borderColor: '#B8D9FF',
    color: '#4F91EA',
    boxShadow: '0 4px 12px rgba(74,147,238,0.18)',
  },
  dimmed: {
    background: dimmedSurface({ r: 255, g: 255, b: 255 }),
    borderColor: dimmedSurface({ r: 184, g: 217, b: 255 }),
    color: dimmedSurface({ r: 79, g: 145, b: 234 }),
    boxShadow: 'none',
  },
}

const ICON_FILL: Record<'default' | 'dimmed', string> = {
  default: '#56A7FF',
  dimmed: dimmedSurface({ r: 86, g: 167, b: 255 }),
}

/**
 * 글자·별 크기 (393 기준).
 *
 * 예전에는 글씨가 **고정 18px**이었다. 알약 상자는 프레임에 비례해 줄어드는데 글씨만
 * 그대로라, 아이폰 SE(프레임 308)에서 **상자를 8px 넘쳤다.** `framePx`로 같이 줄인다.
 * 크기도 18 → 15로 낮췄다 — 맵에서 혼자 크게 도드라져 파트 카드와 부딪혔다.
 */
const LABEL_PX = 15
const ICON_PX = 17

const BASE_CLASS =
  "pointer-events-auto absolute z-[11] flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[14px] border font-['Pretendard',sans-serif] font-semibold leading-none"

type PraiseCalendarButtonProps = {
  /** 위치·크기 — 과제 맵에서는 뷰포트 고정(`figmaRectStyle`) */
  style: CSSProperties
  surface?: 'default' | 'dimmed'
  /** 없으면 비인터랙티브 미리보기로 렌더 */
  onClick?: () => void
}

/** 시안과 같은 다섯 꼭지 별 — 글자와 같은 비율로 줄어든다 */
function PraiseStarIcon({ fill }: { fill: string }) {
  return (
    <svg
      aria-hidden
      className="shrink-0"
      style={{ width: framePx(ICON_PX), height: framePx(ICON_PX) }}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M10 1.5L12.2 7.2L18.3 7.9L13.7 12.1L15.1 18.1L10 14.9L4.9 18.1L6.3 12.1L1.7 7.9L7.8 7.2L10 1.5Z"
        fill={fill}
      />
    </svg>
  )
}

export function PraiseCalendarButton({
  style,
  surface = 'default',
  onClick,
}: PraiseCalendarButtonProps) {
  const mergedStyle = {
    ...SURFACE_STYLE[surface],
    fontSize: framePx(LABEL_PX),
    ...style,
  }

  const content = (
    <>
      <PraiseStarIcon fill={ICON_FILL[surface]} />
      <span>칭찬 캘린더</span>
    </>
  )

  if (!onClick) {
    return (
      <div aria-hidden className={`${BASE_CLASS} pointer-events-none`} style={mergedStyle}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-label="칭찬 캘린더 열기"
      className={`${BASE_CLASS} cursor-pointer`}
      style={mergedStyle}
      onClick={onClick}
    >
      {content}
    </button>
  )
}
