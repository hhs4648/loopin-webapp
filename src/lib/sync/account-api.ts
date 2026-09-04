import { clearAllLocalData } from '../local-data'
import { getSupabase, isSyncEnabled } from './supabase-client'

export type DeleteAccountResult = { ok: true } | { ok: false; message: string }

/**
 * **회원탈퇴 — 계정과 학습 기록을 서버에서 지운다.**
 *
 * 지우는 주체는 DB의 `delete_own_account()`(`014_delete_own_account.sql`)다.
 * 클라이언트는 anon 키뿐이라 `auth.users`를 직접 지울 수 없다 — 그래서 자기 자신만
 * 지울 수 있는 `security definer` 함수를 하나 두고 그걸 부른다.
 * `auth.users`가 지워지면 `profiles`부터 `enrollments`·`attempts`·`answers`까지
 * FK `on delete cascade`로 함께 사라진다.
 *
 * **순서가 중요하다.** 서버가 먼저다. 로컬을 먼저 지우면 서버 삭제가 실패했을 때
 * 계정은 살아 있는데 기기에서는 로그아웃돼, 학생이 되돌릴 방법이 없다.
 */
export async function deleteOwnAccount(): Promise<DeleteAccountResult> {
  if (!isSyncEnabled()) {
    // 서버 연결 자체가 없는 빌드 — 지울 서버 기록도 없다
    clearAllLocalData()
    return { ok: true }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: '서버 연결이 없어요. 잠시 후 다시 시도해 주세요.' }
  }

  /*
    **여기서 `ensureStudentSession()`을 부르면 안 된다.** 그건 세션이 없으면 익명
    사용자를 새로 만든다 — 탈퇴하러 왔는데 계정이 하나 더 생기는 꼴이다.
  */
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    clearAllLocalData()
    return { ok: true }
  }

  const { error } = await supabase.rpc('delete_own_account')
  if (error) {
    console.warn('[account] delete failed', error.message, error.code)
    if (isMissingFunction(error)) {
      return {
        ok: false,
        message: '탈퇴 기능이 아직 서버에 준비되지 않았어요. 문의해 주세요.',
      }
    }
    return { ok: false, message: '탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.' }
  }

  /*
    계정이 이미 사라졌으므로 로그아웃 요청은 401로 떨어질 수 있다. 그건 실패가 아니다 —
    토큰만 지우면 되니 결과를 보지 않는다.
  */
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // 위 주석대로 무시한다
  }

  clearAllLocalData()
  return { ok: true }
}

/** 마이그레이션이 아직 안 올라간 프로젝트 — 함수가 없다 */
function isMissingFunction(error: { code?: string; message?: string }): boolean {
  if (error.code === 'PGRST202') return true
  const message = error.message?.toLowerCase() ?? ''
  return (
    message.includes('could not find the function') ||
    message.includes('does not exist')
  )
}
