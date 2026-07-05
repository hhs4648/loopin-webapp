import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IphoneStatusBar } from '../components/IphoneStatusBar'
import { LoopinLogo } from '../components/LoopinLogo'
import { getPostAuthPath, getStoredAuth } from '../lib/auth'

const SPLASH_DURATION_MS = 1800

/** Figma: Haksup / 플래시화면 — node 2917:5988 */
export function SplashScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const user = getStoredAuth()
      navigate(user ? getPostAuthPath(user) : '/login', { replace: true })
    }, SPLASH_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [navigate])

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col bg-[#2aa3ff]"
      data-node-id="2917:5988"
      data-name="플래시화면"
    >
      <IphoneStatusBar />

      <div className="flex flex-1 items-center justify-center">
        <div
          className="relative h-[67.427px] w-[176px] shrink-0"
          data-node-id="4501:2481"
        >
          <LoopinLogo variant="splash" />
        </div>
      </div>
    </div>
  )
}
