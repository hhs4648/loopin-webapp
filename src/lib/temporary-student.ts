import { createTemporaryStudent } from './auth'
import { clearAllLocalData } from './local-data'

/**
 * 선생님 → **임시 학생**으로 들어간다.
 *
 * 선생님이 학생에게 무엇이 보이는지 직접 확인하려면 학생 신원이 하나 있어야 한다.
 * 같은 계정으로는 안 된다 — 초대코드 가입 RPC가 `profiles.role = 'student'`만 받고,
 * 역할을 바꾸면 두 앱이 공유하는 프로필 한 행이 뒤엉킨다(선생님 웹에서 반이 사라진다).
 *
 * 그래서 **세션을 놓고 새로 시작한다.** 선생님 계정은 서버에 그대로 있고, 다시
 * 소셜 로그인하면 프로필의 `role=teacher`를 읽어 선생님 화면으로 돌아온다.
 */
export async function startTemporaryStudent(): Promise<void> {
  const { signOutSocial } = await import('./sync/social-auth')
  try {
    await signOutSocial()
  } catch {
    // 네트워크가 없어도 로컬 토큰만 지우면 다음 조회에서 새 익명 세션이 잡힌다
  }
  // 선생님의 이름·반 캐시가 남으면 학생 화면에 그대로 새어 나온다
  clearAllLocalData()
  createTemporaryStudent()
}
