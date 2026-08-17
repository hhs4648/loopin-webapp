/**
 * 복습 탭 「지금 시작하기」용 합성 과제.
 *
 * 카드의 「복습 문제」와 같은 방식(`buildAssignmentSections` + `resolveReviewCategory`)으로
 * 해당 분류 문항을 **전부** 모은다. 오답만이 아니다.
 *
 * 러너는 스냅샷 하나만 받으므로 여러 과제 내용을 하나로 합친다.
 */

import {
  buildAssignmentSections,
  listSectionQuestionIds,
} from '../assignments/build-session-sections'
import type { ContentSnapshot, StudentAssignment } from '../../lib/sync/types'
import type { ReviewAnswerInput } from './review-stats'
import {
  parseQuestionId,
  resolveReviewCategory,
  reviewCategoryKey,
  type ReviewCategory,
} from './review-types'

export type ReviewSession = {
  assignment: StudentAssignment
  /** 합성 스냅샷 기준 전체 문항 id (디버그·표시용). 러너는 스냅샷 전체를 그대로 푼다. */
  questionIds: string[]
}

/**
 * 복습 합성 과제의 `assignmentId` 접두어.
 *
 * **이 과제는 서버 `class_assignments`에 없다.** 그래서 「과제 목록에 있는가」로 판단하는
 * 코드는 전부 이 접두어를 먼저 걸러야 한다. 안 그러면 복습 세션을 「교사가 삭제한 과제」로
 * 오인해서 쫓아낸다 — 실제로 「지금 시작하기」가 눌려도 맵으로 튕기던 원인이었다(2026-08-09).
 */
export const REVIEW_ASSIGNMENT_ID_PREFIX = 'review:'

export function isReviewAssignmentId(assignmentId: string | null | undefined) {
  return assignmentId?.startsWith(REVIEW_ASSIGNMENT_ID_PREFIX) === true
}

/** `review:<categoryKey>`에서 분류 키만 꺼낸다. 접두어가 아니면 null */
export function categoryKeyFromReviewAssignmentId(
  assignmentId: string | null | undefined,
): string | null {
  if (!isReviewAssignmentId(assignmentId) || !assignmentId) return null
  const key = assignmentId.slice(REVIEW_ASSIGNMENT_ID_PREFIX.length)
  return key.length > 0 ? key : null
}

function uniqueSnapshots(
  answers: ReviewAnswerInput[],
  extraSnapshots: ContentSnapshot[] = [],
): ContentSnapshot[] {
  const seen = new Set<ContentSnapshot>()
  const out: ContentSnapshot[] = []
  for (const snapshot of [
    ...extraSnapshots,
    ...answers.map((answer) => answer.snapshot),
  ]) {
    if (seen.has(snapshot)) continue
    seen.add(snapshot)
    out.push(snapshot)
  }
  return out
}

function mergeUniqueStrings(into: string[], add: readonly string[] | undefined) {
  if (!add) return
  for (const value of add) {
    if (value && !into.includes(value)) into.push(value)
  }
}

function sameWord(
  a: ContentSnapshot['words'][number],
  b: ContentSnapshot['words'][number],
): boolean {
  return a.english === b.english && a.korean === b.korean
}

function sameSentence(
  a: ContentSnapshot['sentences'][number],
  b: ContentSnapshot['sentences'][number],
): boolean {
  return a.english === b.english && a.korean === b.korean
}

function sameGrammar(
  a: ContentSnapshot['grammar'][number],
  b: ContentSnapshot['grammar'][number],
): boolean {
  return a.english === b.english && a.korean === b.korean
}

function safeProblemTypes(
  snapshot: ContentSnapshot,
): ContentSnapshot['problemTypes'] {
  return {
    words: snapshot.problemTypes?.words ?? [],
    sentences: snapshot.problemTypes?.sentences ?? [],
    grammar: snapshot.problemTypes?.grammar ?? [],
  }
}

function sectionsFromSnapshot(snapshot: ContentSnapshot) {
  try {
    return buildAssignmentSections({
      ...snapshot,
      problemTypes: safeProblemTypes(snapshot),
      words: snapshot.words ?? [],
      sentences: snapshot.sentences ?? [],
      grammar: snapshot.grammar ?? [],
    })
  } catch (error) {
    console.warn('[review] build sections failed', error)
    return []
  }
}

/**
 * 답안·반 과제 스냅샷에서 `category` 문항만 모아 연습용 합성 과제를 만든다.
 */
export function buildReviewSession(
  answers: ReviewAnswerInput[],
  category: ReviewCategory,
  label: string,
  classSnapshots: ContentSnapshot[] = [],
): ReviewSession | null {
  const key = reviewCategoryKey(category)
  const snapshots = uniqueSnapshots(answers, classSnapshots)

  const wordById = new Map<string, ContentSnapshot['words'][number]>()
  const sentenceById = new Map<string, ContentSnapshot['sentences'][number]>()
  const grammarById = new Map<string, ContentSnapshot['grammar'][number]>()
  const problemTypes = {
    words: [] as string[],
    sentences: [] as string[],
    grammar: [] as string[],
  }
  const contributingSnapshots = new Set<ContentSnapshot>()

  let grade = category.section === 'unit' ? category.grade : ''
  let textbook = category.section === 'unit' ? category.textbook : ''
  let unit = category.section === 'unit' ? category.unit : ''

  const counted = new Set<string>()

  for (const snapshot of snapshots) {
    const questionIds = listSectionQuestionIds(sectionsFromSnapshot(snapshot))
    let contributed = false

    for (const questionId of questionIds) {
      if (counted.has(questionId)) continue
      const resolved = resolveReviewCategory(questionId, snapshot)
      if (!resolved || reviewCategoryKey(resolved) !== key) continue

      const { baseId, suffix } = parseQuestionId(questionId)
      if (!suffix) continue

      if (category.section === 'unit' && category.kind === 'word') {
        const word = (snapshot.words ?? []).find((item) => item.id === baseId)
        if (!word) continue
        const existing = wordById.get(baseId)
        if (existing && !sameWord(existing, word)) continue
        if (!existing) wordById.set(baseId, word)
      } else if (category.section === 'unit' && category.kind === 'sentence') {
        const sentence = (snapshot.sentences ?? []).find(
          (item) => item.id === baseId,
        )
        if (!sentence) continue
        const existing = sentenceById.get(baseId)
        if (existing && !sameSentence(existing, sentence)) continue
        if (!existing) sentenceById.set(baseId, sentence)
      } else {
        const grammar = (snapshot.grammar ?? []).find((item) => item.id === baseId)
        if (!grammar) continue
        const existing = grammarById.get(baseId)
        if (existing && !sameGrammar(existing, grammar)) continue
        if (!existing) grammarById.set(baseId, grammar)
      }

      counted.add(questionId)
      contributed = true
    }

    if (contributed) {
      contributingSnapshots.add(snapshot)
      const pt = safeProblemTypes(snapshot)
      mergeUniqueStrings(problemTypes.words, pt.words)
      mergeUniqueStrings(problemTypes.sentences, pt.sentences)
      mergeUniqueStrings(problemTypes.grammar, pt.grammar)
      if (category.section === 'grammar' && !grade) {
        grade = snapshot.grade ?? ''
        textbook = snapshot.textbook ?? ''
        unit = snapshot.unit ?? ''
      }
    }
  }

  if (counted.size === 0) return null

  // 3지선다 오답 보기용 — 분류에 기여한 스냅샷의 단어를 넉넉히 넣는다
  if (category.section === 'unit' && category.kind === 'word') {
    for (const snapshot of contributingSnapshots) {
      for (const word of snapshot.words ?? []) {
        const existing = wordById.get(word.id)
        if (existing && !sameWord(existing, word)) continue
        if (!existing) wordById.set(word.id, word)
      }
    }
  }

  const contentSnapshot: ContentSnapshot = {
    version: 1,
    title: `복습 · ${label}`,
    grade,
    textbook,
    unit,
    problemTypes,
    words: [...wordById.values()],
    sentences: [...sentenceById.values()],
    grammar: [...grammarById.values()],
  }

  const questionIds = listSectionQuestionIds(sectionsFromSnapshot(contentSnapshot))
  if (questionIds.length === 0) {
    console.warn('[review] merged snapshot produced 0 questions', {
      key,
      words: contentSnapshot.words.length,
      sentences: contentSnapshot.sentences.length,
      grammar: contentSnapshot.grammar.length,
      problemTypes,
    })
    return null
  }

  const assignment: StudentAssignment = {
    assignmentId: `review:${key}`,
    classId: 'review',
    order: 0,
    title: `복습 · ${label}`,
    status: 'active',
    progressPercent: 0,
    lessonDate: '',
    deadlineTime: '',
    assignedAt: new Date().toISOString(),
    questionTotal: questionIds.length,
    answeredCount: 0,
    contentSnapshot,
  }

  return { assignment, questionIds }
}
