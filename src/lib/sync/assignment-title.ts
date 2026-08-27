/**
 * 학생 UI용 과제 표시 제목.
 * 스냅샷/제목에 붙는 학년·반(예: `중3`, `중3-1반`)은 빼고 보여 준다.
 */

function isGradeOrClassSegment(segment: string): boolean {
  const s = segment.trim()
  if (!s) return true
  // 초1~6 · 중1~3 · 고1~3
  if (/^(초|중|고)\s*[1-6]$/u.test(s)) return true
  // 중3-1반 · A반 · 1반 등 (짧은 반 표기)
  if (/반$/u.test(s) && s.length <= 12) return true
  return false
}

/** `중3 · 문장 과제 · 2026. 8. 1.` → `문장 과제 · 2026. 8. 1.` */
export function stripGradeClassFromTitle(title: string): string {
  const raw = title.trim()
  if (!raw) return '과제'

  const parts = raw
    .split(/\s*·\s*/u)
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    const kept = parts.filter((p) => !isGradeOrClassSegment(p))
    if (kept.length > 0) return kept.join(' · ')
  }

  const stripped = raw
    .replace(/^(초|중|고)\s*[1-6](?:\s*-\s*\d+)?\s*반?\s+/u, '')
    .trim()
  return stripped || raw
}

/** content_snapshot 기준 표시 제목 — 교재·단원이 있으면 학년 없이 조합 */
export function displayAssignmentTitle(snapshot: {
  title?: string
  grade?: string
  textbook?: string
  unit?: string
}): string {
  const textbook = snapshot.textbook?.trim() ?? ''
  const unit = snapshot.unit?.trim() ?? ''
  if (textbook || unit) {
    return [textbook, unit].filter(Boolean).join(' · ')
  }
  return stripGradeClassFromTitle(snapshot.title || '과제')
}

/**
 * 헬스장 시작 카드 큰 제목.
 *
 * - 단원 출제: 교재 · 단원 (`YBM(송) · 5단원`)
 * - 직접 출제(단원 없음): 선생님이 붙인 과제 이름
 * - 이름도 없으면 「선생님이 만든 문제」
 *
 * 복습 탭의 「기타」는 쓰지 않는다. 그쪽은 분류가 안 묶일 때 모아 두는
 * 쓰레기통 라벨이라, 시작 화면에 그대로 올리면 「무슨 오답인지」가 안 보인다.
 */
export function gymStartHeading(snapshot: {
  title?: string
  textbook?: string
  unit?: string
}): string {
  const textbook = snapshot.textbook?.trim() ?? ''
  const unit = snapshot.unit?.trim() ?? ''
  if (textbook || unit) {
    return [textbook, unit].filter(Boolean).join(' · ')
  }
  const title = stripGradeClassFromTitle(snapshot.title || '')
  if (title && title !== '과제') return title
  return '선생님이 만든 문제'
}

/**
 * 헬스장 완료 화면 큰 제목. 시안 「1단원 연습 완료!」자리에 올린다.
 * 단원이 있으면 그 이름만, 없으면 시작 카드와 같은 제목에 「연습 완료!」를 붙인다.
 */
export function gymCompleteHeading(snapshot: {
  title?: string
  textbook?: string
  unit?: string
}): string {
  const unit = snapshot.unit?.trim() ?? ''
  if (unit) return `${unit} 연습 완료!`
  return `${gymStartHeading(snapshot)} 연습 완료!`
}
