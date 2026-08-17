/**
 * Shared teacher ↔ student sync DTOs.
 * Contract source: docs/student-teacher-sync.md + teacher supabase migration.
 */

export type SyncRole = 'student' | 'teacher'

export type AttemptStatus = 'in_progress' | 'completed'

export type CastleStatus = 'active' | 'in_progress' | 'completed'

export type StudentProfile = {
  id: string
  role: SyncRole
  displayName: string
  grade?: string
  birthdate?: string
  createdAt: string
  updatedAt: string
}

export type Enrollment = {
  id: string
  classId: string
  studentId: string
  enrolledAt: string
  className?: string
  classGrade?: string
  inviteCode?: string
  studentName?: string
  studentGrade?: string
}

export type ProblemWordSnapshot = {
  id: string
  english: string
  korean: string
  exampleEn?: string
  exampleKo?: string
}

export type ProblemSentenceSnapshot = {
  id: string
  english: string
  korean: string
  chunksEn?: string
  chunksKo?: string
  wrongChunks?: string
  hint?: string
}

export type ProblemGrammarSnapshot = {
  id: string
  english: string
  korean: string
  ox?: string
  wrongPart?: string
  choices?: string
  explanation?: string
  /**
   * 문법 개념 대분류/소분류 (예: `관계대명사` / `관계대명사 what`).
   * 교사측 content-snapshot.ts가 실어 보낸다. **2026-08 이전에 만든 과제 스냅샷에는 없다** —
   * 복습 탭은 없는 경우를 「문법」으로 묶어서 처리한다.
   */
  major?: string
  minor?: string
}

export type ContentSnapshot = {
  version: 1
  title: string
  grade: string
  textbook: string
  unit: string
  problemTypes: {
    words: string[]
    sentences: string[]
    grammar: string[]
  }
  words: ProblemWordSnapshot[]
  sentences: ProblemSentenceSnapshot[]
  grammar: ProblemGrammarSnapshot[]
}

export type StudentAssignment = {
  assignmentId: string
  classId: string
  order: number
  title: string
  status: CastleStatus
  progressPercent: number
  lessonDate: string
  /**
   * 마감 **날짜**(YYYY-MM-DD). 교사 웹에서 지정한 값 — 수업일과 다를 수 있다.
   * 마이그레이션 007 이전에 만들어진 과제에는 없다(그땐 수업일로 대체).
   */
  deadlineDate?: string
  /** 「다음 수업 전까지」로 지정된 마감 — 날짜 대신 그 문구로 보여준다 */
  deadlineUntilNextLesson?: boolean
  deadlineTime: string
  /**
   * ISO 시각 · **이 과제가 공개된 시점**(수업일의 수업 종료 시각).
   * 공개 전 과제는 애초에 내려오지 않으므로, 받은 값은 늘 과거다.
   * 이 컬럼이 없던 시절 과제는 없음 — 「예전부터 공개」로 본다.
   */
  openAt?: string
  assignedAt: string
  questionTotal: number
  answeredCount: number
  contentSnapshot: ContentSnapshot
  /**
   * 값이 있으면 **그 학생만 보는 개인 과제**(오답 다시 출제).
   * 학생 앱은 이런 과제를 **성 맵에 올리지 않고 헬스장으로 보낸다**(2026-08-11).
   */
  targetStudentId?: string
  latestAttemptId?: string
  latestScore?: number | null
  firstScore?: number | null
  /** 마지막 완료 회차의 최고 연속 정답 — 완료된 성을 다시 열 때 배지 복원용 */
  latestMaxCombo?: number
  completedAt?: string | null
}

export type AttemptProgress = {
  id: string
  assignmentId: string
  studentId: string
  status: AttemptStatus
  answeredCount: number
  correctCount: number
  progressPercent: number
  score: number | null
  questionTotal: number
  /** 이 회차 최고 연속 정답. 마이그레이션 005 이전 행은 0 */
  maxCombo: number
  startedAt: string
  completedAt: string | null
  updatedAt: string
}

export type AnswerEvent = {
  id?: string
  attemptId: string
  questionId: string
  clientAnswerId: string
  payload: Record<string, unknown>
  isCorrect: boolean | null
  createdAt?: string
}

export type EnrollResult =
  | {
      ok: true
      code: 'ENROLLED'
      enrollment: Enrollment
      class: { id: string; name: string; grade?: string; inviteCode: string }
    }
  | {
      ok: false
      code:
        | 'UNAUTHENTICATED'
        | 'INVALID_CODE'
        | 'NO_PROFILE'
        | 'NOT_STUDENT'
        | 'ALREADY_ENROLLED'
        | 'SYNC_DISABLED'
        | 'UNKNOWN'
      message: string
      enrollment?: Enrollment
      class?: { id: string; name: string; grade?: string; inviteCode: string }
    }
