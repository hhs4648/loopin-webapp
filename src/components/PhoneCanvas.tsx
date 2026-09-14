import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

/** 시안 프레임 — 좌표 % · object-fill 기준 */
export const PHONE_FRAME_W = 393
export const PHONE_FRAME_H = 852

type PhoneCanvasProps = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
  /**
   * 예전 레터박스 밴드용. cover 방식에서는 화면이 이미 꽉 차서 쓰지 않지만,
   * 호출부 호환을 위해 남겨 둔다(배경 fallback).
   */
  topBleedClassName?: string
  bottomBleedClassName?: string
}

type StageBox = {
  stageW: number
  stageH: number
  left: number
  top: number
  overflowBottom: number
}

/**
 * 시안 393×852를 **cover**로 기기에 맞춘다.
 *
 * - 가로·세로 모두 화면을 덮는다 (좌우 흰 여백 없음)
 * - 비율 유지 — 웹뷰 크기를 줄여 상태바 자리를 비우지 않는다
 * - **상단 정렬**: 화면 맨 위(상태바 아래 겹침 영역)까지 시안 상단을 채운다
 * - OS 시계·배터리는 네이티브 상태바가 맨 앞에 그린다 (`system-bars.ts`)
 * - 짧아서 세로가 넘치면 아래를 자르고, 내비는 `--phone-overflow-bottom`으로
 *   뷰포트 하단에 붙인다
 */
export function PhoneCanvas({
  children,
  className = '',
  style,
  topBleedClassName = 'bg-white',
  bottomBleedClassName = 'bg-[#F4F6FA]',
}: PhoneCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<StageBox>({
    stageW: 0,
    stageH: 0,
    left: 0,
    top: 0,
    overflowBottom: 0,
  })

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return

    const measure = () => {
      const fw = el.clientWidth
      const fh = el.clientHeight
      if (fw <= 0 || fh <= 0) return

      const scale = Math.max(fw / PHONE_FRAME_W, fh / PHONE_FRAME_H)
      const stageW = PHONE_FRAME_W * scale
      const stageH = PHONE_FRAME_H * scale
      const left = (fw - stageW) / 2
      /* 위를 맞춘다 — 상태바 뒤로 콘텐츠가 들어가고, OS 아이콘이 앞에 남는다 */
      const top = 0
      const overflowBottom = Math.max(0, stageH - fh)
      setBox({ stageW, stageH, left, top, overflowBottom })
    }

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  const cssVars = {
    '--phone-stage-w': `${box.stageW}px`,
    '--phone-stage-h': `${box.stageH}px`,
    '--phone-bleed-top': '0px',
    '--phone-bleed-bottom': '0px',
    /* 스테이지가 아래로 넘친 만큼 — 내비 bottom 보상에 쓴다 */
    '--phone-overflow-bottom': `${box.overflowBottom}px`,
  } as CSSProperties

  const fallbackBg =
    [topBleedClassName, bottomBleedClassName].find((c) => c.includes('bg-')) ??
    'bg-white'

  return (
    <div
      ref={rootRef}
      className={`app-phone-canvas ${fallbackBg} ${className}`.trim()}
      style={{ ...cssVars, ...style }}
    >
      <div
        className="app-phone-stage"
        style={{
          width: box.stageW || '100%',
          height: box.stageH || '100%',
          left: box.stageW ? box.left : 0,
          top: box.stageH ? box.top : 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}
