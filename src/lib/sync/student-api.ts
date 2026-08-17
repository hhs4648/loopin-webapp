import { getSupabase, isSyncEnabled } from './supabase-client'
import { DEFAULT_PASS_SCORE_THRESHOLD } from '../../components/praise-calendar/praise-calendar'
import { displayAssignmentTitle } from './assignment-title'
import type {
  AnswerEvent,
  AttemptProgress,
  ContentSnapshot,
  Enrollment,
  EnrollResult,
  StudentAssignment,
  StudentProfile,
} from './types'
import {
  buildAssignmentSections,
  countSectionQuestions,
} from '../../features/assignments/build-session-sections'

const ACTIVE_CLASS_KEY = 'loopin_active_class_id'
const PROFILE_CACHE_KEY = 'loopin_student_profile'

function mapEnrollment(row: Record<string, unknown>): Enrollment {
  return {
    id: String(row.id),
    classId: String(row.class_id),
    studentId: String(row.student_id),
    enrolledAt: String(row.enrolled_at),
    className: row.class_name ? String(row.class_name) : undefined,
    classGrade: row.class_grade ? String(row.class_grade) : undefined,
    inviteCode: row.invite_code ? String(row.invite_code) : undefined,
  }
}

function mapAttempt(row: Record<string, unknown>): AttemptProgress {
  return {
    id: String(row.id),
    assignmentId: String(row.assignment_id),
    studentId: String(row.student_id),
    status: row.status === 'completed' ? 'completed' : 'in_progress',
    answeredCount: Number(row.answered_count ?? 0),
    correctCount: Number(row.correct_count ?? 0),
    progressPercent: Number(row.progress_percent ?? 0),
    score: row.score == null ? null : Number(row.score),
    questionTotal: Number(row.question_total ?? 0),
    maxCombo: Number(row.max_combo ?? 0),
    startedAt: String(row.started_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    updatedAt: String(row.updated_at ?? row.started_at),
  }
}

/**
 * 진행 중인 세션 확보 작업. **동시에 여러 번 호출돼도 익명 로그인은 한 번만** 하도록 잡아둔다.
 *
 * 화면 진입 시 여러 effect가 동시에 `ensureStudentSession()`을 부르는데, 이 가드가 없으면
 * 전부 「세션 없음」을 보고 각자 `signInAnonymously()`를 호출한다. 그러면 익명 사용자가
 * 여러 개 만들어지고 마지막 것이 localStorage를 덮어써서, **초대코드로 등록한 사용자와
 * 새로고침 후 복원되는 사용자가 달라진다** → 등록이 사라진 것처럼 보이고 초대코드 화면이 다시 뜬다.
 * (2026-08-06 배포본에서 한 번 로드에 signup이 4번 발생하는 것을 확인)
 */
let sessionInFlight: Promise<string | null> | null = null

export async function ensureStudentSession(): Promise<string | null> {
  if (!isSyncEnabled()) return null
  const supabase = getSupabase()
  if (!supabase) return null

  // 이미 진행 중이면 그 결과를 같이 기다린다 — 두 번째 signInAnonymously를 막는다.
  if (sessionInFlight) return sessionInFlight

  sessionInFlight = (async () => {
    const { data: existing } = await supabase.auth.getSession()
    if (existing.session?.user?.id) return existing.session.user.id

    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) {
      console.warn('[sync] student anonymous sign-in failed', error?.message)
      return null
    }
    return data.user.id
  })()

  try {
    return await sessionInFlight
  } finally {
    // 성공했다면 이후 호출은 getSession()이 즉시 돌려주므로 캐시를 비워도 안전하고,
    // 실패했다면 다음 호출에서 다시 시도해야 하므로 반드시 비워야 한다.
    sessionInFlight = null
  }
}

export async function upsertStudentProfile(input: {
  displayName: string
  grade?: string
  birthdate?: string
}): Promise<StudentProfile | null> {
  if (!isSyncEnabled()) {
    const cached: StudentProfile = {
      id: 'local',
      role: 'student',
      displayName: input.displayName,
      grade: input.grade,
      birthdate: input.birthdate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cached))
    return cached
  }

  const supabase = getSupabase()
  const userId = await ensureStudentSession()
  if (!supabase || !userId) return null

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        role: 'student',
        display_name: input.displayName,
        grade: input.grade ?? null,
        birthdate: input.birthdate ?? null,
        updated_at: now,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single()

  if (error || !data) {
    console.warn('[sync] student profile upsert failed', error?.message)
    return null
  }

  const profile: StudentProfile = {
    id: data.id,
    role: 'student',
    displayName: data.display_name ?? input.displayName,
    grade: data.grade ?? undefined,
    birthdate: data.birthdate ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
  return profile
}

export function getCachedStudentProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StudentProfile
  } catch {
    return null
  }
}

export function setActiveClassId(classId: string): void {
  localStorage.setItem(ACTIVE_CLASS_KEY, classId)
}

export async function enrollWithInviteCode(code: string): Promise<EnrollResult> {
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!isSyncEnabled()) {
    return {
      ok: false,
      code: 'SYNC_DISABLED',
      message: '서버 연결이 없어요. 환경변수를 확인해 주세요.',
    }
  }

  const supabase = getSupabase()
  const userId = await ensureStudentSession()
  if (!supabase || !userId) {
    return {
      ok: false,
      code: 'UNAUTHENTICATED',
      message: '로그인이 필요해요.',
    }
  }

  // Ensure profile exists before enroll RPC
  const cached = getCachedStudentProfile()
  if (cached) {
    await upsertStudentProfile({
      displayName: cached.displayName,
      grade: cached.grade,
      birthdate: cached.birthdate,
    })
  }

  const { data, error } = await supabase.rpc('enroll_with_invite_code', {
    p_code: cleaned,
  })

  if (error) {
    return {
      ok: false,
      code: 'UNKNOWN',
      message: error.message || '가입에 실패했어요.',
    }
  }

  const result = data as {
    ok?: boolean
    code?: string
    message?: string
    enrollment?: Record<string, unknown>
    class?: {
      id: string
      name: string
      grade?: string
      inviteCode: string
    }
  }

  if (!result?.ok) {
    const enrollment = result.enrollment
      ? mapEnrollment({
          id: result.enrollment.id,
          class_id: result.enrollment.class_id,
          student_id: result.enrollment.student_id,
          enrolled_at: result.enrollment.enrolled_at,
        })
      : undefined
    if (result.class?.id) setActiveClassId(result.class.id)
    return {
      ok: false,
      code: (result.code as EnrollResult extends { ok: false } ? EnrollResult['code'] : never) || 'UNKNOWN',
      message: result.message || '가입에 실패했어요.',
      enrollment,
      class: result.class,
    }
  }

  const enrollment = mapEnrollment({
    id: result.enrollment!.id,
    class_id: result.enrollment!.class_id,
    student_id: result.enrollment!.student_id,
    enrolled_at: result.enrollment!.enrolled_at,
  })
  if (result.class?.id) setActiveClassId(result.class.id)

  return {
    ok: true,
    code: 'ENROLLED',
    enrollment,
    class: result.class!,
  }
}

export async function fetchMyEnrollments(): Promise<Enrollment[]> {
  if (!isSyncEnabled()) return []
  const supabase = getSupabase()
  const userId = await ensureStudentSession()
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('enrollments')
    .select('id, class_id, student_id, enrolled_at, classes:class_id(name, grade, invite_code)')
    .eq('student_id', userId)
    .order('enrolled_at', { ascending: false })

  if (error || !data) return []

  return data.map((row) => {
    const cls = row.classes as
      | { name?: string; grade?: string; invite_code?: string }
      | { name?: string; grade?: string; invite_code?: string }[]
      | null
    const c = Array.isArray(cls) ? cls[0] : cls
    return {
      id: row.id as string,
      classId: row.class_id as string,
      studentId: row.student_id as string,
      enrolledAt: row.enrolled_at as string,
      className: c?.name,
      classGrade: c?.grade,
      inviteCode: c?.invite_code,
    }
  })
}

/**
 * 항상 "가장 최근에 가입한 반"을 활성 반으로 삼는다(여러 반에 가입한 경우 포함).
 * 예전엔 로컬에 저장된 classId가 있으면 그걸 먼저 썼는데, 학생이 다른 반에
 * 새로 가입한 뒤에도 오래된 반이 계속 활성으로 남아 그 반 과제가 보이는
 * 버그가 있었다 — 매번 최신 가입 기록을 다시 조회해 갱신한다.
 */
export async function resolveActiveClassId(): Promise<string | null> {
  const enrollments = await fetchMyEnrollments()
  if (enrollments.length === 0) return null
  const latest = enrollments[0]!
  setActiveClassId(latest.classId)
  return latest.classId
}

/**
 * 반 담당 선생님이 「설정」에서 정한 칭찬 캘린더 통과 기준 점수.
 * 선생님이 값을 바꾸지 않았거나 조회에 실패하면 기본값(70)을 돌려준다.
 */
export async function fetchPraisePassThreshold(
  classId: string,
): Promise<number> {
  if (!isSyncEnabled()) return DEFAULT_PASS_SCORE_THRESHOLD
  const supabase = getSupabase()
  if (!supabase) return DEFAULT_PASS_SCORE_THRESHOLD

  const { data, error } = await supabase
    .from('classes')
    .select('profiles:teacher_id(praise_pass_threshold)')
    .eq('id', classId)
    .maybeSingle()

  if (error || !data) return DEFAULT_PASS_SCORE_THRESHOLD

  const profile = data.profiles as
    | { praise_pass_threshold?: number }
    | { praise_pass_threshold?: number }[]
    | null
  const p = Array.isArray(profile) ? profile[0] : profile
  const value = p?.praise_pass_threshold
  return typeof value === 'number' ? value : DEFAULT_PASS_SCORE_THRESHOLD
}

function countSnapshotQuestions(snapshot: ContentSnapshot): number {
  // Same adapter as AssignmentRunnerScreen so map % matches solvable items.
  return countSectionQuestions(buildAssignmentSections(snapshot))
}

export async function fetchStudentAssignments(
  classId: string,
): Promise<StudentAssignment[]> {
  if (!isSyncEnabled()) return []
  const supabase = getSupabase()
  const userId = await ensureStudentSession()
  if (!supabase || !userId) return []

  const { data: rows, error } = await supabase
    .from('class_assignments')
    .select('*')
    /*
      **아직 공개 전인 과제는 빼고 받는다.**
      `open_at`은 「수업일 + 그 반의 수업 종료 시각」이다(교사 웹이 계산해서 박아 둔다).
      서버 정책(마이그레이션 009)이 이미 같은 조건으로 막고 있어서 이 줄이 없어도
      안 내려오지만, 여기서도 걸러 두면 정책이 아직 안 올라간 프로젝트에서도 동작이
      같다. 컬럼이 없던 시절 과제는 `null` — 이미 공개로 본다.
    */
    .or(`open_at.is.null,open_at.lte.${new Date().toISOString()}`)
    .eq('class_id', classId)
    .order('sort_order', { ascending: true })
    .order('assigned_at', { ascending: true })

  if (error || !rows) {
    if (error) console.warn('[sync] fetch assignments failed', error.message)
    return []
  }

  const assignmentIds = rows.map((r) => r.id as string)
  const { data: attempts } = assignmentIds.length
    ? await supabase
        .from('attempts')
        .select('*')
        .eq('student_id', userId)
        .in('assignment_id', assignmentIds)
        .order('started_at', { ascending: true })
    : { data: [] as Record<string, unknown>[] }

  const attemptsByAssignment = new Map<string, AttemptProgress[]>()
  for (const row of attempts ?? []) {
    const a = mapAttempt(row as Record<string, unknown>)
    const list = attemptsByAssignment.get(a.assignmentId) ?? []
    list.push(a)
    attemptsByAssignment.set(a.assignmentId, list)
  }

  return rows.map((row, index) => {
    const snapshot = (row.content_snapshot ?? {
      version: 1,
      title: '과제',
      grade: '',
      textbook: '',
      unit: '',
      problemTypes: { words: [], sentences: [], grammar: [] },
      words: [],
      sentences: [],
      grammar: [],
    }) as ContentSnapshot

    const mine = attemptsByAssignment.get(row.id as string) ?? []
    const latest = mine[mine.length - 1]
    const firstCompleted = mine.find((a) => a.status === 'completed')
    const latestCompleted = [...mine].reverse().find((a) => a.status === 'completed')

    // 완료 이력이 있으면 성은 완료로 둔다. 재도전·틀린문제만으로 열린 in_progress
    // attempt가 남아 있어도 「진행중」으로 떨어지면 안 된다 — 풀이 중 표시는
    // 로컬 `retryingAssignmentId`(재도전 중!)가 담당한다.
    let status: StudentAssignment['status'] = 'active'
    if (latestCompleted || latest?.status === 'completed') status = 'completed'
    else if (latest && latest.progressPercent > 0) status = 'in_progress'

    // 재도전 직후 새 attempt는 0%라 미션 카드·체감 위치가 「처음」으로 보인다.
    // 완료 이력이 있으면 그 진행률을 유지하고, 새 풀이가 실제로 진행되면 그걸 쓴다.
    const latestProgress = latest?.progressPercent ?? 0
    const completedProgress = latestCompleted?.progressPercent ?? 0
    const progressPercent =
      latest?.status === 'in_progress' && latestProgress > 0
        ? latestProgress
        : latestCompleted
          ? completedProgress > 0
            ? completedProgress
            : 100
          : latestProgress

    return {
      assignmentId: row.id as string,
      classId: row.class_id as string,
      order: Number(row.sort_order ?? index),
      title: displayAssignmentTitle(snapshot),
      status,
      progressPercent,
      lessonDate: String(row.lesson_date),
      // 007 이전 과제는 컬럼이 없다 — 화면에서 수업일로 대체한다
      ...(typeof row.deadline_date === 'string' && row.deadline_date
        ? { deadlineDate: row.deadline_date }
        : {}),
      ...(row.deadline_until_next_lesson === true
        ? { deadlineUntilNextLesson: true }
        : {}),
      deadlineTime: String(row.deadline_time),
      assignedAt: String(row.assigned_at),
      questionTotal: countSnapshotQuestions(snapshot),
      answeredCount: latest?.answeredCount ?? 0,
      contentSnapshot: snapshot,
      ...(typeof row.target_student_id === 'string' && row.target_student_id
        ? { targetStudentId: row.target_student_id }
        : {}),
      ...(typeof row.open_at === 'string' && row.open_at
        ? { openAt: row.open_at }
        : {}),
      latestAttemptId: latest?.id,
      latestScore: latestCompleted?.score ?? latest?.score ?? null,
      firstScore: firstCompleted?.score ?? null,
      // 점수와 같은 회차를 봐야 한다 — 완료 회차가 없으면 진행 중 회차의 값
      latestMaxCombo: latestCompleted?.maxCombo ?? latest?.maxCombo ?? 0,
      completedAt: latestCompleted?.completedAt ?? null,
    }
  })
}

export async function startOrResumeAttempt(params: {
  assignmentId: string
  questionTotal: number
  forceNew?: boolean
}): Promise<AttemptProgress | null> {
  if (!isSyncEnabled()) return null
  const supabase = getSupabase()
  const userId = await ensureStudentSession()
  if (!supabase || !userId) return null

  if (!params.forceNew) {
    const { data: existing } = await supabase
      .from('attempts')
      .select('*')
      .eq('assignment_id', params.assignmentId)
      .eq('student_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) return mapAttempt(existing as Record<string, unknown>)
  }

  const { data, error } = await supabase
    .from('attempts')
    .insert({
      assignment_id: params.assignmentId,
      student_id: userId,
      status: 'in_progress',
      answered_count: 0,
      correct_count: 0,
      progress_percent: 0,
      question_total: params.questionTotal,
    })
    .select('*')
    .single()

  if (error || !data) {
    console.warn('[sync] start attempt failed', error?.message)
    return null
  }
  return mapAttempt(data as Record<string, unknown>)
}

export async function recordAnswer(event: AnswerEvent): Promise<AttemptProgress | null> {
  if (!isSyncEnabled()) return null
  const supabase = getSupabase()
  const userId = await ensureStudentSession()
  if (!supabase || !userId) return null

  const { error: ansError } = await supabase.from('answers').upsert(
    {
      attempt_id: event.attemptId,
      question_id: event.questionId,
      client_answer_id: event.clientAnswerId,
      payload: event.payload,
      is_correct: event.isCorrect,
    },
    { onConflict: 'client_answer_id' },
  )
  if (ansError) {
    console.warn('[sync] record answer failed', ansError.message)
  }

  /*
    **집계는 서버가 한다** (마이그레이션 012).
    답안이 들어오면 트리거가 `attempts`의 푼 문항 수·정답 수·진행률·점수를 답안 표에서
    다시 계산한다. 그래서 여기서는 다시 읽기만 한다.

    예전에는 앱이 직접 세어 `update`로 올렸다. 두 가지가 문제였다 —
    같은 계산이 앱과 서버 두 곳에 생겨 어긋날 수 있었고(48/50 같은 값이 그렇게 나왔다),
    무엇보다 학생이 그 `update`로 **점수를 그냥 100으로 써 넣을 수 있었다.**
    이제 앱이 뭘 보내든 트리거가 덮어쓰므로 올릴 이유가 없다.
  */
  const { data: attempt, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('id', event.attemptId)
    .single()

  if (error || !attempt) {
    console.warn('[sync] read attempt failed', error?.message)
    return null
  }
  return mapAttempt(attempt as Record<string, unknown>)
}

/**
 * 풀이 중 peak가 오를 때마다 호출 — 중간에 나가도 회차 MAX COMBO가 남지 않도록.
 * 이미 기록된 값보다 클 때만 덮어쓴다.
 */
export async function touchAttemptMaxCombo(
  attemptId: string,
  maxCombo: number,
): Promise<void> {
  if (!isSyncEnabled() || maxCombo <= 0) return
  const supabase = getSupabase()
  if (!supabase) return

  const { data: prev } = await supabase
    .from('attempts')
    .select('max_combo')
    .eq('id', attemptId)
    .maybeSingle()

  const prevMax = Number(prev?.max_combo ?? 0)
  if (maxCombo <= prevMax) return

  const { error } = await supabase
    .from('attempts')
    .update({
      max_combo: maxCombo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', attemptId)

  if (error) {
    console.warn('[sync] touch max_combo failed', error.message)
  }
}

/**
 * @param maxCombo 이번 풀이의 최고 연속 정답. 이미 기록된 값보다 클 때만 덮어쓴다 —
 *   중간에 나갔다 이어 푼 경우 러너의 콤보는 0부터 다시 세므로, 그냥 쓰면 앞 구간에서
 *   쌓은 기록이 지워진다.
 */
export async function completeAttempt(
  attemptId: string,
  maxCombo = 0,
): Promise<AttemptProgress | null> {
  if (!isSyncEnabled()) return null
  const supabase = getSupabase()
  if (!supabase) return null

  const { data: prev } = await supabase
    .from('attempts')
    .select('max_combo')
    .eq('id', attemptId)
    .maybeSingle()

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('attempts')
    .update({
      status: 'completed',
      progress_percent: 100,
      max_combo: Math.max(maxCombo, Number(prev?.max_combo ?? 0)),
      completed_at: now,
      updated_at: now,
    })
    .eq('id', attemptId)
    .select('*')
    .single()

  if (error || !data) {
    console.warn('[sync] complete attempt failed', error?.message)
    return null
  }
  return mapAttempt(data as Record<string, unknown>)
}

export async function fetchAnsweredQuestionIds(
  attemptId: string,
): Promise<string[]> {
  if (!isSyncEnabled()) return []
  const supabase = getSupabase()
  if (!supabase) return []

  const { data } = await supabase
    .from('answers')
    .select('question_id')
    .eq('attempt_id', attemptId)

  return (data ?? []).map((r) => String(r.question_id))
}

/** 해당 attempt에서 오답으로 기록된 question_id 목록 */
/**
 * 이 시도에서 **마지막까지 이어진 연속 정답 수.**
 *
 * 콤보는 러너 컴포넌트 메모리에만 있어서, 학생이 나갔다 다시 들어오면 0부터 시작했다.
 * 이어풀기를 해도 콤보만 끊기는 게 이상해서(2026-08-11) 답안 기록에서 되살린다.
 *
 * **저장하지 않고 답안에서 다시 센다.** 콤보는 「연속 정답」의 표현일 뿐이라 답안이
 * 원본이고, 따로 저장하면 둘이 어긋날 수 있다. 뒤에서부터 훑어 오답을 만나면 멈춘다.
 */
export async function fetchTrailingCorrectStreak(
  attemptId: string,
): Promise<number> {
  if (!isSyncEnabled()) return 0
  const supabase = getSupabase()
  if (!supabase) return 0

  const { data, error } = await supabase
    .from('answers')
    .select('is_correct, created_at')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true })

  if (error || !data) {
    if (error) console.warn('[sync] fetch combo streak failed', error.message)
    return 0
  }

  let streak = 0
  for (let index = data.length - 1; index >= 0; index -= 1) {
    // 미채점(null)은 이어지는 것으로 보지 않는다 — 맞았다고 칠 근거가 없다
    if (data[index]?.is_correct !== true) break
    streak += 1
  }
  return streak
}

export async function fetchWrongQuestionIds(
  attemptId: string,
): Promise<string[]> {
  if (!isSyncEnabled()) return []
  const supabase = getSupabase()
  if (!supabase) return []

  /*
    **마지막 답이 오답인 문항만.** `is_correct = false`로 바로 거르면 안 된다 —
    예전 기록에는 한 문항에 여러 행이 쌓여 있어서(오답 → 나중에 정답), 틀린 적이
    한 번이라도 있으면 영영 오답으로 남았다. 그래서 「틀린문제만」이 사실상 전체를
    다시 냈다. 지금은 문항당 한 행이지만, 그 전에 쌓인 기록도 맞게 읽어야 한다.
  */
  const { data, error } = await supabase
    .from('answers')
    .select('question_id, is_correct, created_at')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('[sync] fetch wrong answers failed', error.message)
    return []
  }

  const lastVerdict = new Map<string, boolean | null>()
  for (const row of data ?? []) {
    lastVerdict.set(
      String(row.question_id),
      row.is_correct == null ? null : Boolean(row.is_correct),
    )
  }

  return [...lastVerdict.entries()]
    .filter(([, isCorrect]) => isCorrect === false)
    .map(([questionId]) => questionId)
}

export type RealtimeUnsubscribe = () => void

/**
 * 반 과제·본인 시도 변경 구독.
 * 교사가 맵 체류 중 2번째 과제를 부여해도 목록이 갱신되도록 한다.
 * Realtime 실패 시에는 호출 측에서 focus/visibility 재조회로 폴백한다.
 */
export function subscribeStudentClassRealtime(
  classId: string,
  onChange: () => void,
): RealtimeUnsubscribe {
  if (!isSyncEnabled()) return () => undefined
  const supabase = getSupabase()
  if (!supabase) return () => undefined

  // attempts는 구독하지 않음 — 풀이 중 답안 저장마다 홈이 갱신되며
  // AssignmentRunner가 리마운트되는 문제(타일 클릭 시 새로고침처럼 보임)를 막는다.
  // 맵 복귀 시·class_assignments 변경 시 목록을 다시 받는다.
  const channel = supabase
    .channel(`student-class-${classId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'class_assignments',
        filter: `class_id=eq.${classId}`,
      },
      () => onChange(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
