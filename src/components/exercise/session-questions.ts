import { BODY_TEXT_A_QUESTIONS } from '../body-text-a/body-text-a'
import { BODY_TEXT_B_QUESTIONS } from '../body-text-b/body-text-b'
import { BODY_TEXT_C_QUESTIONS } from '../body-text-c/body-text-c'
import { GRAMMAR_TYPE_1_QUESTIONS } from '../grammar-type-1/grammar-type-1'
import { GRAMMAR_TYPE_2_QUESTIONS } from '../grammar-type-2/grammar-type-2'
import { WORD_PAIR_COUNT } from '../word-match/word-match'
import { WORD_QUIZ_QUESTIONS } from '../word-quiz/word-quiz'
import { WORD_SPELL_QUESTIONS } from '../word-spell/word-spell'

/** 세션 내 유형별 문제(또는 학습 단계) 수 */
export const SESSION_QUESTION_COUNTS = {
  wordMatch: WORD_PAIR_COUNT,
  wordQuiz: WORD_QUIZ_QUESTIONS.length,
  wordSpell: WORD_SPELL_QUESTIONS.length,
  bodyTextA: BODY_TEXT_A_QUESTIONS.length,
  bodyTextB: BODY_TEXT_B_QUESTIONS.length,
  bodyTextC: BODY_TEXT_C_QUESTIONS.length,
  grammarType1: GRAMMAR_TYPE_1_QUESTIONS.length,
  grammarType2: GRAMMAR_TYPE_2_QUESTIONS.length,
} as const

/** 본문 A+B+C 합계 */
export const BODY_TEXT_TOTAL_QUESTIONS =
  SESSION_QUESTION_COUNTS.bodyTextA +
  SESSION_QUESTION_COUNTS.bodyTextB +
  SESSION_QUESTION_COUNTS.bodyTextC

/** 단어 학습(매칭+퀴즈+철자) 합계 */
export const WORD_SECTION_TOTAL_QUESTIONS =
  SESSION_QUESTION_COUNTS.wordMatch +
  SESSION_QUESTION_COUNTS.wordQuiz +
  SESSION_QUESTION_COUNTS.wordSpell

/** 문법 유형 합계 */
export const GRAMMAR_SECTION_TOTAL_QUESTIONS =
  SESSION_QUESTION_COUNTS.grammarType1 + SESSION_QUESTION_COUNTS.grammarType2

/**
 * 세션 전체 학습 단계 수 (단어 매칭 4쌍 + 퀴즈 4 + 철자 4 + 본문 12 + 문법 5)
 */
export const SESSION_TOTAL_STEPS = Object.values(SESSION_QUESTION_COUNTS).reduce(
  (sum, count) => sum + count,
  0,
)

/** 각 유형 시작 전 완료된 문제 수 (0-based offset) */
export const SESSION_SECTION_OFFSETS = {
  wordMatch: 0,
  wordQuiz: SESSION_QUESTION_COUNTS.wordMatch,
  wordSpell:
    SESSION_QUESTION_COUNTS.wordMatch + SESSION_QUESTION_COUNTS.wordQuiz,
  bodyTextA:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordQuiz +
    SESSION_QUESTION_COUNTS.wordSpell,
  bodyTextB:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordQuiz +
    SESSION_QUESTION_COUNTS.wordSpell +
    SESSION_QUESTION_COUNTS.bodyTextA,
  bodyTextC:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordQuiz +
    SESSION_QUESTION_COUNTS.wordSpell +
    SESSION_QUESTION_COUNTS.bodyTextA +
    SESSION_QUESTION_COUNTS.bodyTextB,
  grammarType1:
    SESSION_QUESTION_COUNTS.wordMatch +
    SESSION_QUESTION_COUNTS.wordQuiz +
    SESSION_QUESTION_COUNTS.wordSpell +
    SESSION_QUESTION_COUNTS.bodyTextA +
    SESSION_QUESTION_COUNTS.bodyTextB +
    SESSION_QUESTION_COUNTS.bodyTextC,
  grammarType2:
    SESSION_QUESTION_COUNTS.wordMatch +
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
): number {
  return (sectionOffset + completedInSection) / SESSION_TOTAL_STEPS
}
