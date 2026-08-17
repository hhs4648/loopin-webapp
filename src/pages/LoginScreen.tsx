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
import { startSocialLogin } from '../lib/sync/social-auth'

const LOGIN_ASSET = '/assets/login-screen.svg?v=2'

/** Figma Export: Haksup / 로그인화면 — node 2917:6018 */
export function LoginScreen() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<SocialProvider | null>(null)

  /*
    **진짜 OAuth로 나간다.** 예전에는 여기서 가짜 사용자를 만들고 끝이었다 —
    계정이 없으니 기기를 바꾸면 그 학생의 기록을 되찾을 방법이 없었다.
    성공하면 브라우저가 provider로 이동하므로 이 아래는 실행되지 않는다.
  */
  const handleSocialLogin = async (provider: SocialProvider) => {
    if (pending) return
    setError(null)
    setPending(provider)
    const result = await startSocialLogin(provider)
    if (!result.ok) {
      setError(result.message)
      setPending(null)
    }
  }

  /** 개발용 임시 입구 — provider 등록 전까지 과제 흐름을 확인하려면 필요하다 */
  const handleDevLogin = () => {
    const user = createDevUser()
    saveAuth(user)
    navigate(getPostAuthPath(user), { replace: true })
  }

  // 이미 로그인돼 있으면 로그인 화면에 머물 이유가 없다.
  // 렌더 중에 navigate하면 React가 경고하므로 effect에서 보낸다.
  useEffect(() => {
    const stored = getStoredAuth()
    if (stored) navigate(getPostAuthPath(stored), { replace: true })
  }, [navigate])

  return (
    <div
      className="flex min-h-full w-full justify-center bg-[#2aa3ff]"
      data-node-id="2917:6018"
      data-name="로그인화면"
    >
      <div className="relative aspect-[393/852] w-full max-w-[540px] self-center">
        <img
          src={LOGIN_ASSET}
          alt="Loopin 로그인"
          className="absolute inset-0 h-full w-full"
          draggable={false}
        />

        {/* Apple — Figma rect x=20.58 y=679.58 w=351.84 h=58.84 @ 393×852 */}
        <button
          type="button"
          aria-label="Apple로 시작하기"
          className="absolute left-[5.24%] top-[79.76%] h-[6.9%] w-[89.55%] cursor-pointer bg-transparent"
          onClick={() => void handleSocialLogin('apple')}
        />

        {/* Kakao — Figma rect x=20.58 y=755.58 w=351.84 h=58.84 @ 393×852 */}
        <button
          type="button"
          aria-label="카카오로 시작하기"
          className="absolute left-[5.24%] top-[88.68%] h-[6.9%] w-[89.55%] cursor-pointer bg-transparent"
          onClick={() => void handleSocialLogin('kakao')}
        />

        {isDevLoginAllowed() ? (
          <button
            type="button"
            onClick={handleDevLogin}
            className="absolute left-1/2 top-[3%] z-30 -translate-x-1/2 cursor-pointer rounded-full border border-white/50 bg-black/25 px-4 py-2 font-sans text-[13px] font-bold text-white backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            임시 로그인 (개발용)
          </button>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="absolute left-[5.24%] top-[74.5%] w-[89.55%] text-center font-sans text-[14px] font-bold leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
          >
            {error}
          </p>
        ) : null}

        {pending ? (
          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[4%]"
          >
            <span className="rounded-full bg-black/35 px-4 py-2 font-sans text-[13px] font-semibold text-white">
              로그인 창으로 이동 중이에요…
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
