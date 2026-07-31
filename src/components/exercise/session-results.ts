import { BODY_TEXT_A_QUESTIONS, type BodyTextAQuestion } from '../body-text-a/body-text-a'
import { BODY_TEXT_B_QUESTIONS, type BodyTextBQuestion } from '../body-text-b/body-text-b'
import { BODY_TEXT_C_QUESTIONS, type BodyTextCQuestion } from '../body-text-c/body-text-c'
import {
  GRAMMAR_TYPE_1_QUESTIONS,
  type GrammarType1Question,
} from '../grammar-type-1/grammar-type-1'
import {
  expandGrammarType2Steps,
  GRAMMAR_TYPE_2_QUESTIONS,
  GRAMMAR_TYPE_2_X_ASSET,
  GRAMMAR_TYPE_2_X_OPTION_BOXES,
  type GrammarType2Question,
} from '../grammar-type-2/grammar-type-2'
import { type WordPairId } from '../word-match/word-match'
import { WORD_QUIZ_QUESTIONS, type WordQuizQuestion } from '../word-quiz/word-quiz'
import { WORD_SPELL_QUESTIONS, type WordSpellQuestion } from '../word-spell/word-spell'
import { SESSION_TOTAL_STEPS } from './session-questions'

export type SessionResults = Record<string, boolean>

export type RetrySection =
  | 'word-match'
  | 'word-listen-match'
  | 'word-quiz'
  | 'word-spell'
  | 'body-text-a'
  | 'body-text-b'
  | 'body-text-c'
  | 'grammar-type-1'
  | 'grammar-type-2'

export const WORD_MATCH_PAIR_IDS: WordPairId[] = []

/** 데모 세션용 — 과제 러너는 snapshot pairs 사용 */
export const WORD_LISTEN_MATCH_PAIR_IDS: WordPairId[] = []

export const RETRY_SECTION_ORDER: RetrySection[] = [
  'word-match',
  'word-listen-match',
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

export function sessionWordListenMatchId(pairId: string) {
  return `word-listen-match:${pairId}`
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
    ...WORD_LISTEN_MATCH_PAIR_IDS.map(sessionWordListenMatchId),
    ...WORD_QUIZ_QUESTIONS.map((question) => sessionWordQuizId(question.id)),
    ...WORD_SPELL_QUESTIONS.map((question) => sessionWordSpellId(question.id)),
    ...BODY_TEXT_A_QUESTIONS.map((question) => sessionBodyTextAId(question.id)),
    ...BODY_TEXT_B_QUESTIONS.map((question) => sessionBodyTextBId(question.id)),
    ...BODY_TEXT_C_QUESTIONS.map((question) => sessionBodyTextCId(question.id)),
    ...GRAMMAR_TYPE_1_QUESTIONS.map((question) => question.id),
    ...expandGrammarType2Steps(GRAMMAR_TYPE_2_QUESTIONS).map(
      (question) => question.id,
    ),
  ]
}

export { SESSION_TOTAL_STEPS }

export function countSessionCorrect(results: SessionResults): number {
  return getAllSessionStepIds().filter((id) => results[id] === true).length
}

export function countSessionWrong(results: SessionResults): number {
  return getAllSessionStepIds().filter((id) => results[id] === false).length
}

/** 완료 화면용 — 세션 문항 목록 기준으로 점수·요약 산출 */
export function summarizeSessionResults(results: SessionResults): {
  correctCount: number
  wrongCount: number
  totalCount: number
  score: number
} {
  const ids = getAllSessionStepIds()
  let correctCount = 0
  let wrongCount = 0
  for (const id of ids) {
    if (results[id] === true) correctCount += 1
    else if (results[id] === false) wrongCount += 1
  }
  const totalCount = ids.length
  const score =
    totalCount <= 0 ? 0 : Math.round((correctCount / totalCount) * 100)
  return { correctCount, wrongCount, totalCount, score }
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
    case 'word-listen-match':
      return WORD_LISTEN_MATCH_PAIR_IDS.some(
        (id) => results[sessionWordListenMatchId(id)] === false,
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
      return expandGrammarType2Steps(GRAMMAR_TYPE_2_QUESTIONS).some(
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

export function getWrongWordListenMatchPairIds(
  results: SessionResults,
): WordPairId[] {
  return WORD_LISTEN_MATCH_PAIR_IDS.filter(
    (id) => results[sessionWordListenMatchId(id)] === false,
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
  const wrong: GrammarType2Question[] = []

  for (const question of GRAMMAR_TYPE_2_QUESTIONS) {
    if (question.kind === 'word-choice') {
      if (results[question.id] === false) wrong.push(question)
      continue
    }

    const oxWrong = results[question.id] === false
    const fixId = `${question.id}:fix`
    const fixWrong = Boolean(question.xCorrection) && results[fixId] === false
    const fixPassed = results[fixId] === true

    if (oxWrong) {
      // 교정까지 이미 맞춘 경우 OX만 재시도, 아니면 xCorrection 유지해 유형2정답X로 이어짐
      wrong.push(
        fixPassed && question.xCorrection
          ? { ...question, xCorrection: undefined }
          : question,
      )
    } else if (fixWrong && question.xCorrection) {
      const fix = question.xCorrection
      wrong.push({
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

  return wrong
}

/** 오답만 풀기 — 섹션 진입 시점의 오답 목록 (풀이 중 결과 갱신으로 목록이 비는 것 방지) */
export type RetrySectionSnapshot =
  | { section: 'word-match'; pairIds: WordPairId[] }
  | { section: 'word-listen-match'; pairIds: WordPairId[] }
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
    case 'word-listen-match':
      return { section, pairIds: getWrongWordListenMatchPairIds(results) }
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
