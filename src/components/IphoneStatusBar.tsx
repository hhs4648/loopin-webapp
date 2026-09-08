import { useEffect, useState } from 'react'

/** 프레임 상단 상태바 높이 — Figma 393×852 기준 */
export const APP_STATUS_BAR_H = 53
export const APP_FRAME_H = 852

function formatStatusTime(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(date)
}

/**
 * 브라우저 미리보기용 상단 시계·신호·와이파이·배터리.
 *
 * 실기기에서는 OS 상태바를 쓰고 `AppFrame`이 이 컴포넌트를 올리지 않는다
 * (흰 덮개가 연속학습 제목 등을 자르던 회귀 방지).
 */
export function IphoneStatusBar() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, 15_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex h-full w-full shrink-0 flex-col items-start bg-white pt-[39.6%]">
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center justify-center pl-4 pr-1.5">
          <span className="text-center text-[17px] font-semibold leading-[22px] text-black tabular-nums">
            {formatStatusTime(now)}
          </span>
        </div>
        <div className="h-[10px] w-[178px] shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-[7px] pl-1.5 pr-4">
          <img
            src="/assets/status-cellular.svg"
            alt=""
            className="h-[12.226px] w-[19.2px]"
            aria-hidden
          />
          <img
            src="/assets/status-wifi.svg"
            alt=""
            className="h-[12.328px] w-[17.142px]"
            aria-hidden
          />
          <img
            src="/assets/status-battery.svg"
            alt=""
            className="h-[13px] w-[27.328px]"
            aria-hidden
          />
        </div>
      </div>
    </div>
  )
}
