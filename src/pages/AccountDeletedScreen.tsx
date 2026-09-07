import { useNavigate } from 'react-router-dom'
import { SplashBrandFrame } from '../components/SplashBrandFrame'

/**
 * 회원탈퇴가 끝난 뒤 도착하는 화면.
 *
 * 탈퇴 직후 `/`로 보내면, 예전에 쓰다 남은 `haksup://auth/callback?code=…` 딥링크가
 * 다시 교환을 시도하다 PKCE 오류 「로그인 실패」화면으로 떨어졌다. 그래서 탈퇴
 * 전용 경로로 보내고, 여기서 로그인으로만 안내한다.
 */
export function AccountDeletedScreen() {
  const navigate = useNavigate()

  return (
    <SplashBrandFrame>
      <div className="absolute inset-x-8 bottom-[10%] z-10 flex flex-col items-center gap-4 text-center">
        <p className="font-sans text-[17px] font-extrabold leading-relaxed tracking-[-0.02em] text-[#0B1220]">
          탈퇴가 완료되었어요
        </p>
        <p className="font-sans text-[14px] font-medium leading-relaxed text-[#5A6472]">
          계정과 학습 기록이 모두 삭제되었어요.
          <br />
          다시 이용하려면 로그인해 주세요.
        </p>
        <button
          type="button"
          className="mt-1 min-h-[52px] w-full max-w-[280px] rounded-[16px] bg-[#2AA3FF] font-sans text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(42,163,255,0.35)]"
          onClick={() => navigate('/login', { replace: true })}
        >
          로그인 화면으로
        </button>
      </div>
    </SplashBrandFrame>
  )
}
