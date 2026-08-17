import type { StudentAssignment } from '../../lib/sync/types'

/**
 * 「오답만 다시 출제」로 나온 개인 과제.
 *
 * 교사 웹이 학생마다 따로 만드는 과제라 `target_student_id`가 채워져 있다.
 * **성 맵에는 올리지 않는다** — 예전에는 그냥 성이 하나 더 생겨서, 같은 제목의 성이
 * 나란히 서고 지울 방법도 없었다(2026-08-09에 DB에서 직접 지웠다).
 * 이제 헬스장 캐릭터를 눌러 푼다(2026-08-11).
 */
export function isWrongReissue(assignment: StudentAssignment): boolean {
  return Boolean(assignment.targetStudentId)
}

/**
 * 성 맵·오늘의 미션에 올릴 과제 — 개인 오답 재출제(`target_student_id`)는 뺀다.
 *
 * 성은 과제 유무와 무관하게 `MIN_DRAWN_CASTLES`만큼 그려지므로, 재출제만 있어도
 * 맵이 통째로 비지 않는다(그래서 이 필터를 다시 켠다).
 */
export function castleAssignments(
  assignments: StudentAssignment[],
): StudentAssignment[] {
  return assignments.filter((item) => !isWrongReissue(item))
}

/**
 * 헬스장에서 풀 오답 과제 — **아직 안 끝낸 것만, 오래된 순.**
 * 여러 개 쌓이면 먼저 낸 것부터 푼다(사용자 지정 2026-08-11).
 */
export function pendingWrongReissues(
  assignments: StudentAssignment[],
): StudentAssignment[] {
  return assignments
    .filter((item) => isWrongReissue(item) && item.status !== 'completed')
    .sort((a, b) => a.assignedAt.localeCompare(b.assignedAt))
}
