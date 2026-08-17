import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'

export type FigmaRect = { x: number; y: number; w: number; h: number }

export const EXPANDABLE_FRAME_W = 393
export const EXPANDABLE_FRAME_H = 852

/** 피드백 시트·하단 CTA 직전에 두는 안전선 (design px) */
export const PASSAGE_SAFE_BOTTOM = 640

export function shiftRect(rect: FigmaRect, dy: number): FigmaRect {
  if (dy === 0) return rect
  return { ...rect, y: rect.y + dy }
}

/** 고정 높이 대신 minHeight — 긴 문제가 박스를 키운다 */
export function expandablePassageStyle(
  rect: FigmaRect,
  frameW = EXPANDABLE_FRAME_W,
  frameH = EXPANDABLE_FRAME_H,
): CSSProperties {
  return {
    left: `${(rect.x / frameW) * 100}%`,
    top: `${(rect.y / frameH) * 100}%`,
    width: `${(rect.w / frameW) * 100}%`,
    minHeight: `${(rect.h / frameH) * 100}%`,
    height: 'auto',
  }
}

type ExpandablePassageBoxProps = {
  rect: FigmaRect
  /**
   * 이 Y(design px)를 넘지 못하게 키운다.
   * 넘치면 박스 안에서 스크롤(최후 수단).
   */
  maxBottom?: number
  className?: string
  contentClassName?: string
  /** 문항이 바뀌면 다시 잰다 */
  contentKey?: string | number
  children: ReactNode
  /** 시안 높이 대비 늘어난 양(design px) — 선택지·아래 UI를 밀 때 사용 */
  onGrowthChange?: (growthDesignPx: number) => void
}

/**
 * Figma 문제/지문 박스. 짧은 문장은 시안 크기, 긴 문장은 박스가 커져 전부 보인다.
 */
export function ExpandablePassageBox({
  rect,
  maxBottom = PASSAGE_SAFE_BOTTOM,
  className,
  contentClassName,
  contentKey,
  children,
  onGrowthChange,
}: ExpandablePassageBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const lastGrowthRef = useRef(0)

  const maxHeightPct =
    maxBottom > rect.y
      ? `${((maxBottom - rect.y) / EXPANDABLE_FRAME_H) * 100}%`
      : undefined

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const frame = box.offsetParent as HTMLElement | null
    if (!frame) return

    const report = () => {
      const frameH = frame.clientHeight
      if (frameH <= 0) return
      const baseCss = (rect.h / EXPANDABLE_FRAME_H) * frameH
      const growthCss = Math.max(0, box.offsetHeight - baseCss)
      const growthDesign = (growthCss / frameH) * EXPANDABLE_FRAME_H
      if (Math.abs(growthDesign - lastGrowthRef.current) < 0.75) return
      lastGrowthRef.current = growthDesign
      onGrowthChange?.(growthDesign)
    }

    const ro = new ResizeObserver(report)
    ro.observe(box)
    report()
    return () => ro.disconnect()
  }, [rect.h, rect.y, maxBottom, contentKey, onGrowthChange, children])

  return (
    <div
      ref={boxRef}
      className={`flex flex-col ${className ?? ''}`}
      style={{
        ...expandablePassageStyle(rect),
        maxHeight: maxHeightPct,
        overflowX: 'hidden',
        overflowY: maxHeightPct ? 'auto' : 'visible',
      }}
    >
      {/*
        시안 minHeight보다 짧은 문장도 박스 세로 가운데에 오도록
        flex-1로 안쪽을 채운 뒤 justify-center.
      */}
      <div
        className={`flex min-h-0 w-full flex-1 flex-col justify-center ${contentClassName ?? ''}`}
      >
        {children}
      </div>
    </div>
  )
}
