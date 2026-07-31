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
  deadlineTime: string
  assignedAt: string
  questionTotal: number
  answeredCount: number
  contentSnapshot: ContentSnapshot
  latestAttemptId?: string
  latestScore?: number | null
  firstScore?: number | null
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
