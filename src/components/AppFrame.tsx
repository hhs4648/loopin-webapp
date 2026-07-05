import type { ReactNode } from 'react'

interface AppFrameProps {
  children: ReactNode
}

export function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="app-shell">
      <div className="app-frame">{children}</div>
    </div>
  )
}
