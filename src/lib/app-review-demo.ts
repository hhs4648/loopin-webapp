import {
  completeMemberType,
  completeOnboarding,
  createUserFromSession,
  type AuthUser,
} from './auth'
import {
  enrollWithInviteCode,
  ensureStudentSession,
  upsertStudentProfile,
} from './sync/student-api'
import { isSyncEnabled } from './sync/supabase-client'

/** App Store 심사용 데모 입구 — `VITE_APP_REVIEW_DEMO=true`일 때만 빌드에 포함 */
export function isAppReviewDemoAllowed(): boolean {
  return import.meta.env.VITE_APP_REVIEW_DEMO === 'true'
}

export type AppReviewDemoLoginResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string }

const DEMO_DISPLAY_NAME = '심사'
const DEMO_GRADE = 'middle'
const DEMO_BIRTHDATE = '2012-06-15'

/** 심사용 데모 비밀번호 — 미설정 시 `1234` */
export function getAppReviewDemoPassword(): string {
  const fromEnv = import.meta.env.VITE_DEMO_LOGIN_PASSWORD?.trim()
  return fromEnv || '1234'
}

export function verifyAppReviewDemoPassword(input: string): boolean {
  return input.trim() === getAppReviewDemoPassword()
}

/**
 * 심사관이 소셜 로그인 없이 앱 핵심 흐름(온보딩·반 가입·과제 맵)까지 들어갈 수 있게 한다.
 *
 * - 비밀번호 확인은 UI에서 `verifyAppReviewDemoPassword`로 먼저 한다
 * - Supabase 익명 세션 확보
 * - 학생 프로필·온보딩 완료 상태를 로컬·서버에 기록
 * - `VITE_DEMO_INVITE_CODE`로 데모 반 자동 가입
 */
export async function performAppReviewDemoLogin(): Promise<AppReviewDemoLoginResult> {
  if (!isSyncEnabled()) {
    return {
      ok: false,
      message: '서버 연결이 없어요. 잠시 후 다시 시도해 주세요.',
    }
  }

  const inviteCode = import.meta.env.VITE_DEMO_INVITE_CODE?.trim()
  if (!inviteCode) {
    return {
      ok: false,
      message:
        '데모 초대코드가 설정되지 않았어요. VITE_DEMO_INVITE_CODE를 확인해 주세요.',
    }
  }

  const userId = await ensureStudentSession()
  if (!userId) {
    return {
      ok: false,
      message: '로그인 세션을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
    }
  }

  await upsertStudentProfile({
    displayName: DEMO_DISPLAY_NAME,
    grade: DEMO_GRADE,
    birthdate: DEMO_BIRTHDATE,
  })

  const enrollResult = await enrollWithInviteCode(inviteCode)
  if (!enrollResult.ok && enrollResult.code !== 'ALREADY_ENROLLED') {
    return {
      ok: false,
      message: enrollResult.message,
    }
  }

  let user = createUserFromSession(userId, 'apple')
  user = completeMemberType(user, 'student')
  user = completeOnboarding(user, { displayName: DEMO_DISPLAY_NAME })

  return { ok: true, user }
}
