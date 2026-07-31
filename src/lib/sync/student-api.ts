import { getSupabase, isSyncEnabled } from './supabase-client'
import { DEFAULT_PASS_SCORE_THRESHOLD } from '../../components/praise-calendar/praise-calendar'
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
    startedAt: String(row.started_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    updatedAt: String(row.updated_at ?? row.started_at),
  }
}

export async function ensureStudentSession(): Promise<string | null> {
  if (!isSyncEnabled()) return null
  const supabase = getSupabase()
  if (!supabase) return null

  const { data: existing } = await supabase.auth.getSession()
  if (existing.session?.user?.id) return existing.session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    console.warn('[sync] student anonymous sign-in failed', error?.message)
    return null
  }
  return data.user.id
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

    let status: StudentAssignment['status'] = 'active'
    if (latest?.status === 'completed') status = 'completed'
    else if (latest && latest.progressPercent > 0) status = 'in_progress'

    return {
      assignmentId: row.id as string,
      classId: row.class_id as string,
      order: Number(row.sort_order ?? index),
      title: snapshot.title || '과제',
      status,
      progressPercent: latest?.progressPercent ?? 0,
      lessonDate: String(row.lesson_date),
      deadlineTime: String(row.deadline_time),
      assignedAt: String(row.assigned_at),
      questionTotal: countSnapshotQuestions(snapshot),
      answeredCount: latest?.answeredCount ?? 0,
      contentSnapshot: snapshot,
      latestAttemptId: latest?.id,
      latestScore: latestCompleted?.score ?? latest?.score ?? null,
      firstScore: firstCompleted?.score ?? null,
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

  const { data: attempt } = await supabase
    .from('attempts')
    .select('*')
    .eq('id', event.attemptId)
    .single()

  if (!attempt) return null

  const answered = Number(attempt.answered_count ?? 0) + 1
  const correct =
    Number(attempt.correct_count ?? 0) + (event.isCorrect ? 1 : 0)
  const total = Math.max(Number(attempt.question_total ?? 0), answered)
  const progress = Math.min(100, Math.round((answered / total) * 100))
  const score = answered > 0 ? Math.round((correct / answered) * 100) : null

  const { data: updated, error } = await supabase
    .from('attempts')
    .update({
      answered_count: answered,
      correct_count: correct,
      progress_percent: progress,
      score,
      question_total: total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.attemptId)
    .select('*')
    .single()

  if (error || !updated) {
    console.warn('[sync] update attempt failed', error?.message)
    return null
  }
  return mapAttempt(updated as Record<string, unknown>)
}

export async function completeAttempt(
  attemptId: string,
): Promise<AttemptProgress | null> {
  if (!isSyncEnabled()) return null
  const supabase = getSupabase()
  if (!supabase) return null

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('attempts')
    .update({
      status: 'completed',
      progress_percent: 100,
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
export async function fetchWrongQuestionIds(
  attemptId: string,
): Promise<string[]> {
  if (!isSyncEnabled()) return []
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('answers')
    .select('question_id')
    .eq('attempt_id', attemptId)
    .eq('is_correct', false)

  if (error) {
    console.warn('[sync] fetch wrong answers failed', error.message)
    return []
  }

  return (data ?? []).map((r) => String(r.question_id))
}
