import type { CSSProperties } from 'react'
import { dimmedSurface } from './session-round-dropdown'

/**
 * ★칭찬캘린더 버튼 — `메인화면` 시안 흰 박스 실측(원본 899×1750 → 393 환산).
 * 맵에 구워진 잔상은 이 좌표로 가리고, 실제 버튼은 **뷰포트 고정**으로 올린다.
 */
export const PRAISE_CALENDAR_FIXED_RECT = { x: 256, y: 220, w: 107, h: 42 }

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

const BASE_CLASS =
  "pointer-events-auto absolute z-[11] flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[14px] border font-['Pretendard',sans-serif] text-[18px] font-semibold leading-none"

type PraiseCalendarButtonProps = {
  /** 위치·크기 — 과제 맵에서는 뷰포트 고정(`figmaRectStyle`) */
  style: CSSProperties
  surface?: 'default' | 'dimmed'
  /** 없으면 비인터랙티브 미리보기로 렌더 */
  onClick?: () => void
}

/** 시안과 같은 다섯 꼭지 별 */
function PraiseStarIcon({ fill }: { fill: string }) {
  return (
    <svg aria-hidden className="size-5 shrink-0" viewBox="0 0 20 20" fill="none">
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
  const mergedStyle = { ...SURFACE_STYLE[surface], ...style }

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
