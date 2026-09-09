import {
  completeMemberType,
  completeOnboarding,
  createUserFromSession,
  type AuthUser,
} from './auth'
import {
  buildAssignmentSections,
  listSectionQuestionIds,
} from '../features/assignments/build-session-sections'
import {
  completeAttempt,
  enrollWithInviteCode,
  ensureStudentSession,
  fetchStudentAssignments,
  recordAnswer,
  resolveActiveClassId,
  startOrResumeAttempt,
  upsertStudentProfile,
} from './sync/student-api'
import { isSyncEnabled } from './sync/supabase-client'

/**
 * App Store 심사용 데모 입구.
 * 로컬 `npm run dev`에서도 켜서 비밀번호·온보딩 스킵 흐름을 그대로 확인한다.
 * 스토어 빌드는 `VITE_APP_REVIEW_DEMO=true`일 때만 들어간다.
 */
export function isAppReviewDemoAllowed(): boolean {
  return (
    import.meta.env.DEV || import.meta.env.VITE_APP_REVIEW_DEMO === 'true'
  )
}

export type AppReviewDemoLoginResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string }

const DEMO_DISPLAY_NAME = '심사'
/** 설정·온보딩과 동일 형식 (`중학교 n학년`) — 예전 `'middle'`은 설정에 영문으로 노출됨 */
const DEMO_GRADE = '중학교 2학년'
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
 * - 반의 **첫 숙제**를 약 70% 정답으로 한 번 풀어 둔다 (복습·헬스장 오답용)
 */
export async function performAppReviewDemoLogin(): Promise<AppReviewDemoLoginResult> {
  if (!isSyncEnabled()) {
    return {
      ok: false,
      message: '서버 연결이 없어요. 잠시 후 다시 시도해 주세요.',
    }
  }

  const inviteCode =
    import.meta.env.VITE_DEMO_INVITE_CODE?.trim() || 'AB6NKL'

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

  try {
    await seedAppReviewFirstAssignmentProgress()
  } catch (error) {
    console.warn('[demo] first-assignment seed failed', error)
  }

  return { ok: true, user }
}

/**
 * 데모 반에서 성 맵의 **첫 숙제**(개인 오답 재출제 제외)를 약 70%로 완료한다.
 * 이미 완료한 숙제가 있으면 건드리지 않는다.
 * 틀린 문항이 복습 탭에 쌓이고, 교사가 「오답만 다시 출제」하면 헬스장에도 간다.
 */
export async function seedAppReviewFirstAssignmentProgress(): Promise<void> {
  const classId = await resolveActiveClassId()
  if (!classId) return

  const assignments = await fetchStudentAssignments(classId)
  const first = assignments.find((item) => !item.targetStudentId)
  if (!first || first.questionTotal < 1) return
  if (first.status === 'completed') return

  const questionIds = listSectionQuestionIds(
    buildAssignmentSections(first.contentSnapshot),
  )
  if (questionIds.length === 0) return

  const attempt = await startOrResumeAttempt({
    assignmentId: first.assignmentId,
    questionTotal: questionIds.length,
  })
  if (!attempt) return

  const wrongIds = pickDemoWrongIds(questionIds, 0.3)
  let combo = 0
  let maxCombo = 0
  for (const questionId of questionIds) {
    const isCorrect = !wrongIds.has(questionId)
    combo = isCorrect ? combo + 1 : 0
    if (combo > maxCombo) maxCombo = combo
    await recordAnswer({
      attemptId: attempt.id,
      questionId,
      clientAnswerId: `${attempt.id}:${questionId}`,
      payload: { kind: 'app-review-demo', questionId },
      isCorrect,
    })
  }
  await completeAttempt(attempt.id, maxCombo)
}

/** 문항을 고르게 틀려 유형이 한쪽에만 몰리지 않게 한다. 목표는 오답 비율 `wrongRatio`. */
function pickDemoWrongIds(questionIds: string[], wrongRatio: number): Set<string> {
  const wrongCount = Math.max(1, Math.round(questionIds.length * wrongRatio))
  const step = Math.max(1, Math.floor(questionIds.length / wrongCount))
  const wrong = new Set<string>()
  for (let index = 0; index < questionIds.length && wrong.size < wrongCount; index += step) {
    wrong.add(questionIds[index]!)
  }
  for (const questionId of questionIds) {
    if (wrong.size >= wrongCount) break
    wrong.add(questionId)
  }
  return wrong
}
