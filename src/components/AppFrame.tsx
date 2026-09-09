import type { ReactNode } from 'react'

interface AppFrameProps {
  children: ReactNode
}

export function AppFrame({ children }: AppFrameProps) {
  /*
    프레임 안에 시계·신호·배터리를 그리지 않는다.
    실기기(iOS/Android)는 OS 상태바가 이미 있고, 브라우저 미리보기에도
    가짜 상태바를 올리면 설정·제목이 잘린다.
  */
  return (
    <div className="app-shell">
      <div className="app-frame">{children}</div>
    </div>
  )
}
