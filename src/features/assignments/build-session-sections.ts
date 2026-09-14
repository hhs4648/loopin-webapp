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

/**
 * 단어는 **4개씩 한 세트**로 묶어, 그 세트로 켜진 유형을 다 돌고 다음 세트로 넘어간다.
 *
 *   [1~4단어] 짝맞추기 → TTS → 3지선다 → 예문 빈칸
 *   [5~8단어] 짝맞추기 → TTS → 3지선다 → 예문 빈칸 …
 *
 * 유형별로 전부 몰아서 내면(예전 방식) 20단어 과제에서 짝맞추기만 5판을 내리 풀게 된다.
 * 같은 4단어를 네 방식으로 연달아 만나야 그 자리에서 외워진다.
 *
 * **단어 순서는 맨 앞에서 한 번만 섞는다** — 유형마다 따로 섞으면 짝맞추기 1판과
 * TTS 1판의 단어가 달라져 세트가 성립하지 않는다. 세트 안에서 문제 순서만 다시 섞는다.
 *
 * 마지막 세트가 4개가 안 될 때: 짝맞추기·TTS는 화면이 4짝을 요구하므로 `fillPool`에서
 * 다른 단어를 끌어와 채우고(`fillMatchPage` in word-match.ts), 3지선다·예문 빈칸은
 * **그 세트의 단어만** 낸다. 채움 단어까지 다시 물으면 같은 단어를 두 번 푸는 꼴이 된다.
 */
/** 한 세트에 담는 문항 수. 짝맞추기 화면이 4짝이라 그 숫자를 그대로 쓴다. */
const SET_SIZE = MATCH_PAGE_SIZE

function isWordListenMatchType(label: string) {
  return (
    label === '음성 짝맞추기' ||
    label === 'TTS 뜻 짝맞추기' ||
    label === '듣기 짝맞추기' ||
    label.includes('음성 짝맞추기') ||
    label.includes('TTS 뜻 짝맞추기')
  )
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

function buildWordSections(snapshot: ContentSnapshot): AssignmentSection[] {
  const types = snapshot.problemTypes.words
  const wantMatch = types.includes('짝맞추기')
  const wantListen = types.some(isWordListenMatchType)
  const wantQuiz = types.includes('3지선다')
  const wantSpell = types.includes('예문 빈칸')
  if (!wantMatch && !wantListen && !wantQuiz && !wantSpell) return []

  const words = shuffle(
    snapshot.words.filter((word) => word.english.trim() && word.korean.trim()),
  )
  if (!words.length) return []

  const toPair = (word: (typeof words)[number], suffix: string): WordMatchPair => ({
    id: `${word.id}:${suffix}`,
    english: word.english.trim(),
    korean: word.korean.trim(),
  })
  /* 채움용 풀은 과제 전체 — 마지막 세트가 4짝이 안 될 때만 쓰인다 */
  const matchPool = words.map((word) => toPair(word, 'match'))
  const listenPool = words.map((word) => toPair(word, 'listen'))

  const sections: AssignmentSection[] = []
  for (let start = 0, set = 0; start < words.length; start += SET_SIZE, set += 1) {
    const group = words.slice(start, start + SET_SIZE)

    if (wantMatch) {
      sections.push({
        kind: 'word-match',
        id: `word-match:${set}`,
        pairs: shuffle(group.map((word) => toPair(word, 'match'))),
        fillPool: matchPool,
      })
    }

    if (wantListen) {
      sections.push({
        kind: 'word-listen-match',
        id: `word-listen-match:${set}`,
        pairs: shuffle(group.map((word) => toPair(word, 'listen'))),
        fillPool: listenPool,
      })
    }

    if (wantQuiz) {
      const questions: WordQuizQuestion[] = []
      for (const word of group) {
        /* 오답 보기는 과제 전체에서 뽑는다 — 세트 안에서만 뽑으면 3개뿐이라 늘 같은 얼굴이 된다 */
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
      if (questions.length) {
        sections.push({
          kind: 'word-quiz',
          id: `word-quiz:${set}`,
          questions: shuffle(questions),
        })
      }
    }

    if (wantSpell) {
      const questions: WordSpellQuestion[] = []
      for (const word of group) {
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
      if (questions.length) {
        sections.push({
          kind: 'word-spell',
          id: `word-spell:${set}`,
          questions: shuffle(questions),
        })
      }
    }
  }

  return sections
}

/**
 * 본문도 **문장 4개씩 한 세트**로 묶어 켜진 유형을 다 돌고 다음 세트로 넘어간다.
 * 단어와 같은 이유다 — 번역 배열만 10문장 내리 푸는 것보다 같은 문장을 여러 방식으로
 * 연달아 만나는 편이 남는다. 세트 순서는 A(번역 배열) → B(청크배열) → C(영작).
 *
 * 문장마다 만들 수 있는 유형이 다르다(A는 한글 청크, B는 영어 청크, C는 한글·영어가
 * 다 있어야 한다). 못 만드는 유형은 그 세트에서 조용히 빠진다 — 빈 문제를 내지 않는다.
 */
function makeBodyAQuestion(
  sentence: ContentSnapshot['sentences'][number],
): BodyTextAQuestion | null {
  const segments = refineSparseChunks(
    splitChunks(sentence.chunksKo, sentence.korean),
    { lang: 'ko' },
  )
  if (segments.length < 2) return null
  return {
    id: `${sentence.id}:translate`,
    exampleEn: stripBrackets(sentence.english),
    exampleKo: stripBrackets(sentence.korean),
    segments,
  }
}

function makeBodyBQuestion(
  sentence: ContentSnapshot['sentences'][number],
): BodyTextBQuestion | null {
  const segments = refineSparseChunks(
    splitChunks(sentence.chunksEn, sentence.english),
    { lang: 'en' },
  )
    .map(normalizeBodyTextBChunk)
    .filter(Boolean)
  if (segments.length < 2) return null
  return {
    id: `${sentence.id}:chunk`,
    promptKo: stripBrackets(sentence.korean),
    exampleEn: stripBrackets(sentence.english),
    segments,
  }
}

function makeBodyCQuestion(
  sentence: ContentSnapshot['sentences'][number],
): BodyTextCQuestion | null {
  // 한글 지문·영어 정답이 없으면 문제로 만들지 않는다 (빈 문제를 내느니 안 내는 게 낫다).
  // 교사측 content-snapshot.ts에서 korean이 빈 문자열로 넘어올 수 있다.
  const promptKo = stripBrackets(sentence.korean)
  const exampleEn = stripBrackets(sentence.english)
  if (!promptKo || !exampleEn) return null

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
  if (resolvedKeywords.length === 0) return null

  return { id: `${sentence.id}:write`, promptKo, keywords: resolvedKeywords, exampleEn }
}

function buildBodySections(snapshot: ContentSnapshot): AssignmentSection[] {
  const types = snapshot.problemTypes.sentences
  const wantA = types.includes('번역 배열')
  const wantB = types.includes('청크배열')
  const wantC = types.includes('영작')
  if (!wantA && !wantB && !wantC) return []

  /* 문장 순서도 한 번만 섞는다 — 유형마다 섞으면 세트가 성립하지 않는다 */
  const sentences = shuffle(snapshot.sentences)
  const sections: AssignmentSection[] = []

  for (let start = 0, set = 0; start < sentences.length; start += SET_SIZE, set += 1) {
    const group = sentences.slice(start, start + SET_SIZE)

    if (wantA) {
      const questions = group.map(makeBodyAQuestion).filter((q) => q !== null)
      if (questions.length) {
        sections.push({ kind: 'body-text-a', id: `body-text-a:${set}`, questions: shuffle(questions) })
      }
    }
    if (wantB) {
      const questions = group.map(makeBodyBQuestion).filter((q) => q !== null)
      if (questions.length) {
        sections.push({ kind: 'body-text-b', id: `body-text-b:${set}`, questions: shuffle(questions) })
      }
    }
    if (wantC) {
      const questions = group.map(makeBodyCQuestion).filter((q) => q !== null)
      if (questions.length) {
        sections.push({ kind: 'body-text-c', id: `body-text-c:${set}`, questions: shuffle(questions) })
      }
    }
  }

  return sections
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
function findBlank(english: string, target: string, nth?: number): Blank | null {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const hits = [
    ...english.matchAll(new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, 'gi')),
  ]
  /* 두 번 이상 나오면 `blankNth`가 짚어 준 자리만 쓴다 — 없으면 만들지 않는다 */
  const hit = hits.length === 1 ? hits[0] : nth ? hits[nth - 1] : undefined
  if (!hit) return null
  const at = hit.index
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

  const blank =
    blankFromBrackets(grammar.english) ??
    findBlank(english, target, grammar.blankNth)
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

/**
 * 문법도 **문항 4개씩 한 세트**로 묶어 유형1 → 유형2 순서로 돈다.
 *
 * 두 유형은 서로 별개다 — 유형1은 이지선다(`twoChoices`), 유형2는 O/X 퀴즈이고
 * 정답이 X인 문항에만 3지선다 교정(2-a)이 이어진다. 한 문항이 두 유형에 다 쓰이므로
 * 같은 문장을 두 방식으로 연달아 만나게 된다.
 */
function makeGrammarType1Question(
  grammar: ProblemGrammarSnapshot,
): GrammarType1Question | null {
  const choices = parseGrammarChoices(grammar.twoChoices)
  // 2026-09 이전 스냅샷에는 `twoChoices`가 없다 — 없으면 만들지 않는다.
  if (choices.length !== 2) return null

  const correct = choices[0]!
  const ox = grammar.ox?.trim().toUpperCase()
  const target = ox === 'X' ? grammar.wrongPart?.trim() : correct
  if (!target || target === '-') return null

  const english = stripBrackets(grammar.english)
  const blank =
    blankFromBrackets(grammar.english) ??
    findBlank(english, target, grammar.blankNth)
  if (!blank) return null

  const options = shuffle(choices).map((label, index) => ({
    id: `${grammar.id}:opt:${index}:${label}`,
    label,
  }))
  const correctOption = options.find((option) => option.label === correct)
  if (!correctOption) return null

  return {
    id: `${grammar.id}:choice`,
    maskPassage: true,
    passageBefore: blank.before.trimEnd(),
    passageAfter: blank.after.trimStart(),
    options,
    correctOptionId: correctOption.id,
  }
}

function makeGrammarOxQuestion(
  grammar: ProblemGrammarSnapshot,
): GrammarType2Question | null {
  const ox = grammar.ox?.trim().toUpperCase()
  if (ox !== 'O' && ox !== 'X') return null

  const correctOptionId = ox === 'O' ? 'o' : 'x'
  return {
    kind: 'ox',
    id: `${grammar.id}:ox`,
    maskPassage: true,
    passageLines: [stripBrackets(grammar.english)],
    correctOptionId,
    xCorrection: correctOptionId === 'x' ? buildOxXCorrection(grammar) : undefined,
  }
}

function buildGrammarSections(snapshot: ContentSnapshot): AssignmentSection[] {
  const types = snapshot.problemTypes.grammar
  const wantType1 = types.includes('선택형 문제')
  const wantOx = types.includes('OX문제')
  if (!wantType1 && !wantOx) return []

  /* 문항 순서도 한 번만 섞는다 — 유형마다 섞으면 세트가 성립하지 않는다 */
  const items = shuffle(snapshot.grammar)
  const sections: AssignmentSection[] = []

  for (let start = 0, set = 0; start < items.length; start += SET_SIZE, set += 1) {
    const group = items.slice(start, start + SET_SIZE)

    if (wantType1) {
      const questions = group.map(makeGrammarType1Question).filter((q) => q !== null)
      if (questions.length) {
        sections.push({
          kind: 'grammar-type-1',
          id: `grammar-type-1:${set}`,
          questions: shuffle(questions),
        })
      }
    }
    if (wantOx) {
      const questions = group.map(makeGrammarOxQuestion).filter((q) => q !== null)
      if (questions.length) {
        sections.push({
          kind: 'grammar-type-2',
          id: `grammar-type-2-ox:${set}`,
          questions: shuffle(questions),
        })
      }
    }
  }

  return sections
}

export function buildAssignmentSections(
  snapshot: ContentSnapshot,
): AssignmentSection[] {
  return [
    ...buildWordSections(snapshot),
    ...buildBodySections(snapshot),
    ...buildGrammarSections(snapshot),
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
