/**
 * 학생 UI용 과제 표시 제목.
 * 스냅샷/제목에 붙는 학년·반(예: `중3`, `중3-1반`)은 빼고 보여 준다.
 *
 * 사용자 지정(직접 출제·단원 없음)은 `학년 외부지문N` 형식.
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

/** 수업일·마감일처럼 보이는 값 — 단원이 아니라 날짜로 쓴 사용자 지정 */
function looksLikeDateLabel(value: string): boolean {
  const s = value.trim()
  if (!s) return false
  if (/단원/u.test(s)) return false
  if (/^\d{4}\s*[.\-/년]\s*\d{1,2}/u.test(s)) return true
  if (/\d{1,2}\s*월\s*\d{1,2}\s*일/u.test(s)) return true
  return false
}

/**
 * 사용자 지정(직접 출제) 스냅샷.
 * 단원이 없거나, 단원/교재 자리에 날짜만 들어온 경우.
 */
export function isCustomExternalSnapshot(snapshot: {
  textbook?: string
  unit?: string
}): boolean {
  const unit = snapshot.unit?.trim() ?? ''
  const textbook = snapshot.textbook?.trim() ?? ''
  if (looksLikeDateLabel(unit) || looksLikeDateLabel(textbook)) return true
  // 단원 출제는 unit에 `N단원` 등이 온다. 비어 있으면 직접 출제.
  return !unit
}

/** `중학교 3학년` / `중 3` → `중3` */
export function shortGradeLabel(grade?: string): string {
  const g = grade?.trim() ?? ''
  if (!g) return ''
  if (/^(초|중|고)[1-6]$/u.test(g)) return g

  const compact = g.match(/^(초|중|고)\s*([1-6])$/u)
  if (compact) return `${compact[1]}${compact[2]}`

  const full = g.match(/(초등|중|고등)?학교?\s*([1-6])\s*학년/u)
  if (full) {
    const raw = full[1] ?? ''
    const level = raw.startsWith('초') ? '초' : raw.startsWith('고') ? '고' : '중'
    return `${level}${full[2]}`
  }

  const mid = g.match(/중학교\s*([1-3])/u)
  if (mid) return `중${mid[1]}`
  return g
}

/** `중3 외부지문2` */
export function formatExternalPassageTitle(
  snapshot: { grade?: string },
  index: number,
  options?: { className?: string },
): string {
  const n = Math.max(1, Math.floor(index))
  const grade =
    shortGradeLabel(snapshot.grade) ||
    shortGradeLabel(options?.className) ||
    ''
  return grade ? `${grade} 외부지문${n}` : `외부지문${n}`
}

type TitleOptions = {
  className?: string
  /**
   * 같은 반에서 사용자 지정 과제를 sort 순으로 센 번호(1부터).
   * 있으면 `학년 외부지문N`으로 표시한다.
   */
  externalPassageIndex?: number
  /** 이미 만든 표시 제목(맵·미션) — 헬스장 등에서 그대로 재사용 */
  assignmentTitle?: string
}

/**
 * content_snapshot 기준 표시 제목 (오늘의 미션 카드 등).
 * - 사용자 지정: `학년 외부지문N`
 * - 단원 출제: 반 이름 · 단원 (없으면 교재 · 단원)
 */
export function displayAssignmentTitle(
  snapshot: {
    title?: string
    grade?: string
    textbook?: string
    unit?: string
  },
  options?: TitleOptions,
): string {
  if (
    options?.externalPassageIndex != null &&
    isCustomExternalSnapshot(snapshot)
  ) {
    return formatExternalPassageTitle(
      snapshot,
      options.externalPassageIndex,
      options,
    )
  }

  const className = options?.className?.trim() ?? ''
  const unit = snapshot.unit?.trim() ?? ''
  if (className && unit && !looksLikeDateLabel(unit)) {
    return [className, unit].filter(Boolean).join(' · ')
  }
  const textbook = snapshot.textbook?.trim() ?? ''
  if ((textbook || unit) && !looksLikeDateLabel(unit) && !looksLikeDateLabel(textbook)) {
    return [textbook, unit].filter(Boolean).join(' · ')
  }
  return stripGradeClassFromTitle(snapshot.title || '과제')
}

/**
 * 헬스장 시작 카드 큰 제목.
 *
 * - 단원 출제: 반 이름 · 단원 (`중3-1반 · 5단원`). 반 이름 없으면 교재 · 단원
 * - 사용자 지정: `학년 외부지문N` (맵 제목과 동일)
 * - 이름도 없으면 「선생님이 만든 문제」
 */
export function gymStartHeading(
  snapshot: {
    title?: string
    grade?: string
    textbook?: string
    unit?: string
  },
  options?: TitleOptions,
): string {
  if (isCustomExternalSnapshot(snapshot)) {
    const preset = options?.assignmentTitle?.trim()
    if (preset && /외부지문\d+/u.test(preset)) return preset
    if (options?.externalPassageIndex != null) {
      return formatExternalPassageTitle(
        snapshot,
        options.externalPassageIndex,
        options,
      )
    }
    const grade = shortGradeLabel(snapshot.grade)
    if (grade) return `${grade} 외부지문`
    const title = stripGradeClassFromTitle(snapshot.title || '')
    if (title && title !== '과제' && !looksLikeDateLabel(title)) return title
    return '선생님이 만든 문제'
  }

  const className = options?.className?.trim() ?? ''
  const unit = snapshot.unit?.trim() ?? ''
  if (className) {
    return [className, unit].filter(Boolean).join(' · ')
  }
  const textbook = snapshot.textbook?.trim() ?? ''
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
export function gymCompleteHeading(
  snapshot: {
    title?: string
    grade?: string
    textbook?: string
    unit?: string
  },
  options?: TitleOptions,
): string {
  if (isCustomExternalSnapshot(snapshot)) {
    return `${gymStartHeading(snapshot, options)} 연습 완료!`
  }
  const unit = snapshot.unit?.trim() ?? ''
  if (unit && !looksLikeDateLabel(unit)) return `${unit} 연습 완료!`
  return `${gymStartHeading(snapshot, options)} 연습 완료!`
}
