import type { BodyTextAQuestion } from '../../components/body-text-a/body-text-a'
import type { BodyTextBQuestion } from '../../components/body-text-b/body-text-b'
import { normalizeBodyTextBChunk } from '../../components/body-text-b/body-text-b'
import type { BodyTextCQuestion } from '../../components/body-text-c/body-text-c'
import type { GrammarType1Question } from '../../components/grammar-type-1/grammar-type-1'
import {
  countGrammarType2Steps,
  expandGrammarType2Steps,
  type GrammarType2Question,
} from '../../components/grammar-type-2/grammar-type-2'
import type { WordMatchPair } from '../../components/word-match/word-match'
import { PAGE_SIZE as MATCH_PAGE_SIZE } from '../../components/word-match/word-match'
import type { WordQuizQuestion } from '../../components/word-quiz/word-quiz'
import type { WordSpellQuestion } from '../../components/word-spell/word-spell'
import type { ContentSnapshot, ProblemGrammarSnapshot } from '../../lib/sync/types'
import { refineSparseChunks } from './refine-body-chunks'

export type AssignmentSection =
  | { kind: 'word-match'; id: string; pairs: WordMatchPair[]; fillPool: WordMatchPair[] }
  | {
      kind: 'word-listen-match'
      id: string
      pairs: WordMatchPair[]
      fillPool: WordMatchPair[]
    }
  | { kind: 'word-quiz'; id: string; questions: WordQuizQuestion[] }
  | { kind: 'word-spell'; id: string; questions: WordSpellQuestion[] }
  | { kind: 'body-text-a'; id: string; questions: BodyTextAQuestion[] }
  | { kind: 'body-text-b'; id: string; questions: BodyTextBQuestion[] }
  | { kind: 'body-text-c'; id: string; questions: BodyTextCQuestion[] }
  | { kind: 'grammar-type-1'; id: string; questions: GrammarType1Question[] }
  | { kind: 'grammar-type-2'; id: string; questions: GrammarType2Question[] }

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j]!, next[i]!]
  }
  return next
}

function stripBrackets(text: string): string {
  return text
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\s*\/\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitChunks(text: string | undefined, fallback: string): string[] {
  const source = text?.includes('/') ? text : fallback
  if (source.includes('/')) {
    return source
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)
  }
  return stripBrackets(source)
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function extractCloze(example: string | undefined) {
  if (!example) return null
  const match = example.match(/\[([^\]]+)\]/)
  if (!match?.[1]) return null
  const [before, after = ''] = example.split(match[0])
  return {
    englishBefore: before ?? '',
    englishAfter: after,
    answer: match[1].trim(),
  }
}

function chunkPages<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return []
  const pages: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size))
  }
  return pages
}

/**
 * 마지막 페이지가 4짝보다 적게 나오면, WordMatchScreen이 같은 과제(fillPool)에서
 * 랜덤으로 짝을 더 뽑아 4짝을 채운다. 데모 단어는 사용하지 않는다.
 * @see fillMatchPage / pickNextPage in word-match.ts
 */

function buildWordMatchSections(snapshot: ContentSnapshot): AssignmentSection[] {
  if (!snapshot.problemTypes.words.includes('짝맞추기')) return []

  const pairs: WordMatchPair[] = shuffle(
    snapshot.words
      .filter((word) => word.english.trim() && word.korean.trim())
      .map((word) => ({
        id: `${word.id}:match`,
        english: word.english.trim(),
        korean: word.korean.trim(),
      })),
  )

  // pairs = 이번 페이지 필수 짝만 (채움은 WordMatchScreen이 fillPool로 처리)
  return chunkPages(pairs, MATCH_PAGE_SIZE).map((page, index) => ({
    kind: 'word-match' as const,
    id: `word-match:${index}`,
    pairs: page,
    fillPool: pairs,
  }))
}

function isWordListenMatchType(label: string) {
  return (
    label === '음성 짝맞추기' ||
    label === 'TTS 뜻 짝맞추기' ||
    label === '듣기 짝맞추기' ||
    label.includes('음성 짝맞추기') ||
    label.includes('TTS 뜻 짝맞추기')
  )
}

function buildWordListenMatchSections(
  snapshot: ContentSnapshot,
): AssignmentSection[] {
  if (!snapshot.problemTypes.words.some(isWordListenMatchType)) return []

  const pairs: WordMatchPair[] = shuffle(
    snapshot.words
      .filter((word) => word.english.trim() && word.korean.trim())
      .map((word) => ({
        id: `${word.id}:listen`,
        english: word.english.trim(),
        korean: word.korean.trim(),
      })),
  )

  return chunkPages(pairs, MATCH_PAGE_SIZE).map((page, index) => ({
    kind: 'word-listen-match' as const,
    id: `word-listen-match:${index}`,
    pairs: page,
    fillPool: pairs,
  }))
}

/** 정답을 1·2·3번 중 균등 위치에 두고 오답 2개 채움 */
function buildThreeChoices(
  correct: string,
  distractorPool: string[],
): string[] | null {
  const unique = [
    ...new Set(distractorPool.filter((item) => item && item !== correct)),
  ]
  if (unique.length < 2) return null

  const distractors = shuffle(unique).slice(0, 2)
  const slot = Math.floor(Math.random() * 3)
  const options = [...distractors]
  options.splice(slot, 0, correct)
  return options
}

function buildWordQuizSections(snapshot: ContentSnapshot): AssignmentSection[] {
  if (!snapshot.problemTypes.words.includes('3지선다')) return []

  const questions: WordQuizQuestion[] = []
  for (const word of snapshot.words) {
    const distractors = snapshot.words
      .filter((other) => other.id !== word.id && other.korean.trim())
      .map((other) => other.korean.trim())
    const options = buildThreeChoices(word.korean, distractors)
    if (!options) continue
    questions.push({
      id: `${word.id}:choice`,
      word: word.english,
      correctAnswer: word.korean,
      options,
    })
  }

  const shuffledQuestions = shuffle(questions)
  return shuffledQuestions.length
    ? [{ kind: 'word-quiz', id: 'word-quiz', questions: shuffledQuestions }]
    : []
}

function buildWordSpellSections(snapshot: ContentSnapshot): AssignmentSection[] {
  if (!snapshot.problemTypes.words.includes('예문 빈칸')) return []

  const questions: WordSpellQuestion[] = []
  for (const word of snapshot.words) {
    const cloze = extractCloze(word.exampleEn)
    if (!cloze) continue
    questions.push({
      id: `${word.id}:spell`,
      korean: word.exampleKo || word.korean,
      englishBefore: cloze.englishBefore,
      englishAfter: cloze.englishAfter,
      answer: cloze.answer,
      answerHint: `${cloze.answer}(${word.korean})`,
    })
  }

  return questions.length
    ? [{ kind: 'word-spell', id: 'word-spell', questions: shuffle(questions) }]
    : []
}

function buildBodyASections(snapshot: ContentSnapshot): AssignmentSection[] {
  if (!snapshot.problemTypes.sentences.includes('번역 배열')) return []

  const questions: BodyTextAQuestion[] = []
  for (const sentence of snapshot.sentences) {
    const segments = refineSparseChunks(
      splitChunks(sentence.chunksKo, sentence.korean),
      { lang: 'ko' },
    )
    if (segments.length < 2) continue
    questions.push({
      id: `${sentence.id}:translate`,
      exampleEn: stripBrackets(sentence.english),
      exampleKo: stripBrackets(sentence.korean),
      segments,
    })
  }

  return questions.length
    ? [{ kind: 'body-text-a', id: 'body-text-a', questions: shuffle(questions) }]
    : []
}

function buildBodyBSections(snapshot: ContentSnapshot): AssignmentSection[] {
  if (!snapshot.problemTypes.sentences.includes('청크배열')) return []

  const questions: BodyTextBQuestion[] = []
  for (const sentence of snapshot.sentences) {
    const segments = refineSparseChunks(
      splitChunks(sentence.chunksEn, sentence.english),
      { lang: 'en' },
    )
      .map(normalizeBodyTextBChunk)
      .filter(Boolean)
    if (segments.length < 2) continue
    questions.push({
      id: `${sentence.id}:chunk`,
      promptKo: stripBrackets(sentence.korean),
      exampleEn: stripBrackets(sentence.english),
      segments,
    })
  }

  return questions.length
    ? [{ kind: 'body-text-b', id: 'body-text-b', questions: shuffle(questions) }]
    : []
}

function buildBodyCSections(snapshot: ContentSnapshot): AssignmentSection[] {
  if (!snapshot.problemTypes.sentences.includes('영작')) return []

  const questions: BodyTextCQuestion[] = []
  for (const sentence of snapshot.sentences) {
    // 한글 지문·영어 정답이 없으면 문제로 만들지 않는다 (빈 문제를 내느니 안 내는 게 낫다).
    // 교사측 content-snapshot.ts에서 korean이 빈 문자열로 넘어올 수 있다.
    const promptKo = stripBrackets(sentence.korean)
    const exampleEn = stripBrackets(sentence.english)
    if (!promptKo || !exampleEn) continue

    const keywords = sentence.hint
      ? sentence.hint
          .split(/[,/]/)
          .map((part) => part.trim())
          .filter(Boolean)
          .slice(0, 3)
      : splitChunks(sentence.chunksEn, sentence.english).slice(0, 3)
    const fallbackKeyword = exampleEn.split(/\s+/).filter(Boolean)[0]
    const resolvedKeywords =
      keywords.length > 0 ? keywords : fallbackKeyword ? [fallbackKeyword] : []
    if (resolvedKeywords.length === 0) continue

    questions.push({
      id: `${sentence.id}:write`,
      promptKo,
      keywords: resolvedKeywords,
      exampleEn,
    })
  }

  return questions.length
    ? [{ kind: 'body-text-c', id: 'body-text-c', questions: shuffle(questions) }]
    : []
}

function buildGrammarType1Sections(snapshot: ContentSnapshot): AssignmentSection[] {
  if (!snapshot.problemTypes.grammar.includes('선택형 문제')) return []

  const twoOption: GrammarType1Question[] = []

  for (const grammar of snapshot.grammar) {
    const choices = parseGrammarChoices(grammar.choices)
    const target = grammar.wrongPart?.trim()
    if (
      choices.length < 2 ||
      !target ||
      target === '-' ||
      !grammar.english.includes(target)
    ) {
      continue
    }

    // 3지선다(선택지 3개+)는 OX 정답 X 교정에서만 출제.
    // 여기서 grammar-type-2 섹션을 따로 만들면 X 교정 UI가 한 번 더 나와 "B유형이 따로" 보인다.
    if (choices.length !== 2) continue

    const parts = splitAtFirst(grammar.english, target)
    if (!parts) continue
    const correct = choices[0]!
    const options = shuffle(choices).map((label, index) => ({
      id: `${grammar.id}:opt:${index}:${label}`,
      label,
    }))
    const correctOption = options.find((option) => option.label === correct)
    if (!correctOption) continue

    twoOption.push({
      id: `${grammar.id}:choice`,
      maskPassage: true,
      passageBefore: parts.before.trimEnd(),
      passageAfter: parts.after.trimStart(),
      options,
      correctOptionId: correctOption.id,
    })
  }

  return twoOption.length
    ? [
        {
          kind: 'grammar-type-1',
          id: 'grammar-type-1',
          questions: shuffle(twoOption),
        },
      ]
    : []
}

/**
 * target이 처음 나오는 위치에서만 앞뒤로 나눈다.
 * String.split(target)은 target이 두 번 이상 나오면 세 번째 조각부터 버려져
 * 학생에게 뒷부분이 잘린 문장이 보인다.
 */
function splitAtFirst(
  text: string,
  target: string,
): { before: string; after: string } | null {
  const index = text.indexOf(target)
  if (index < 0) return null
  return {
    before: text.slice(0, index),
    after: text.slice(index + target.length),
  }
}

function parseGrammarChoices(choices: string | undefined): string[] {
  return (choices ?? '')
    .split(/[|/,，、]/)
    .map((choice) => choice.trim())
    .filter((choice) => choice && choice !== '-')
}

/** OX 정답이 X일 때 — wrongPart + 3지선다로 교정 스텝 생성 */
function buildOxXCorrection(grammar: ProblemGrammarSnapshot) {
  const target = grammar.wrongPart?.trim()
  const english = stripBrackets(grammar.english)
  if (!target || target === '-') return undefined

  const targetIndex = english.toLowerCase().indexOf(target.toLowerCase())
  if (targetIndex < 0) return undefined

  const matchedPart = english.slice(targetIndex, targetIndex + target.length)
  const before = english.slice(0, targetIndex)
  const after = english.slice(targetIndex + target.length)

  const choices = parseGrammarChoices(grammar.choices)
  // 3지선다 — 선택지 3개 미만이면 교정 문항을 만들지 않음
  if (choices.length < 3) return undefined

  const correct = choices[0]!
  const options = shuffle(choices.slice(0, 3)).map((label, index) => ({
    id: `${grammar.id}:ox-fix:${index}:${label}`,
    label,
  }))
  const correctOption = options.find((option) => option.label === correct)
  if (!correctOption) return undefined

  return {
    wrongPart: matchedPart,
    passageBefore: before.trimEnd(),
    passageAfter: after.trimStart(),
    options,
    correctOptionId: correctOption.id,
  }
}

function buildGrammarOxSections(snapshot: ContentSnapshot): AssignmentSection[] {
  if (!snapshot.problemTypes.grammar.includes('OX문제')) return []

  const questions: GrammarType2Question[] = []
  for (const grammar of snapshot.grammar) {
    const ox = grammar.ox?.trim().toUpperCase()
    if (ox !== 'O' && ox !== 'X') continue

    const correctOptionId = ox === 'O' ? 'o' : 'x'
    questions.push({
      kind: 'ox',
      id: `${grammar.id}:ox`,
      maskPassage: true,
      passageLines: [stripBrackets(grammar.english)],
      correctOptionId,
      xCorrection:
        correctOptionId === 'x' ? buildOxXCorrection(grammar) : undefined,
    })
  }

  return questions.length
    ? [
        {
          kind: 'grammar-type-2',
          id: 'grammar-type-2-ox',
          questions: shuffle(questions),
        },
      ]
    : []
}

/** Convert teacher content snapshot into ordered existing Figma UI sections. */
export function buildAssignmentSections(
  snapshot: ContentSnapshot,
): AssignmentSection[] {
  return [
    ...buildWordMatchSections(snapshot),
    ...buildWordListenMatchSections(snapshot),
    ...buildWordQuizSections(snapshot),
    ...buildWordSpellSections(snapshot),
    ...buildBodyASections(snapshot),
    ...buildBodyBSections(snapshot),
    ...buildBodyCSections(snapshot),
    ...buildGrammarOxSections(snapshot),
    ...buildGrammarType1Sections(snapshot),
  ]
}

export function countSectionQuestions(sections: AssignmentSection[]): number {
  return sections.reduce((total, section) => {
    switch (section.kind) {
      case 'word-match':
      case 'word-listen-match':
        return total + section.pairs.length
      case 'word-quiz':
      case 'word-spell':
      case 'body-text-a':
      case 'body-text-b':
      case 'body-text-c':
      case 'grammar-type-1':
        return total + section.questions.length
      case 'grammar-type-2':
        return total + countGrammarType2Steps(section.questions)
    }
  }, 0)
}

export function listSectionQuestionIds(sections: AssignmentSection[]): string[] {
  return sections.flatMap((section) => {
    switch (section.kind) {
      case 'word-match':
      case 'word-listen-match':
        return section.pairs.map((pair) => pair.id)
      case 'word-quiz':
      case 'word-spell':
      case 'body-text-a':
      case 'body-text-b':
      case 'body-text-c':
      case 'grammar-type-1':
        return section.questions.map((question) => question.id)
      case 'grammar-type-2':
        return expandGrammarType2Steps(section.questions).map(
          (question) => question.id,
        )
    }
  })
}
