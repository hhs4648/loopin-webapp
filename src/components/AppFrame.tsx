import type { ReactNode } from 'react'
import { isNativeApp } from '../lib/native'
import {
  APP_FRAME_H,
  APP_STATUS_BAR_H,
  IphoneStatusBar,
} from './IphoneStatusBar'

interface AppFrameProps {
  children: ReactNode
}

export function AppFrame({ children }: AppFrameProps) {
  /*
    실기기(iOS/Android)는 OS 상태바가 이미 있다. 여기에 또 흰 상태바를 올리면
    연속학습 제목처럼 상단 글자가 잘리고, 시계가 두 겹이 된다.
    브라우저 미리보기만 인앱 상태바를 그린다.
  */
  const showInAppStatusBar = !isNativeApp()

  return (
    <div className="app-shell">
      <div className="app-frame">
        {children}
        {showInAppStatusBar ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[200]"
            style={{ height: `${(APP_STATUS_BAR_H / APP_FRAME_H) * 100}%` }}
            aria-hidden
          >
            <IphoneStatusBar />
          </div>
        ) : null}
      </div>
    </div>
  )
}
