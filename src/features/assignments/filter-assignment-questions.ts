/**
 * 틀린문제만 / 복습 연습 — 섹션에서 지정 question_id만 남긴다.
 *
 * 짝맞추기는 페이지를 다시 섞어도 오답 id가 어느 페이지에 있든 모이도록
 * 섹션을 하나로 합친다. 문법 OX는 펼친 스텝 id(`:ox` / `:ox:fix`)를 원본 문항에 매핑한다.
 */

import {
  expandGrammarType2Steps,
  GRAMMAR_TYPE_2_X_ASSET,
  GRAMMAR_TYPE_2_X_OPTION_BOXES,
  type GrammarType2Question,
} from '../../components/grammar-type-2/grammar-type-2'
import { isFillPairId } from '../../components/word-match/word-match'
import type { WordMatchPair } from '../../components/word-match/word-match'
import {
  listSectionQuestionIds,
  type AssignmentSection,
} from './build-session-sections'

/** 채움 짝 id(`…:fill:…`)는 원본 짝 id로 되돌린다 */
export function normalizePracticeQuestionId(id: string): string {
  const fillAt = id.indexOf(':fill:')
  return fillAt >= 0 ? id.slice(0, fillAt) : id
}

function collectMatchPairs(
  sections: AssignmentSection[],
  kind: 'word-match' | 'word-listen-match',
  keep: Set<string>,
): WordMatchPair[] {
  const byId = new Map<string, WordMatchPair>()
  for (const section of sections) {
    if (section.kind !== kind) continue
    for (const pair of [...section.pairs, ...section.fillPool]) {
      if (isFillPairId(pair.id)) continue
      const id = normalizePracticeQuestionId(pair.id)
      if (!keep.has(id) || byId.has(id)) continue
      byId.set(id, { ...pair, id })
    }
  }
  return [...byId.values()]
}

function keepGrammarType2Questions(
  questions: GrammarType2Question[],
  keep: Set<string>,
): GrammarType2Question[] {
  const kept: GrammarType2Question[] = []

  for (const question of questions) {
    if (question.kind === 'word-choice') {
      if (keep.has(normalizePracticeQuestionId(question.id))) {
        kept.push(question)
      }
      continue
    }

    const oxId = normalizePracticeQuestionId(question.id)
    const fixId = `${oxId}:fix`
    const oxWrong = keep.has(oxId)
    const fixWrong = keep.has(fixId)

    if (oxWrong && fixWrong) {
      kept.push(question)
    } else if (oxWrong) {
      kept.push({ ...question, xCorrection: undefined })
    } else if (fixWrong && question.xCorrection) {
      const fix = question.xCorrection
      kept.push({
        kind: 'word-choice',
        id: fixId,
        asset: GRAMMAR_TYPE_2_X_ASSET,
        options: fix.options,
        correctOptionId: fix.correctOptionId,
        optionBoxes: GRAMMAR_TYPE_2_X_OPTION_BOXES,
        maskPassage: true,
        passageBefore: fix.passageBefore,
        wrongPart: fix.wrongPart,
        passageAfter: fix.passageAfter,
      })
    }
  }

  return kept
}

function keepOnlyInSection(
  section: AssignmentSection,
  keep: Set<string>,
): AssignmentSection | null {
  switch (section.kind) {
    case 'word-match':
    case 'word-listen-match':
      return null
    case 'word-quiz': {
      const questions = section.questions.filter((question) =>
        keep.has(normalizePracticeQuestionId(question.id)),
      )
      return questions.length ? { ...section, questions } : null
    }
    case 'word-spell': {
      const questions = section.questions.filter((question) =>
        keep.has(normalizePracticeQuestionId(question.id)),
      )
      return questions.length ? { ...section, questions } : null
    }
    case 'body-text-a': {
      const questions = section.questions.filter((question) =>
        keep.has(normalizePracticeQuestionId(question.id)),
      )
      return questions.length ? { ...section, questions } : null
    }
    case 'body-text-b': {
      const questions = section.questions.filter((question) =>
        keep.has(normalizePracticeQuestionId(question.id)),
      )
      return questions.length ? { ...section, questions } : null
    }
    case 'body-text-c': {
      const questions = section.questions.filter((question) =>
        keep.has(normalizePracticeQuestionId(question.id)),
      )
      return questions.length ? { ...section, questions } : null
    }
    case 'grammar-type-1': {
      const questions = section.questions.filter((question) =>
        keep.has(normalizePracticeQuestionId(question.id)),
      )
      return questions.length ? { ...section, questions } : null
    }
    case 'grammar-type-2': {
      const questions = keepGrammarType2Questions(section.questions, keep)
      return questions.length ? { ...section, questions } : null
    }
  }
}

/** `onlyQuestionIds`에 해당하는 문항만 남긴 섹션 목록 */
export function filterAssignmentSectionsByQuestionIds(
  sections: AssignmentSection[],
  onlyQuestionIds: readonly string[],
): AssignmentSection[] {
  if (!onlyQuestionIds.length) return sections

  const keep = new Set(onlyQuestionIds.map(normalizePracticeQuestionId))
  const result: AssignmentSection[] = []

  const matchPairs = collectMatchPairs(sections, 'word-match', keep)
  if (matchPairs.length) {
    result.push({
      kind: 'word-match',
      id: 'word-match-retry',
      pairs: matchPairs,
      fillPool: matchPairs,
    })
  }

  const listenPairs = collectMatchPairs(sections, 'word-listen-match', keep)
  if (listenPairs.length) {
    result.push({
      kind: 'word-listen-match',
      id: 'word-listen-match-retry',
      pairs: listenPairs,
      fillPool: listenPairs,
    })
  }

  for (const section of sections) {
    if (section.kind === 'word-match' || section.kind === 'word-listen-match') {
      continue
    }
    const filtered = keepOnlyInSection(section, keep)
    if (filtered) result.push(filtered)
  }

  return result
}

/**
 * 후보 id 중 실제 스냅샷 섹션에 존재하는 것만 (정규화·중복 제거).
 * 틀린문제만 시작 전에 호출해 빈 세션을 막는다.
 */
export function resolvePresentQuestionIds(
  sections: AssignmentSection[],
  candidateIds: readonly string[],
): string[] {
  const available = new Set(
    listSectionQuestionIds(sections).map(normalizePracticeQuestionId),
  )
  // expand 전 원본 OX만 있어도 :ox:fix 후보를 살릴 수 있게 문법 섹션을 한 번 더 본다
  for (const section of sections) {
    if (section.kind !== 'grammar-type-2') continue
    for (const step of expandGrammarType2Steps(section.questions)) {
      available.add(normalizePracticeQuestionId(step.id))
    }
  }

  const seen = new Set<string>()
  const out: string[] = []
  for (const id of candidateIds) {
    const normalized = normalizePracticeQuestionId(id)
    if (!available.has(normalized) || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }
  return out
}
