import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SplashBrandFrame } from '../components/SplashBrandFrame'
import {
  createUserFromSession,
  getPostAuthPath,
  getStoredAuth,
  mergeServerProfile,
  saveAuth,
} from '../lib/auth'
import { fetchOwnProfile, getSignedInUser } from '../lib/sync/social-auth'

/**
 * 소셜 로그인에서 돌아오는 자리(`/auth/callback`).
 *
 * Supabase 클라이언트가 URL의 `?code=`를 세션으로 바꾸는 동안 잠깐 머문다.
 * 세션이 잡히면 **서버 프로필을 먼저 읽어서** 이 사람이 온보딩을 마친 사람인지
 * 확인한 뒤 보낸다 — 이게 없으면 기기를 바꿀 때마다 이름부터 다시 넣어야 한다.
 */
export function AuthCallbackScreen() {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  // 어디서 멈췄는지 화면에 남긴다 — 「로그인 중이에요」만 떠 있으면 원인을 알 길이 없다
  const [stage, setStage] = useState('시작')
  // StrictMode에서 두 번 도는 것을 막는다 — 로그인 처리는 한 번이면 된다
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    let cancelled = false

    void (async () => {
      /*
        `detectSessionInUrl`이 코드를 교환하는 데 한 틱 이상 걸린다.
        바로 읽으면 아직 세션이 없어서 로그인 화면으로 되튕긴다 — 잠깐씩 다시 본다.
      */
      const isLinked = (user: Awaited<ReturnType<typeof getSignedInUser>>) =>
        user != null && user.provider != null

      /*
        **`getSession()`은 멈출 수 있다.** supabase-js는 `navigator.locks`로 토큰
        접근을 직렬화하는데, 다른 탭이 락을 쥔 채로 있으면 이 await가 영영 안 끝난다.
        그러면 catch도 안 걸리고 화면은 「로그인 중이에요」에 갇힌다.
        그래서 매 호출에 시간 제한을 둔다 — 늦으면 없는 셈 치고 다시 물어본다.
      */
      const signedInOrNull = async () => {
        try {
          return await Promise.race([
            getSignedInUser(),
            new Promise<null>((resolve) =>
              window.setTimeout(() => resolve(null), 800),
            ),
          ])
        } catch {
          return null
        }
      }

      setStage('세션 확인 중')
      let signedIn = await signedInOrNull()
      for (let tries = 0; !isLinked(signedIn) && tries < 20; tries += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 150))
        if (cancelled) return
        setStage(`세션 확인 중 (${tries + 1}/20)`)
        signedIn = await signedInOrNull()
      }

      if (cancelled) return
      /*
        **소셜 신원이 붙어야 로그인이다.** 익명 세션은 이 앱을 열기만 해도 생기므로,
        그걸 로그인으로 치면 실패했을 때도 통과해 버린다.
      */
      if (!isLinked(signedIn) || !signedIn) {
        // 익명 세션만 있는지, 아예 세션이 없는지 구분해 둔다 — 원인이 완전히 다르다
        setErrorDetail(
          signedIn
            ? '소셜 계정이 연결되지 않았어요 (익명 세션만 있음)'
            : '세션을 만들지 못했어요',
        )
        setFailed(true)
        return
      }

      // 로그인 직전 상태(회원 유형 등)를 잃지 않게 기존 값 위에 얹는다
      const base =
        getStoredAuth() ??
        createUserFromSession(signedIn.id, signedIn.provider!)
      const withId = {
        ...base,
        id: signedIn.id,
        ...(signedIn.provider ? { provider: signedIn.provider } : {}),
      }
      saveAuth(withId)

      /*
        프로필 조회가 늦어도 로그인은 이미 끝난 상태다. 여기서 무한정 기다리면
        「로그인 중이에요」에 갇힌다 — 못 읽으면 없는 셈 치고 온보딩으로 보낸다.
      */
      setStage('프로필 확인 중')
      const profile = await Promise.race([
        fetchOwnProfile(signedIn.id),
        new Promise<null>((resolve) =>
          window.setTimeout(() => resolve(null), 4000),
        ),
      ])
      if (cancelled) return
      const merged = mergeServerProfile(
        withId,
        profile
          ? { role: profile.role, displayName: profile.displayName }
          : null,
      )
      navigate(getPostAuthPath(merged), { replace: true })
    })().catch((error) => {
      /*
        **여기가 없으면 화면이 영원히 「로그인 중이에요」에 머문다.**
        중간에 던지면 unhandled rejection으로 끝나고 아무 UI도 안 바뀐다 —
        실제로 구글 로그인 첫 시도에서 그렇게 갇혔다 (2026-08-27).
      */
      console.error('[auth/callback] 로그인 처리 실패', error)
      if (!cancelled) {
        setErrorDetail(error instanceof Error ? error.message : String(error))
        setFailed(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <SplashBrandFrame>
      {failed ? (
        <div className="absolute inset-x-8 bottom-[10%] z-10 flex flex-col items-center gap-4 text-center">
          <p className="font-sans text-[15px] font-semibold leading-relaxed text-[#1E242F]">
            로그인을 마치지 못했어요.
            <br />
            다시 시도해 주세요.
          </p>
          <p className="font-sans text-[12px] leading-relaxed text-[#8A94A6]">
            {errorDetail ?? '알 수 없는 오류'} · 단계: {stage}
          </p>
          <button
            type="button"
            className="rounded-xl bg-[#2AA3FF] px-6 py-3 font-sans text-[15px] font-bold text-white"
            onClick={() => navigate('/login', { replace: true })}
          >
            로그인으로 돌아가기
          </button>
        </div>
      ) : (
        <p className="absolute inset-x-8 bottom-[12%] z-10 text-center font-sans text-[15px] font-semibold text-[#5A6472]">
          로그인 중이에요…
          <br />
          <span className="text-[12px] font-medium text-[#8A94A6]">{stage}</span>
        </p>
      )}
    </SplashBrandFrame>
  )
}
