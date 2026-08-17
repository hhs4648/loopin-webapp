/**
 * 복습 탭 데이터 조회.
 *
 * 기존 `student-api.ts`의 오답 조회는 attempt 하나(`fetchWrongQuestionIds`) 단위라
 * 유형별 정답률을 낼 수 없다. 여기서는 **학생의 모든 시도 × 모든 답안**을 한 번에 모은다.
 *
 * `answers`에는 유형 컬럼이 없다. 유형은 `question_id` 접미사 + 과제 스냅샷으로 판별하므로
 * 답안마다 어느 과제에서 나왔는지(=어떤 스냅샷을 볼지)를 같이 들고 다녀야 한다.
 */

import { getSupabase, isSyncEnabled } from './supabase-client'
import { ensureStudentSession } from './student-api'
import type { ContentSnapshot } from './types'
import type { ReviewAnswerInput } from '../../features/review/review-stats'
import { STREAK_LOOKBACK_DAYS } from '../../features/review/review-streak'

/**
 * 한 번에 조회할 답안 수 상한. 학생 한 명이 쌓을 수 있는 답안은 많아야 수천 건이라
 * 전부 가져와도 되지만, 잘못된 쿼리가 테이블을 통째로 긁는 것을 막는 안전장치다.
 *
 * **정렬은 최신순이어야 한다.** 상한에 걸렸을 때 잘려나가는 쪽이 오래된 답안이 되도록.
 * 오름차순이면 최근 기록이 날아가 「가장 최근 답안만 센다」는 집계 전제가 조용히 깨진다.
 */
const ANSWER_FETCH_LIMIT = 5000

/** 스트릭 조회 행 수 상한. 60일 × 하루 몇 번이면 넉넉하다. */
const STREAK_FETCH_LIMIT = 500

/**
 * 「N일 연속 학습 중」용 학습 시각 목록.
 *
 * **`fetchReviewAnswers`와 달리 쿼리 한 번이고 반(class)에 매이지 않는다.** 메인 화면은 앱을 켜면
 * 바로 뜨는 화면이라 3연쇄 조회를 얹을 수 없다.
 * "공부를 했는가"는 어느 반이냐와 무관하므로 `attempts`를 학생 기준으로 바로 훑는다.
 *
 * `started_at`과 `updated_at`을 **둘 다** 센다. `started_at`만 보면 어제 시작한 과제를 오늘
 * 이어서 풀었을 때 오늘이 빠진다. 다만 `updated_at`은 마지막 수정 시각 하나뿐이라, 사흘에 걸쳐
 * 이어 푼 과제의 **중간 날**은 여전히 복원할 수 없다 — 답안별 시각을 봐야 정확해지는데
 * 그건 조회가 3배가 된다. 살아 있는 스트릭 판정에는 마지막 활동일이면 충분하다고 보고 감수한다.
 */
export async function fetchStudyTimestamps(): Promise<string[]> {
  if (!isSyncEnabled()) return []
  const supabase = getSupabase()
  const userId = await ensureStudentSession()
  if (!supabase || !userId) return []

  const since = new Date(
    Date.now() - STREAK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  const { data, error } = await supabase
    .from('attempts')
    .select('started_at, updated_at')
    .eq('student_id', userId)
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(STREAK_FETCH_LIMIT)

  if (error || !data?.length) {
    if (error) {
      console.warn('[sync] fetch study streak failed', error.message)
    }
    return []
  }

  const timestamps: string[] = []
  for (const row of data) {
    if (row.started_at) timestamps.push(String(row.started_at))
    if (row.updated_at) timestamps.push(String(row.updated_at))
  }
  return timestamps
}

export type ReviewFetchResult = {
  answers: ReviewAnswerInput[]
  /** 반에 부여된 모든 과제 스냅샷 — 복습 세션은 아직 안 푼 문항도 분류에 넣는다 */
  snapshots: ContentSnapshot[]
}

const EMPTY_REVIEW_FETCH: ReviewFetchResult = { answers: [], snapshots: [] }

/**
 * 학생이 이 반에서 푼 모든 답안 + 반 과제 스냅샷.
 * 동기화가 꺼져 있거나 조회에 실패하면 빈 결과 — 복습 탭은 「아직 기록이 없어요」를 보여준다.
 */
export async function fetchReviewAnswers(
  classId: string,
): Promise<ReviewFetchResult> {
  if (!isSyncEnabled()) return EMPTY_REVIEW_FETCH
  const supabase = getSupabase()
  const userId = await ensureStudentSession()
  if (!supabase || !userId) return EMPTY_REVIEW_FETCH

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from('class_assignments')
    .select('id, content_snapshot')
    .eq('class_id', classId)

  if (assignmentError || !assignmentRows?.length) {
    if (assignmentError) {
      console.warn('[sync] fetch review assignments failed', assignmentError.message)
    }
    return EMPTY_REVIEW_FETCH
  }

  const snapshotByAssignment = new Map<string, ContentSnapshot>()
  for (const row of assignmentRows) {
    const snapshot = row.content_snapshot as ContentSnapshot | null
    if (snapshot?.words && snapshot.sentences && snapshot.grammar) {
      snapshotByAssignment.set(String(row.id), snapshot)
    }
  }
  const snapshots = [...snapshotByAssignment.values()]
  if (snapshots.length === 0) return EMPTY_REVIEW_FETCH

  const { data: attemptRows, error: attemptError } = await supabase
    .from('attempts')
    .select('id, assignment_id')
    .eq('student_id', userId)
    .in('assignment_id', [...snapshotByAssignment.keys()])

  if (attemptError || !attemptRows?.length) {
    if (attemptError) {
      console.warn('[sync] fetch review attempts failed', attemptError.message)
    }
    return { answers: [], snapshots }
  }

  const assignmentByAttempt = new Map<string, string>()
  for (const row of attemptRows) {
    assignmentByAttempt.set(String(row.id), String(row.assignment_id))
  }

  const { data: answerRows, error: answerError } = await supabase
    .from('answers')
    .select('question_id, is_correct, created_at, attempt_id')
    .in('attempt_id', [...assignmentByAttempt.keys()])
    .order('created_at', { ascending: false })
    .limit(ANSWER_FETCH_LIMIT)

  if (answerError || !answerRows?.length) {
    if (answerError) {
      console.warn('[sync] fetch review answers failed', answerError.message)
    }
    return { answers: [], snapshots }
  }

  const answers: ReviewAnswerInput[] = []
  for (const row of answerRows) {
    const assignmentId = assignmentByAttempt.get(String(row.attempt_id))
    if (!assignmentId) continue
    const snapshot = snapshotByAssignment.get(assignmentId)
    if (!snapshot) continue

    answers.push({
      questionId: String(row.question_id),
      isCorrect: row.is_correct == null ? null : Boolean(row.is_correct),
      createdAt: String(row.created_at),
      snapshot,
    })
  }

  return { answers, snapshots }
}
