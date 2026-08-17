/**
 * 복습 세션 종료 시 로컬 진행 상태를 한곳에서 갱신한다.
 * - 연습 답안 → 오답률·추천 카드 재배치
 * - 만점이면 분류 감추기 / 오답 있으면면 감추기 해제
 */

import {
  categoryKeyFromReviewAssignmentId,
} from './build-review-session'
import { recordReviewPracticeSession } from './review-practice-answers'
import {
  clearReviewCategoryCleared,
  markReviewCategoryCleared,
} from './reviewed-categories'

export function persistReviewSessionOutcome(
  classId: string,
  assignmentId: string,
  answeredQuestionIds: readonly string[],
  wrongQuestionIds: readonly string[],
): void {
  if (!classId) return
  recordReviewPracticeSession(
    classId,
    answeredQuestionIds,
    wrongQuestionIds,
  )
  const key = categoryKeyFromReviewAssignmentId(assignmentId)
  if (!key) return
  if (wrongQuestionIds.length === 0) {
    markReviewCategoryCleared(classId, key)
  } else {
    clearReviewCategoryCleared(classId, key)
  }
}
