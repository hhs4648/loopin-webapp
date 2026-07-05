import { useNavigate } from 'react-router-dom'
import {
  clearAuth,
  createMockUser,
  getPostAuthPath,
  saveAuth,
  type SocialProvider,
} from '../lib/auth'

const LOGIN_ASSET = '/assets/login-screen.svg'

/** Figma Export: Haksup / 로그인화면 — node 2917:6018 */
export function LoginScreen() {
  const navigate = useNavigate()

  const handleSocialLogin = (provider: SocialProvider) => {
    // 테스트용: 로그인할 때마다 새 세션으로 온보딩부터 시작
    clearAuth()
    const user = createMockUser(provider)
    saveAuth(user)
    navigate(getPostAuthPath(user))
  }

  return (
    <div
      className="flex min-h-dvh w-full justify-center bg-[#2aa3ff]"
      data-node-id="2917:6018"
      data-name="로그인화면"
    >
      <div className="relative aspect-[393/852] w-full max-w-[393px] self-center">
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
          onClick={() => handleSocialLogin('apple')}
        />

        {/* Kakao — Figma rect x=20.58 y=755.58 w=351.84 h=58.84 @ 393×852 */}
        <button
          type="button"
          aria-label="카카오로 시작하기"
          className="absolute left-[5.24%] top-[88.68%] h-[6.9%] w-[89.55%] cursor-pointer bg-transparent"
          onClick={() => handleSocialLogin('kakao')}
        />
      </div>
    </div>
  )
}
