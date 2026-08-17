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
