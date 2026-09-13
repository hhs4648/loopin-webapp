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
  /** 세로가 남을 때 위쪽 밴드 배경 (하늘·흰 등) */
  topBleedClassName?: string
  /** 세로가 남을 때 아래 밴드 배경 — 내비 연장 색 */
  bottomBleedClassName?: string
}

type StageBox = {
  stageW: number
  stageH: number
  top: number
  bottom: number
}

/**
 * 시안 393×852 **비율을 유지한 채** 화면을 채운다.
 *
 * 예전에 `height:100%` + `object-fill`로 세로만 늘리면 입력칸·버튼·캐릭터가
 * 위아래로 찌그러지고, 내비만 상대적으로 작아 보였다. 이제는
 * - 가로는 프레임에 맞추고
 * - 세로는 비율대로 잡고
 * - 남는 세로는 위·아래 밴드에 나눠 내비·하늘이 같이 커지게 한다.
 *
 * 글꼴 px는 그대로 두고, 레이아웃 박스만 맞춘다.
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
    top: 0,
    bottom: 0,
  })

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return

    const measure = () => {
      const fw = el.clientWidth
      const fh = el.clientHeight
      if (fw <= 0 || fh <= 0) return

      const scaleByWidth = fw / PHONE_FRAME_W
      const naturalH = PHONE_FRAME_H * scaleByWidth

      if (naturalH <= fh + 0.5) {
        const extra = Math.max(0, fh - naturalH)
        /*
          남는 높이의 대부분을 하단(내비 연장)에, 일부는 상단(상태바·하늘)에.
          내비만 작고 가운데만 커 보이던 느낌을 맞춘다.
        */
        const top = Math.round(extra * 0.28)
        const bottom = extra - top
        setBox({ stageW: fw, stageH: naturalH, top, bottom })
        return
      }

      const scale = fh / PHONE_FRAME_H
      setBox({
        stageW: PHONE_FRAME_W * scale,
        stageH: fh,
        top: 0,
        bottom: 0,
      })
    }

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  const cssVars = {
    '--phone-stage-w': `${box.stageW}px`,
    '--phone-stage-h': `${box.stageH}px`,
    '--phone-bleed-top': `${box.top}px`,
    '--phone-bleed-bottom': `${box.bottom}px`,
  } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={`app-phone-canvas ${className}`.trim()}
      style={{ ...cssVars, ...style }}
    >
      <div
        className={`app-phone-top-bleed ${topBleedClassName}`.trim()}
        style={{ height: box.top }}
        aria-hidden
      />
      <div
        className="app-phone-stage"
        style={{
          width: box.stageW || '100%',
          height: box.stageH || '100%',
        }}
      >
        {children}
      </div>
      <div
        className={`app-phone-bottom-bleed ${bottomBleedClassName}`.trim()}
        style={{ height: box.bottom }}
        aria-hidden
      />
    </div>
  )
}
