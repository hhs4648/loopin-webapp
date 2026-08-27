import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react'

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return
  if (typeof ref === 'function') ref(value)
  else (ref as { current: T | null }).current = value
}

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
   * 넘치면 글씨를 줄여 맞추고, 그래도 안 되면 그때만 스크롤.
   */
  maxBottom?: number
  className?: string
  contentClassName?: string
  /** 문항이 바뀌면 다시 잰다 */
  contentKey?: string | number
  children: ReactNode
  /** 시안 높이 대비 늘어난 양(design px) — 선택지·아래 UI를 밀 때 사용 */
  onGrowthChange?: (growthDesignPx: number) => void
  /** 드롭 영역 등 — 박스 DOM을 밖에서 써야 할 때 */
  containerRef?: Ref<HTMLDivElement>
}

/**
 * Figma 문제/지문 박스. 짧은 문장은 시안 크기, 긴 문장은 박스가 커져 전부 보인다.
 * 상한에 닿으면 글씨를 줄여 잘리지 않게 한다.
 * 시안 박스보다 내용이 짧으면 **위아래 가운데**(문구 포함).
 */
export function ExpandablePassageBox({
  rect,
  maxBottom = PASSAGE_SAFE_BOTTOM,
  className,
  contentClassName,
  contentKey,
  children,
  onGrowthChange,
  containerRef,
}: ExpandablePassageBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const lastGrowthRef = useRef(0)

  const setBoxRef = (el: HTMLDivElement | null) => {
    boxRef.current = el
    assignRef(containerRef, el)
  }

  const maxHeightPct =
    maxBottom > rect.y
      ? `${((maxBottom - rect.y) / EXPANDABLE_FRAME_H) * 100}%`
      : undefined

  useLayoutEffect(() => {
    const box = boxRef.current
    const inner = innerRef.current
    if (!box) return
    const frame = box.offsetParent as HTMLElement | null
    if (!frame) return

    const fit = () => {
      if (inner) inner.style.fontSize = ''

      const frameH = frame.clientHeight
      if (frameH <= 0) return
      const maxCss =
        maxBottom > rect.y
          ? ((maxBottom - rect.y) / EXPANDABLE_FRAME_H) * frameH
          : Number.POSITIVE_INFINITY

      if (inner && Number.isFinite(maxCss) && box.scrollHeight > maxCss + 0.5) {
        const base = Number.parseFloat(getComputedStyle(inner).fontSize)
        if (Number.isFinite(base) && base > 0) {
          let scale = 1
          for (let i = 0; i < 8; i += 1) {
            if (box.scrollHeight <= maxCss + 0.5) break
            const next = Math.max(0.55, scale * (maxCss / box.scrollHeight))
            if (Math.abs(next - scale) < 0.008) {
              scale = next
              break
            }
            scale = next
            inner.style.fontSize = `${base * scale}px`
          }
        }
      }

      const baseCss = (rect.h / EXPANDABLE_FRAME_H) * frameH
      const growthCss = Math.max(0, box.offsetHeight - baseCss)
      const growthDesign = (growthCss / frameH) * EXPANDABLE_FRAME_H
      if (Math.abs(growthDesign - lastGrowthRef.current) < 0.75) return
      lastGrowthRef.current = growthDesign
      onGrowthChange?.(growthDesign)
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [rect.h, rect.y, maxBottom, contentKey, onGrowthChange, children])

  return (
    <div
      ref={setBoxRef}
      className={`flex flex-col justify-center ${className ?? ''}`}
      style={{
        ...expandablePassageStyle(rect),
        maxHeight: maxHeightPct,
        overflowX: 'hidden',
        overflowY: 'auto',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      }}
    >
      <div
        ref={innerRef}
        className={`flex w-full flex-col justify-center text-[length:clamp(12px,4.07cqw,16px)] [&_button]:text-[length:1em] [&_p]:text-[length:1em] [&_span]:text-[length:1em] ${contentClassName ?? ''}`}
      >
        {children}
      </div>
    </div>
  )
}
