import { getSupabase, isSyncEnabled } from './supabase-client'

/**
 * 오류 신고 보내기.
 *
 * 오류 화면에서 **한 번 누르면** 여기로 온다. 개발자는 Supabase Table Editor의
 * `error_reports`에서 본다(마이그레이션 011).
 *
 * 보내는 건 **고장 난 정황뿐**이다 — 오류 내용, 어느 화면인지, 기기 종류.
 * 학생이 뭘 입력했는지, 무슨 문제를 풀었는지는 담지 않는다.
 */

/** 서버 제약과 같은 값 — 넘치면 잘라서 보낸다 (제약 위반으로 통째로 버려지지 않게) */
const LIMITS = {
  message: 500,
  stack: 4000,
  componentStack: 2000,
  path: 300,
  userAgent: 400,
} as const

function clip(value: string | null | undefined, max: number): string | null {
  if (!value) return null
  return value.length > max ? value.slice(0, max) : value
}

export type ErrorReportResult =
  | { ok: true; code: string }
  | { ok: false; reason: 'offline' | 'disabled' | 'failed'; detail?: string }

/**
 * @returns 성공하면 **신고 번호**(6자리). 학생이 선생님께 말할 수 있게 짧게 준다.
 */
export async function sendErrorReport(input: {
  error: Error
  componentStack?: string | null
  context?: Record<string, unknown>
}): Promise<ErrorReportResult> {
  if (!isSyncEnabled()) return { ok: false, reason: 'disabled' }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, reason: 'offline' }
  }
  const supabase = getSupabase()
  if (!supabase) return { ok: false, reason: 'disabled' }

  /*
    세션이 있으면 누구인지 같이 남긴다. **없다고 포기하지 않는다** — 로그인이
    깨져서 난 오류일수록 알아야 하고, 정책도 익명 신고를 허용한다.
  */
  let studentId: string | null = null
  try {
    const { data } = await supabase.auth.getSession()
    studentId = data.session?.user?.id ?? null
  } catch {
    /* 세션 조회 실패는 신고를 막을 이유가 안 된다 */
  }

  /*
    **신고 번호를 여기서 만든다.**
    예전에는 `.insert().select('id')`로 서버가 돌려준 id를 썼는데, `RETURNING`으로
    돌아오는 행에는 **읽기 권한이 따로 필요하다.** 이 표는 일부러 읽기 정책을 안
    만들었으니(남의 신고를 앱에서 못 긁어 가게) 그 응답이 막혀서, 행은 들어가고도
    화면에는 「보내지 못했어요」가 떴다. id를 미리 정하면 돌려받을 게 없다.
  */
  const id = newReportId()

  const { error } = await supabase
    .from('error_reports')
    .insert({
      id,
      student_id: studentId,
      message: clip(`${input.error.name}: ${input.error.message}`, LIMITS.message),
      path: clip(window.location.pathname, LIMITS.path),
      stack: clip(input.error.stack, LIMITS.stack),
      component_stack: clip(input.componentStack, LIMITS.componentStack),
      user_agent: clip(navigator.userAgent, LIMITS.userAgent),
      context: input.context ?? {},
    })

  if (error) {
    // 개발 중에는 이유가 보여야 한다 — 표가 없는 건지 정책에 막힌 건지 구분된다
    console.warn('[sync] error report failed:', error.message, error)
    return { ok: false, reason: 'failed', detail: error.message }
  }
  // uuid 앞 6자리 — 대시보드에서 `id::text ilike '3f2a1c%'`로 찾으면 된다
  return { ok: true, code: id.slice(0, 6).toUpperCase() }
}

function newReportId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // 아주 오래된 웹뷰용 대비 — 형식만 맞으면 된다
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
