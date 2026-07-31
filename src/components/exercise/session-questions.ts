import { BODY_TEXT_A_QUESTIONS } from '../body-text-a/body-text-a'
import { BODY_TEXT_B_QUESTIONS } from '../body-text-b/body-text-b'
import { BODY_TEXT_C_QUESTIONS } from '../body-text-c/body-text-c'
import { GRAMMAR_TYPE_1_QUESTIONS } from '../grammar-type-1/grammar-type-1'
import {
  countGrammarType2Steps,
  GRAMMAR_TYPE_2_QUESTIONS,
} from '../grammar-type-2/grammar-type-2'
import { WORD_QUIZ_QUESTIONS } from '../word-quiz/word-quiz'
import { WORD_SPELL_QUESTIONS } from '../word-spell/word-spell'

/** 세션 내 유형별 문제(또는 학습 단계) 수 */
export const SESSION_QUESTION_COUNTS = {
  wordMatch: 0,
  wordListenMatch: 0,
  wordQuiz: WORD_QUIZ_QUESTIONS.length,
  wordSpell: WORD_SPELL_QUESTIONS.length,
  bodyTextA: BODY_TEXT_A_QUESTIONS.length,
  bodyTextB: BODY_TEXT_B_QUESTIONS.length,
  bodyTextC: BODY_TEXT_C_QUESTIONS.length,
  grammarType1: GRAMMAR_TYPE_1_QUESTIONS.length,
  grammarType2: countGrammarType2Steps(GRAMMAR_TYPE_2_QUESTIONS),
} as const

/** 본문 A+B+C 합계 */
export const BODY_TEXT_TOTAL_QUESTIONS =
  SESSION_QUESTION_COUNTS.bodyTextA +
  SESSION_QUESTION_COUNTS.bodyTextB +
  SESSION_QUESTION_COUNTS.bodyTextC

/** 단어 학습(A 짝맞추기 + B TTS 짝맞추기 + C 퀴즈 + D 철자) 합계 */
export const WORD_SECTION_TOTAL_QUESTIONS =
  SESSION_QUESTION_COUNTS.wordMatch +
  SESSION_QUESTION_COUNTS.wordListenMatch +
  SESSION_QUESTION_COUNTS.wordQuiz +
  SESSION_QUESTION_COUNTS.wordSpell

/** 문법 유형 합계 */
export const GRAMMAR_SECTION_TOTAL_QUESTIONS =
  SESSION_QUESTION_COUNTS.grammarType1 + SESSION_QUESTION_COUNTS.grammarType2

/** 세션 전체 학습 단계 수 */
export const SESSION_TOTAL_STEPS = Object.values(SESSION_QUESTION_COUNTS).reduce(
  (sum, count) => sum + count,
  0,
)

/** 각 유형 시작 시 완료된 문제 수 (0-based offset) */
export const SESSION_SECTION_OFFSETS = {
  wordMatch: 0,
  wordListenMatch: SESSION_QUESTION_COUNTS.wordMatch,
  wordQuiz:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordListenMatch,
  wordSpell:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordListenMatch +
    SESSION_QUESTION_COUNTS.wordQuiz,
  bodyTextA:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordListenMatch +
    SESSION_QUESTION_COUNTS.wordQuiz +
    SESSION_QUESTION_COUNTS.wordSpell,
  bodyTextB:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordListenMatch +
    SESSION_QUESTION_COUNTS.wordQuiz +
    SESSION_QUESTION_COUNTS.wordSpell +
    SESSION_QUESTION_COUNTS.bodyTextA,
  bodyTextC:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordListenMatch +
    SESSION_QUESTION_COUNTS.wordQuiz +
    SESSION_QUESTION_COUNTS.wordSpell +
    SESSION_QUESTION_COUNTS.bodyTextA +
    SESSION_QUESTION_COUNTS.bodyTextB,
  grammarType1:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordListenMatch +
    SESSION_QUESTION_COUNTS.wordQuiz +
    SESSION_QUESTION_COUNTS.wordSpell +
    SESSION_QUESTION_COUNTS.bodyTextA +
    SESSION_QUESTION_COUNTS.bodyTextB +
    SESSION_QUESTION_COUNTS.bodyTextC,
  grammarType2:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordListenMatch +
    SESSION_QUESTION_COUNTS.wordQuiz +
    SESSION_QUESTION_COUNTS.wordSpell +
    SESSION_QUESTION_COUNTS.bodyTextA +
    SESSION_QUESTION_COUNTS.bodyTextB +
    SESSION_QUESTION_COUNTS.bodyTextC +
    SESSION_QUESTION_COUNTS.grammarType1,
} as const

/** 현재 유형에서 완료한 문제 수 → 세션 전체 진행률 (0~1) */
export function getSessionProgressRatio(
  sectionOffset: number,
  completedInSection: number,
  totalSteps: number = SESSION_TOTAL_STEPS,
): number {
  if (totalSteps <= 0) return 0
  return Math.min(1, (sectionOffset + completedInSection) / totalSteps)
}

/** 데모 1회차 세션 step (빈 섹션 제외하고 시작점 결정) */
export type DemoSessionStartStep =
  | 'word-match'
  | 'word-listen-match'
  | 'word-quiz'
  | 'word-spell'
  | 'body-text-a'
  | 'body-text-b'
  | 'body-text-c'
  | 'grammar-type-1'
  | 'grammar-type-2'

/**
 * 문제가 1개 이상 있는 첫 섹션.
 * word-match/listen이 0개면 퀴즈부터 — 재도전 시 빈 화면에 멈추지 않게.
 */
export function resolveDemoSessionStartStep(): DemoSessionStartStep {
  const order: Array<{ step: DemoSessionStartStep; count: number }> = [
    { step: 'word-match', count: SESSION_QUESTION_COUNTS.wordMatch },
    { step: 'word-listen-match', count: SESSION_QUESTION_COUNTS.wordListenMatch },
    { step: 'word-quiz', count: SESSION_QUESTION_COUNTS.wordQuiz },
    { step: 'word-spell', count: SESSION_QUESTION_COUNTS.wordSpell },
    { step: 'body-text-a', count: SESSION_QUESTION_COUNTS.bodyTextA },
    { step: 'body-text-b', count: SESSION_QUESTION_COUNTS.bodyTextB },
    { step: 'body-text-c', count: SESSION_QUESTION_COUNTS.bodyTextC },
    { step: 'grammar-type-1', count: SESSION_QUESTION_COUNTS.grammarType1 },
    { step: 'grammar-type-2', count: SESSION_QUESTION_COUNTS.grammarType2 },
  ]
  return order.find((entry) => entry.count > 0)?.step ?? 'word-quiz'
}
