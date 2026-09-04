import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { isNativeApp } from '../lib/native'
import {
  closeAuthBrowser,
  completeDeepLinkAuth,
  listenAuthDeepLink,
  takeAuthLaunchUrl,
} from '../lib/sync/native-auth'

/**
 * **앱에서 소셜 로그인을 마치고 돌아오는 자리.**
 *
 * 웹은 브라우저가 `/auth/callback`으로 되돌아오지만, 앱은 그럴 주소가 없다.
 * 대신 `haksup://auth/callback?code=…`로 앱이 다시 열리고, 그 딥링크가 여기로 온다.
 * 코드를 세션으로 바꾼 뒤에는 **웹과 같은 길**(`/auth/callback` 화면)로 보낸다 —
 * 프로필 확인·온보딩 분기를 두 벌로 만들지 않으려고 이렇게 나눴다.
 *
 * 화면을 그리지 않는다. 라우터 안에 있어야 `useNavigate`를 쓸 수 있어서 컴포넌트다.
 */
export function NativeAuthDeepLink() {
  const navigate = useNavigate()
  // 같은 링크가 시작 주소와 이벤트로 두 번 올 수 있다 — 코드는 한 번만 쓸 수 있다
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isNativeApp()) return

    const handle = async (url: string) => {
      if (handledRef.current === url) return
      handledRef.current = url

      // 로그인 창을 먼저 치운다 — 뒤에서 화면이 바뀌는 걸 학생이 봐야 한다
      await closeAuthBrowser()

      const result = await completeDeepLinkAuth(url)
      if (result.ok) {
        navigate('/auth/callback', { replace: true })
        return
      }
      console.warn('[auth] deep link login failed', result.message)
      navigate(`/auth/callback?error=${encodeURIComponent(result.message)}`, {
        replace: true,
      })
    }

    let stop: (() => void) | undefined
    let stopped = false

    void (async () => {
      const unlisten = await listenAuthDeepLink((url) => void handle(url))
      if (stopped) {
        unlisten()
        return
      }
      stop = unlisten

      // 로그인 도중 앱이 내려갔다 다시 켜진 경우 — 리스너보다 링크가 먼저 와 있다
      const launchUrl = await takeAuthLaunchUrl()
      if (launchUrl) void handle(launchUrl)
    })()

    return () => {
      stopped = true
      stop?.()
    }
  }, [navigate])

  return null
}
