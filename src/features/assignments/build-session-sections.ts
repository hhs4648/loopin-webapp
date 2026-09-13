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

/**
 * 유형1(이지선다) — **유형2(OX)와 완전히 별개인 유형**이다. 3지선다는 여기 안 쓴다.
 *
 * 보기는 `twoChoices`(정답이 앞). 빈칸 자리는 O/X로 갈린다:
 * **O는 맞는 문장이라 정답이 문장에 그대로 있고, X는 틀린 문장이라 「틀린 부분」이 있다.**
 * 그래서 X 문항은 틀린 자리를 비우고 정답을 고르게 한다.
 */
function buildGrammarType1Sections(snapshot: ContentSnapshot): AssignmentSection[] {
  if (!snapshot.problemTypes.grammar.includes('선택형 문제')) return []

  const twoOption: GrammarType1Question[] = []

  for (const grammar of snapshot.grammar) {
    const choices = parseGrammarChoices(grammar.twoChoices)
    // 2026-09 이전 스냅샷에는 `twoChoices`가 없다 — 없으면 만들지 않는다.
    if (choices.length !== 2) continue

    const correct = choices[0]!
    const ox = grammar.ox?.trim().toUpperCase()
    const target = ox === 'X' ? grammar.wrongPart?.trim() : correct
    if (!target || target === '-') continue

    const english = stripBrackets(grammar.english)
    const blank =
      blankFromBrackets(grammar.english) ?? findBlank(english, target)
    if (!blank) continue

    const options = shuffle(choices).map((label, index) => ({
      id: `${grammar.id}:opt:${index}:${label}`,
      label,
    }))
    const correctOption = options.find((option) => option.label === correct)
    if (!correctOption) continue

    twoOption.push({
      id: `${grammar.id}:choice`,
      maskPassage: true,
      passageBefore: blank.before.trimEnd(),
      passageAfter: blank.after.trimStart(),
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

type Blank = { before: string; matched: string; after: string }

/**
 * 문장에 `[ ]`로 자리가 찍혀 있으면 그걸 따른다 — 단어 예문 빈칸과 같은 표기.
 * 같은 표현이 문장에 두 번 나와 규칙으로는 못 가리는 문항을 이걸로 해결한다
 * (`She gave me not only advice but also [gave] money.`).
 */
function blankFromBrackets(english: string): Blank | null {
  const hits = [...english.matchAll(/\[([^\]]+)\]/g)]
  if (hits.length !== 1) return null
  const hit = hits[0]!
  const at = hit.index
  return {
    before: stripBrackets(english.slice(0, at)),
    matched: hit[1]!.trim(),
    after: stripBrackets(english.slice(at + hit[0].length)),
  }
}

/**
 * 문장에서 빈칸 자리를 찾는다 — **단어 경계**로만 본다.
 * `indexOf`를 쓰면 `What a exciting game`의 `a`가 `Wh[a]t`에 걸린다.
 * 대소문자는 무시한다(`nothing exciting` ↔ 문장 첫 단어 `Nothing exciting`).
 * 같은 표현이 두 번 나오면 어느 쪽이 문제의 자리인지 못 가리므로 만들지 않는다 —
 * 틀린 문제를 보여주느니 안 내는 게 낫다. 그런 문항은 문장에 `[ ]`를 찍어 주면 된다.
 */
function findBlank(english: string, target: string): Blank | null {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const hits = [
    ...english.matchAll(new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, 'gi')),
  ]
  if (hits.length !== 1) return null
  const at = hits[0]!.index
  return {
    before: english.slice(0, at),
    matched: english.slice(at, at + target.length),
    after: english.slice(at + target.length),
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

  const blank = blankFromBrackets(grammar.english) ?? findBlank(english, target)
  if (!blank) return undefined

  const { before, matched: matchedPart, after } = blank

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
