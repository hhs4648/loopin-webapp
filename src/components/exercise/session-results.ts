import { BODY_TEXT_A_QUESTIONS, type BodyTextAQuestion } from '../body-text-a/body-text-a'
import { BODY_TEXT_B_QUESTIONS, type BodyTextBQuestion } from '../body-text-b/body-text-b'
import { BODY_TEXT_C_QUESTIONS, type BodyTextCQuestion } from '../body-text-c/body-text-c'
import {
  GRAMMAR_TYPE_1_QUESTIONS,
  type GrammarType1Question,
} from '../grammar-type-1/grammar-type-1'
import {
  GRAMMAR_TYPE_2_QUESTIONS,
  type GrammarType2Question,
} from '../grammar-type-2/grammar-type-2'
import { type WordPairId } from '../word-match/word-match'
import { WORD_QUIZ_QUESTIONS, type WordQuizQuestion } from '../word-quiz/word-quiz'
import { WORD_SPELL_QUESTIONS, type WordSpellQuestion } from '../word-spell/word-spell'
import { SESSION_TOTAL_STEPS } from './session-questions'

export type SessionResults = Record<string, boolean>

export type RetrySection =
  | 'word-match'
  | 'word-quiz'
  | 'word-spell'
  | 'body-text-a'
  | 'body-text-b'
  | 'body-text-c'
  | 'grammar-type-1'
  | 'grammar-type-2'

export const WORD_MATCH_PAIR_IDS: WordPairId[] = [
  'wave',
  'latest',
  'various',
  'run-errands',
]

export const RETRY_SECTION_ORDER: RetrySection[] = [
  'word-match',
  'word-quiz',
  'word-spell',
  'body-text-a',
  'body-text-b',
  'body-text-c',
  'grammar-type-1',
  'grammar-type-2',
]

export function sessionWordMatchId(pairId: string) {
  return `word-match:${pairId}`
}

export function sessionWordQuizId(questionId: string) {
  return `word-quiz:${questionId}`
}

export function sessionWordSpellId(questionId: string) {
  return `word-spell:${questionId}`
}

export function sessionBodyTextAId(questionId: string) {
  return `body-text-a:${questionId}`
}

export function sessionBodyTextBId(questionId: string) {
  return `body-text-b:${questionId}`
}

export function sessionBodyTextCId(questionId: string) {
  return `body-text-c:${questionId}`
}

export function getAllSessionStepIds(): string[] {
  return [
    ...WORD_MATCH_PAIR_IDS.map(sessionWordMatchId),
    ...WORD_QUIZ_QUESTIONS.map((question) => sessionWordQuizId(question.id)),
    ...WORD_SPELL_QUESTIONS.map((question) => sessionWordSpellId(question.id)),
    ...BODY_TEXT_A_QUESTIONS.map((question) => sessionBodyTextAId(question.id)),
    ...BODY_TEXT_B_QUESTIONS.map((question) => sessionBodyTextBId(question.id)),
    ...BODY_TEXT_C_QUESTIONS.map((question) => sessionBodyTextCId(question.id)),
    ...GRAMMAR_TYPE_1_QUESTIONS.map((question) => question.id),
    ...GRAMMAR_TYPE_2_QUESTIONS.map((question) => question.id),
  ]
}

export { SESSION_TOTAL_STEPS }

export function countSessionCorrect(results: SessionResults): number {
  return getAllSessionStepIds().filter((id) => results[id] === true).length
}

export function countSessionWrong(results: SessionResults): number {
  return getAllSessionStepIds().filter((id) => results[id] === false).length
}

export function hasWrongInSection(
  section: RetrySection,
  results: SessionResults,
): boolean {
  switch (section) {
    case 'word-match':
      return WORD_MATCH_PAIR_IDS.some(
        (id) => results[sessionWordMatchId(id)] === false,
      )
    case 'word-quiz':
      return WORD_QUIZ_QUESTIONS.some(
        (question) => results[sessionWordQuizId(question.id)] === false,
      )
    case 'word-spell':
      return WORD_SPELL_QUESTIONS.some(
        (question) => results[sessionWordSpellId(question.id)] === false,
      )
    case 'body-text-a':
      return BODY_TEXT_A_QUESTIONS.some(
        (question) => results[sessionBodyTextAId(question.id)] === false,
      )
    case 'body-text-b':
      return BODY_TEXT_B_QUESTIONS.some(
        (question) => results[sessionBodyTextBId(question.id)] === false,
      )
    case 'body-text-c':
      return BODY_TEXT_C_QUESTIONS.some(
        (question) => results[sessionBodyTextCId(question.id)] === false,
      )
    case 'grammar-type-1':
      return GRAMMAR_TYPE_1_QUESTIONS.some(
        (question) => results[question.id] === false,
      )
    case 'grammar-type-2':
      return GRAMMAR_TYPE_2_QUESTIONS.some(
        (question) => results[question.id] === false,
      )
  }
}

export function getFirstRetrySection(
  results: SessionResults,
): RetrySection | null {
  return (
    RETRY_SECTION_ORDER.find((section) => hasWrongInSection(section, results)) ??
    null
  )
}

export function getNextRetrySectionAfter(
  completedSection: RetrySection,
  results: SessionResults,
): RetrySection | 'grammar-complete' {
  const startIndex = RETRY_SECTION_ORDER.indexOf(completedSection) + 1
  for (let index = startIndex; index < RETRY_SECTION_ORDER.length; index++) {
    const section = RETRY_SECTION_ORDER[index]
    if (hasWrongInSection(section, results)) return section
  }
  return 'grammar-complete'
}

export function isFinalRetrySection(
  section: RetrySection,
  results: SessionResults,
): boolean {
  return getNextRetrySectionAfter(section, results) === 'grammar-complete'
}

export function getWrongWordMatchPairIds(results: SessionResults): WordPairId[] {
  return WORD_MATCH_PAIR_IDS.filter(
    (id) => results[sessionWordMatchId(id)] === false,
  )
}

export function getWrongWordQuizQuestions(results: SessionResults) {
  return WORD_QUIZ_QUESTIONS.filter(
    (question) => results[sessionWordQuizId(question.id)] === false,
  )
}

export function getWrongWordSpellQuestions(results: SessionResults) {
  return WORD_SPELL_QUESTIONS.filter(
    (question) => results[sessionWordSpellId(question.id)] === false,
  )
}

export function getWrongBodyTextAQuestions(results: SessionResults) {
  return BODY_TEXT_A_QUESTIONS.filter(
    (question) => results[sessionBodyTextAId(question.id)] === false,
  )
}

export function getWrongBodyTextBQuestions(results: SessionResults) {
  return BODY_TEXT_B_QUESTIONS.filter(
    (question) => results[sessionBodyTextBId(question.id)] === false,
  )
}

export function getWrongBodyTextCQuestions(results: SessionResults) {
  return BODY_TEXT_C_QUESTIONS.filter(
    (question) => results[sessionBodyTextCId(question.id)] === false,
  )
}

export function getWrongGrammarType1Questions(results: SessionResults) {
  return GRAMMAR_TYPE_1_QUESTIONS.filter(
    (question) => results[question.id] === false,
  )
}

export function getWrongGrammarType2Questions(results: SessionResults) {
  return GRAMMAR_TYPE_2_QUESTIONS.filter(
    (question) => results[question.id] === false,
  )
}

/** 오답만 풀기 — 섹션 진입 시점의 오답 목록 (풀이 중 결과 갱신으로 목록이 비는 것 방지) */
export type RetrySectionSnapshot =
  | { section: 'word-match'; pairIds: WordPairId[] }
  | { section: 'word-quiz'; questions: WordQuizQuestion[] }
  | { section: 'word-spell'; questions: WordSpellQuestion[] }
  | { section: 'body-text-a'; questions: BodyTextAQuestion[] }
  | { section: 'body-text-b'; questions: BodyTextBQuestion[] }
  | { section: 'body-text-c'; questions: BodyTextCQuestion[] }
  | { section: 'grammar-type-1'; questions: GrammarType1Question[] }
  | { section: 'grammar-type-2'; questions: GrammarType2Question[] }

export function buildRetrySectionSnapshot(
  section: RetrySection,
  results: SessionResults,
): RetrySectionSnapshot {
  switch (section) {
    case 'word-match':
      return { section, pairIds: getWrongWordMatchPairIds(results) }
    case 'word-quiz':
      return { section, questions: getWrongWordQuizQuestions(results) }
    case 'word-spell':
      return { section, questions: getWrongWordSpellQuestions(results) }
    case 'body-text-a':
      return { section, questions: getWrongBodyTextAQuestions(results) }
    case 'body-text-b':
      return { section, questions: getWrongBodyTextBQuestions(results) }
    case 'body-text-c':
      return { section, questions: getWrongBodyTextCQuestions(results) }
    case 'grammar-type-1':
      return { section, questions: getWrongGrammarType1Questions(results) }
    case 'grammar-type-2':
      return { section, questions: getWrongGrammarType2Questions(results) }
  }
}
