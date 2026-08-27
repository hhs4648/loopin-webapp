import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SplashBrandFrame } from '../components/SplashBrandFrame'
import {
  createUserFromSession,
  getPostAuthPath,
  getStoredAuth,
  mergeServerProfile,
} from '../lib/auth'

const SPLASH_DURATION_MS = 1800

/** Figma: Haksup / 플래시화면 — node 2917:5988 */
export function SplashScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    /*
      **로컬보다 서버 세션이 먼저다.**
      기기를 바꾸거나 앱을 다시 깔면 로컬에는 아무것도 없다. 예전에는 그대로
      로그인 화면으로 보내서, 소셜 계정이 살아 있어도 온보딩부터 다시 했다.
      로그인이 남아 있으면 서버 프로필을 읽어 원래 자리로 돌려보낸다.
    */
    const resolveDestination = async (): Promise<string> => {
      const stored = getStoredAuth()
      /*
        Supabase 클라이언트를 **여기서 불러온다.** 최상단에서 import하면 첫 화면
        묶음에 같이 실려서, 로고 한 장 그리려고 인증 라이브러리까지 내려받게 된다.
        어차피 로고를 1.8초 보여 주는 동안 받아지므로 체감 지연이 없다.
      */
      const { fetchOwnProfile, getSignedInUser } = await import(
        '../lib/sync/social-auth'
      )
      const signedIn = await getSignedInUser()

      // 소셜 계정이 안 붙은 익명 세션은 「로그인된 것」으로 치지 않는다
      if (!signedIn || signedIn.isAnonymous || !signedIn.provider) {
        return stored ? getPostAuthPath(stored) : '/login'
      }

      const base =
        stored?.id === signedIn.id
          ? stored
          : createUserFromSession(signedIn.id, signedIn.provider)
      const profile = await fetchOwnProfile(signedIn.id)
      const merged = mergeServerProfile(
        base,
        profile
          ? { role: profile.role, displayName: profile.displayName }
          : null,
      )
      return getPostAuthPath(merged)
    }

    // 로고를 보여 주는 동안 조회를 같이 돌린다 — 스플래시가 길어지지 않게
    const settled = Promise.all([
      resolveDestination().catch(() => {
        const stored = getStoredAuth()
        return stored ? getPostAuthPath(stored) : '/login'
      }),
      new Promise((resolve) => window.setTimeout(resolve, SPLASH_DURATION_MS)),
    ])

    void settled.then(([destination]) => {
      if (cancelled) return
      navigate(destination, { replace: true })
    })

    return () => {
      cancelled = true
    }
  }, [navigate])

  return <SplashBrandFrame />
}
