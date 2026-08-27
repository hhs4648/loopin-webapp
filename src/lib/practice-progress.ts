/**
 * 연습 모드(「틀린문제만」·복습) 진행 상황을 **로컬에** 남긴다.
 *
 * 일반 과제는 서버에 attempt를 열어 답안을 올리므로, 나갔다 들어오면
 * `fetchAnsweredQuestionIds`로 푼 문제를 걸러 이어 푼다. 그런데 연습 모드는
 * **attempt를 일부러 안 연다** — 점수·정답률에 반영하면 안 되기 때문이다.
 * 그래서 이어풀 근거가 아무 데도 없었고, 나갔다 들어오면 **항상 처음부터** 다시
 * 풀렸다(콤보도 0으로 끊겼다). 2026-08-11에 여기로 옮겨 담았다.
 *
 * **서버에 올리지 않는다.** 연습은 기록이 아니라 되풀이라, 남기는 순간 점수 계산에
 * 섞여 들어갈 위험이 생긴다. 탭을 닫으면 사라지는 `sessionStorage`가 딱 맞는 수명이다.
 */

const KEY = 'haksup-practice-progress'

export type PracticeProgress = {
  /** 어떤 연습인지 — 과제 + 출제 범위가 같아야 이어 푼다 */
  key: string
  /** 이미 푼 문항 id */
  answeredIds: string[]
  /** 그중 틀린 것 — 나갔다 와도 완료 화면 점수가 맞아야 한다 */
  wrongIds: string[]
  /** 나갈 때의 연속 정답 수 */
  combo: number
  /** 이번 연습의 최고 연속 정답 */
  maxCombo: number
}

/**
 * 저장 키 — **출제 범위까지 포함한다.**
 * 같은 과제라도 「틀린문제만」과 복습 세션은 문항 집합이 달라서, 한 키로 묶으면
 * 다른 연습의 진행이 섞여 들어온다.
 */
export function practiceProgressKey(
  assignmentId: string,
  onlyIdsKey: string,
): string {
  return `${assignmentId}::${onlyIdsKey || 'all'}`
}

export function loadPracticeProgress(key: string): PracticeProgress | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PracticeProgress>
    if (parsed.key !== key) return null
    return {
      key,
      answeredIds: Array.isArray(parsed.answeredIds)
        ? parsed.answeredIds.filter((id): id is string => typeof id === 'string')
        : [],
      wrongIds: Array.isArray(parsed.wrongIds)
        ? parsed.wrongIds.filter((id): id is string => typeof id === 'string')
        : [],
      combo: Number.isFinite(parsed.combo) ? Number(parsed.combo) : 0,
      maxCombo: Number.isFinite(parsed.maxCombo) ? Number(parsed.maxCombo) : 0,
    }
  } catch {
    return null
  }
}

export function savePracticeProgress(progress: PracticeProgress): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    /* 저장 실패해도 풀이는 계속돼야 한다 — 이어풀기만 안 될 뿐 */
  }
}

/** 연습을 끝냈거나 다른 연습으로 넘어갈 때 */
export function clearPracticeProgress(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* no-op */
  }
}
