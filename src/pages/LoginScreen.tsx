import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createDevUser,
  getPostAuthPath,
  getStoredAuth,
  isDevLoginAllowed,
  saveAuth,
  type SocialProvider,
} from '../lib/auth'
import { onceAuthBrowserClosed } from '../lib/sync/native-auth'
import { startSocialLogin } from '../lib/sync/social-auth'
import {
  isAppReviewDemoAllowed,
  performAppReviewDemoLogin,
  verifyAppReviewDemoPassword,
} from '../lib/app-review-demo'

const LOGIN_ASSET = '/assets/login-screen.svg?v=6'

/** Figma Export: 학습 로그인 (`플래시화면.svg` 1.16MB) — Apple / 카카오 / 구글 */
export function LoginScreen() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<SocialProvider | null>(null)
  const [demoPending, setDemoPending] = useState(false)
  const [demoPasswordOpen, setDemoPasswordOpen] = useState(false)
  const [demoPassword, setDemoPassword] = useState('')

  /*
    **진짜 OAuth로 나간다.** 예전에는 여기서 가짜 사용자를 만들고 끝이었다 —
    계정이 없으니 기기를 바꾸면 그 학생의 기록을 되찾을 방법이 없었다.

    웹이면 브라우저가 provider로 이동하므로 이 아래는 실행되지 않는다.
    앱이면 로그인 창(시스템 브라우저)이 위에 뜬 채로 돌아오므로, **그 창이 닫힐 때
    버튼을 되살려야 한다** — 안 그러면 학생이 창을 닫고 돌아왔을 때 버튼이 굳어 있다.
  */
  const handleSocialLogin = async (provider: SocialProvider) => {
    if (pending) return
    setError(null)
    setPending(provider)
    const result = await startSocialLogin(provider)
    if (!result.ok) {
      setError(result.message)
      setPending(null)
      return
    }
    if (result.native) {
      void onceAuthBrowserClosed(() => setPending(null))
    }
  }

  /** 개발용 임시 입구 — provider 등록 전까지 과제 흐름을 확인하려면 필요하다 */
  const handleDevLogin = () => {
    const user = createDevUser()
    saveAuth(user)
    navigate(getPostAuthPath(user), { replace: true })
  }

  const openAppReviewDemoPassword = () => {
    if (pending || demoPending) return
    setError(null)
    setDemoPassword('')
    setDemoPasswordOpen(true)
  }

  /** App Store 심사용 — 비밀번호 확인 후 소셜·온보딩·초대코드 없이 데모 반까지 자동 진입 */
  const handleAppReviewDemoLogin = async () => {
    if (pending || demoPending) return
    setError(null)

    if (!verifyAppReviewDemoPassword(demoPassword)) {
      setError('비밀번호가 맞지 않아요.')
      return
    }

    setDemoPasswordOpen(false)
    setDemoPending(true)
    const result = await performAppReviewDemoLogin()
    if (!result.ok) {
      setError(result.message)
      setDemoPending(false)
      return
    }
    navigate(getPostAuthPath(result.user), { replace: true })
  }

  // 이미 로그인돼 있으면 로그인 화면에 머물 이유가 없다.
  // 렌더 중에 navigate하면 React가 경고하므로 effect에서 보낸다.
  useEffect(() => {
    const stored = getStoredAuth()
    if (stored) navigate(getPostAuthPath(stored), { replace: true })
  }, [navigate])

  return (
    <div
      className="flex min-h-full w-full justify-center bg-white"
      data-node-id="2917:6018"
      data-name="로그인화면"
    >
      <div className="relative aspect-[393/852] w-full max-w-[540px] self-center">
        <img
          src={LOGIN_ASSET}
          alt="학습 로그인"
          className="absolute inset-0 h-full w-full"
          draggable={false}
        />

        {/*
          Figma 에셋 상단에 그려진 가짜 상태바(18:00·신호 등).
          아이폰 시스템 상태바와 겹치므로 덮는다. SVG를 래스터로 다시 굽지 않는다 —
          캐릭터 WebP가 sharp에서 빠져 사라지기 때문이다.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[5.2%] bg-[#FBFEFF]"
        />

        {/* Apple — x=20.58 y=605.58 w=351.84 h=58.84 @ 393×852 */}
        <button
          type="button"
          aria-label="Apple로 시작하기"
          className="absolute left-[5.24%] top-[71.08%] h-[6.91%] w-[89.53%] cursor-pointer bg-transparent"
          onClick={() => void handleSocialLogin('apple')}
        />

        {/* Kakao — x=20.58 y=681.58 w=351.84 h=58.84 */}
        <button
          type="button"
          aria-label="카카오로 시작하기"
          className="absolute left-[5.24%] top-[80%] h-[6.91%] w-[89.53%] cursor-pointer bg-transparent"
          onClick={() => void handleSocialLogin('kakao')}
        />

        {/* Google — x=20 y=757 w=353 h=58 */}
        <button
          type="button"
          aria-label="구글로 시작하기"
          className="absolute left-[5.09%] top-[88.85%] h-[6.81%] w-[89.82%] cursor-pointer bg-transparent"
          onClick={() => void handleSocialLogin('google')}
        />

        {isAppReviewDemoAllowed() ? (
          <button
            type="button"
            aria-label="심사용 데모 로그인"
            onClick={openAppReviewDemoPassword}
            disabled={demoPending}
            className="absolute left-1/2 top-[6.5%] z-30 -translate-x-1/2 cursor-pointer rounded-full border border-[#2AA3FF]/40 bg-white/90 px-4 py-2 font-sans text-[13px] font-bold text-[#155DFC] backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2AA3FF] disabled:cursor-wait disabled:opacity-70"
          >
            {demoPending ? '데모 로그인 중…' : '심사용 데모 로그인'}
          </button>
        ) : isDevLoginAllowed() ? (
          <button
            type="button"
            onClick={handleDevLogin}
            className="absolute left-1/2 top-[6.5%] z-30 -translate-x-1/2 cursor-pointer rounded-full border border-black/20 bg-white/80 px-4 py-2 font-sans text-[13px] font-bold text-[#1E242F] backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2AA3FF]"
          >
            임시 로그인 (개발용)
          </button>
        ) : null}

        {demoPasswordOpen ? (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 px-[6%]"
            role="dialog"
            aria-modal="true"
            aria-label="심사용 데모 비밀번호"
          >
            <form
              className="w-full rounded-[16px] bg-white p-5 shadow-lg"
              onSubmit={(event) => {
                event.preventDefault()
                void handleAppReviewDemoLogin()
              }}
            >
              <p className="mb-3 font-sans text-[16px] font-bold text-[#1E242F]">
                심사용 데모 비밀번호
              </p>
              <label className="sr-only" htmlFor="demo-login-password">
                비밀번호
              </label>
              <input
                id="demo-login-password"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={demoPassword}
                onChange={(event) => setDemoPassword(event.target.value)}
                placeholder="비밀번호 입력"
                className="mb-3 w-full rounded-[10px] border border-[#E5E7EB] px-3 py-3 font-sans text-[15px] text-[#1E242F] outline-none focus:border-[#2AA3FF]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-[10px] border border-[#E5E7EB] py-3 font-sans text-[14px] font-bold text-[#667085]"
                  onClick={() => {
                    setDemoPasswordOpen(false)
                    setDemoPassword('')
                    setError(null)
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={demoPending}
                  className="flex-1 rounded-[10px] bg-[#2AA3FF] py-3 font-sans text-[14px] font-bold text-white disabled:opacity-70"
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="absolute left-[5.24%] top-[64.5%] z-50 w-[89.55%] text-center font-sans text-[14px] font-bold leading-snug text-[#C52B2B]"
          >
            {error}
          </p>
        ) : null}

        {pending || demoPending ? (
          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-0 z-50 flex items-end justify-center pb-[4%]"
          >
            <span className="rounded-full bg-black/35 px-4 py-2 font-sans text-[13px] font-semibold text-white">
              {demoPending ? '데모 계정 준비 중…' : '로그인 창으로 이동 중이에요…'}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
