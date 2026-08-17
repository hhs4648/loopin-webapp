/**
 * 복습 탭의 「분류」 체계.
 *
 * 교사가 고르는 출제 형식(짝맞추기 · 3지선다 · 영작 …)은 쓰지 않는다.
 *
 * - **단어 · 문장 → 단원 기준** (`5단원 단어`, `5단원 문장`).
 *   내신 시험 범위가 단원 단위라 학생이 복습에 들어오는 동기와 맞고,
 *   교사가 한 단원을 파트로 쪼개 여러 과제로 내도(교사측 `problem-sets.ts`) 학생 쪽에서 다시 합쳐진다.
 * - **문법 → 개념 기준** (`major`: 관계대명사, to부정사 …).
 *   문법 개념은 단원을 넘나들며 반복돼서 단원에 가두면 약점이 안 보인다. 형식(OX·선택형)은 무시한다.
 *
 * 분류 판별은 `question_id`의 접미사 + 과제 스냅샷 조회로 한다.
 * 서버 `answers`에 분류 컬럼이 없기 때문이다. 교사측 `parseAnswerQuestionId`와 대칭.
 */

import type { ContentSnapshot } from '../../lib/sync/types'

/** 단원 분류의 갈래. 단어와 문장은 같은 단원이어도 따로 센다. */
export type ReviewUnitKind = 'word' | 'sentence'

/**
 * 복습 한 칸의 정체. 문자열 키를 파싱해서 되돌리는 대신 구조를 그대로 들고 다닌다 —
 * 라벨을 만들 때 교재·학년이 필요한데(아래 `buildReviewLabels`) 키에서 도로 꺼내면 깨지기 쉽다.
 */
export type ReviewCategory =
  | {
      section: 'unit'
      kind: ReviewUnitKind
      grade: string
      textbook: string
      unit: string
    }
  | { section: 'grammar'; concept: string }

/** `major`가 없는 옛 스냅샷의 문법 문항이 모이는 곳 */
export const GRAMMAR_FALLBACK_LABEL = '문법'

/** 스냅샷에 `unit`이 비어 있을 때 (직접 출제 등) */
export const UNIT_FALLBACK_LABEL = '기타'

const UNIT_KIND_LABEL: Record<ReviewUnitKind, string> = {
  word: '단어',
  sentence: '문장',
}

/** 같은 단원 안에서 단어를 문장보다 먼저 보여준다 */
const UNIT_KIND_ORDER: Record<ReviewUnitKind, number> = { word: 0, sentence: 1 }

/**
 * 집계용 문자열 키.
 *
 * 구분자는 `|` — 학년(`중3`) · 교과서(`YBM(송)`) · 단원(`5단원`) · 문법 개념(`관계대명사`)은
 * 전부 문제은행 카탈로그 값이라 `|`가 들어가지 않는다.
 *
 * **단원만으로 묶지 않는다.** 교사가 한 반에 교과서와 부교재를 섞어 내면 서로 다른 교재의
 * 5단원이 한 칸에 합쳐져 복습에 남의 교재 단어가 섞여 나온다. 교사측 `problem-sets.ts`도
 * 「학년·교과서·단원이 모두 같아야 한 단원」으로 파트를 묶는다 — 같은 규칙을 쓴다.
 */
export function reviewCategoryKey(category: ReviewCategory): string {
  if (category.section === 'grammar') return `grammar|${category.concept}`
  return `unit|${category.kind}|${category.grade}|${category.textbook}|${category.unit}`
}

/** `5단원` → 5, `10단원` → 10. 문자열 정렬이면 `10단원`이 `5단원`보다 앞에 온다. */
export function unitSortValue(unit: string): number {
  const matched = unit.match(/\d+/)
  return matched ? Number(matched[0]) : Number.MAX_SAFE_INTEGER
}

/** 목록 정렬용 — 단원 번호 → 단어/문장 → 교재명 순 */
export function compareUnitCategories(
  a: ReviewCategory,
  b: ReviewCategory,
): number {
  if (a.section !== 'unit' || b.section !== 'unit') return 0
  return (
    unitSortValue(a.unit) - unitSortValue(b.unit) ||
    a.unit.localeCompare(b.unit, 'ko') ||
    UNIT_KIND_ORDER[a.kind] - UNIT_KIND_ORDER[b.kind] ||
    a.textbook.localeCompare(b.textbook, 'ko')
  )
}

/** 충돌이 없을 때의 라벨. `5단원 단어` / `관계대명사` */
function baseLabel(category: ReviewCategory): string {
  if (category.section === 'grammar') {
    return category.concept || GRAMMAR_FALLBACK_LABEL
  }
  return `${category.unit} ${UNIT_KIND_LABEL[category.kind]}`
}

/**
 * 분류들의 라벨을 한꺼번에 만든다 (키 → 라벨).
 *
 * 학생은 보통 교과서 하나만 쓰므로 `5단원 단어`로 충분하다. 그런데 교사가 교과서와 부교재를
 * 같이 내면 서로 다른 두 분류가 **같은 라벨**이 되어 학생이 어느 쪽인지 구분할 수 없다.
 * 그때만 교재명을(그래도 겹치면 학년까지) 앞에 붙인다 — 한 교재만 쓰는 학생은 볼 일이 없다.
 */
export function buildReviewLabels(
  categories: ReviewCategory[],
): Map<string, string> {
  const byBaseLabel = new Map<string, ReviewCategory[]>()
  for (const category of categories) {
    const base = baseLabel(category)
    const bucket = byBaseLabel.get(base)
    if (bucket) bucket.push(category)
    else byBaseLabel.set(base, [category])
  }

  const labels = new Map<string, string>()
  for (const [base, group] of byBaseLabel) {
    if (group.length === 1) {
      labels.set(reviewCategoryKey(group[0]!), base)
      continue
    }

    // 교재명을 붙여서 갈리는지 먼저 본다 (`YBM(송) 5단원 단어`).
    const withTextbook = group.map((category) =>
      category.section === 'unit' ? `${category.textbook} ${base}`.trim() : base,
    )
    const textbookIsEnough = new Set(withTextbook).size === group.length

    group.forEach((category, index) => {
      const key = reviewCategoryKey(category)
      if (textbookIsEnough) {
        labels.set(key, withTextbook[index]!)
      } else if (category.section === 'unit') {
        labels.set(key, `${category.grade} ${category.textbook} ${base}`.trim())
      } else {
        labels.set(key, base)
      }
    })
  }

  return labels
}

/**
 * `build-session-sections.ts`가 붙이는 접미사.
 * 긴 것부터 검사해야 `:ox:fix`가 `:ox`로 잘리지 않는다.
 */
const QUESTION_ID_SUFFIXES = [
  ':ox:fix',
  ':match',
  ':listen',
  ':choice',
  ':spell',
  ':translate',
  ':chunk',
  ':write',
  ':ox',
] as const

export type QuestionTypeSuffix = (typeof QUESTION_ID_SUFFIXES)[number]

export type ParsedQuestionId = {
  /** 스냅샷의 단어·문장·문법 원본 id */
  baseId: string
  suffix: QuestionTypeSuffix | null
}

export function parseQuestionId(questionId: string): ParsedQuestionId {
  for (const suffix of QUESTION_ID_SUFFIXES) {
    if (questionId.endsWith(suffix)) {
      return { baseId: questionId.slice(0, -suffix.length), suffix }
    }
  }
  return { baseId: questionId, suffix: null }
}

function unitCategory(
  snapshot: ContentSnapshot,
  kind: ReviewUnitKind,
): ReviewCategory {
  return {
    section: 'unit',
    kind,
    grade: snapshot.grade?.trim() ?? '',
    textbook: snapshot.textbook?.trim() ?? '',
    unit: snapshot.unit?.trim() || UNIT_FALLBACK_LABEL,
  }
}

/**
 * 스냅샷 안에서 원본 id를 찾아 분류를 정한다.
 *
 * id 접두어(`word-` / `sent-` / `gram-`)로 판별하지 **않는다** — 직접 출제(custom draft)는
 * `custom-s-0` 같은 다른 접두어를 쓰기 때문이다. 반드시 스냅샷 배열을 조회한다.
 * 단원 역시 id에 박힌 문자열(`word-중3-YBM(송)-5단원-1`)이 아니라 스냅샷의 `unit` 필드에서
 * 가져온다 — 직접 출제 문항에는 id에 단원이 없다.
 *
 * 판별할 수 없으면 `null`을 돌려주고, 호출측은 그 답안을 집계에서 제외한다.
 * (모르는 문항을 아무 분류에나 넣느니 빼는 게 낫다 — 잘못된 복습 추천은 안 하느니만 못하다.)
 */
export function resolveReviewCategory(
  questionId: string,
  snapshot: ContentSnapshot,
): ReviewCategory | null {
  const { baseId, suffix } = parseQuestionId(questionId)
  if (!suffix) return null

  if (snapshot.words.some((word) => word.id === baseId)) {
    return unitCategory(snapshot, 'word')
  }

  if (snapshot.sentences.some((sentence) => sentence.id === baseId)) {
    return unitCategory(snapshot, 'sentence')
  }

  const grammar = snapshot.grammar.find((item) => item.id === baseId)
  if (grammar) {
    const concept = grammar.major?.trim() || GRAMMAR_FALLBACK_LABEL
    return { section: 'grammar', concept }
  }

  return null
}
