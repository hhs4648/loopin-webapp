const RETRY_SESSION_KEY = 'haksup-castle-retry-session'

export type CastleRetrySession = {
  retryingAssignmentId: string | null
  retryingDemoIndex: 0 | 1 | null
  activeAssignmentId: string | null
  onlyQuestionIds: string[] | null
  /** true면 새로고침 후 풀이 화면으로 복귀 */
  resumeRunner: boolean
  /** 데모 1성 재도전 시 완료 표시 유지 */
  round1MissionCompleted?: boolean
}

export function loadCastleRetrySession(): CastleRetrySession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(RETRY_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CastleRetrySession>
    return {
      retryingAssignmentId:
        typeof parsed.retryingAssignmentId === 'string'
          ? parsed.retryingAssignmentId
          : null,
      retryingDemoIndex:
        parsed.retryingDemoIndex === 0 || parsed.retryingDemoIndex === 1
          ? parsed.retryingDemoIndex
          : null,
      activeAssignmentId:
        typeof parsed.activeAssignmentId === 'string'
          ? parsed.activeAssignmentId
          : null,
      onlyQuestionIds: Array.isArray(parsed.onlyQuestionIds)
        ? parsed.onlyQuestionIds.filter((id): id is string => typeof id === 'string')
        : null,
      resumeRunner: parsed.resumeRunner === true,
      round1MissionCompleted: parsed.round1MissionCompleted === true,
    }
  } catch {
    return null
  }
}

export function saveCastleRetrySession(session: CastleRetrySession): void {
  if (typeof window === 'undefined') return
  const idle =
    session.retryingAssignmentId == null &&
    session.retryingDemoIndex == null &&
    !session.resumeRunner
  if (idle) {
    clearCastleRetrySession()
    return
  }
  try {
    sessionStorage.setItem(RETRY_SESSION_KEY, JSON.stringify(session))
  } catch {
    /* ignore quota */
  }
}

export function clearCastleRetrySession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(RETRY_SESSION_KEY)
  } catch {
    /* ignore */
  }
}
