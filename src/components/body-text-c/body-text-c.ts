export const FRAME_W = 393
export const FRAME_H = 852

export const BODY_TEXT_C_ASSET = '/assets/body-text-c.svg?v=2'

export type BodyTextCQuestionId = string

export type BodyTextCQuestion = {
  id: BodyTextCQuestionId
  /** 문제 (예문 뜻 · 한국어) */
  promptKo: string
  /** 힌트 — 중요 영어 단어 */
  keywords: string[]
  /** 정답 예문 (영어 전체) */
  exampleEn: string
}

/** 단어C — 예문 뜻(문제) · 영어 직접 입력 */
export const BODY_TEXT_C_QUESTIONS: BodyTextCQuestion[] = [
  {
    id: 'various',
    promptKo: '우리는 축제에서 다양한 음식들을 먹어 보았다.',
    keywords: ['various', 'festival', 'foods'],
    exampleEn: 'We tried various foods at the festival.',
  },
  {
    id: 'wave',
    promptKo: '나는 매일 아침 친구에게 손을 흔든다.',
    keywords: ['wave', 'friend', 'morning'],
    exampleEn: 'I wave to my friend every morning.',
  },
  {
    id: 'run-errands',
    promptKo: '나는 주말마다 엄마를 위해 심부름을 한다.',
    keywords: ['run errands', 'mom', 'weekends'],
    exampleEn: 'I run errands for my mom on weekends.',
  },
  {
    id: 'latest',
    promptKo: '나는 그 게임의 최신 버전을 샀다.',
    keywords: ['latest', 'version', 'game'],
    exampleEn: 'I bought the latest version of the game.',
  },
]

export function formatBodyTextCKeywordHint(keywords: string[]): string {
  return `(${keywords.join(',')})`
}

/**
 * 영작 문제 제시문 — 각 단어 첫 글자만 남기고 나머지는 `_`.
 * 단어 사이는 넓은 띄어쓰기(2칸)로 구분을 분명히 한다.
 * 예: `The pets you raise.` → `T__  p___  y__  r____.`
 */
export function formatBodyTextCInitialBlank(exampleEn: string): string {
  return exampleEn
    .trim()
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return '  '

      const match = token.match(/^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/)
      if (!match) return token

      const [, prefix, word, suffix] = match
      if (!word) return token
      const head = word[0]!
      const tail = '_'.repeat(Math.max(0, word.length - 1))
      return `${prefix}${head}${tail}${suffix}`
    })
    .join('')
}

export type BodyTextCDisplayChar =
  | {
      kind: 'hint' | 'filled' | 'blank' | 'locked' | 'revealed'
      char: string
      typeIndex: number
    }
  | { kind: 'punct'; char: string }
  | { kind: 'gap' }

/** 예문에서 알파벳만 순서대로 추출 */
export function extractBodyTextCLetters(exampleEn: string): string[] {
  return exampleEn.trim().split('').filter((ch) => /[A-Za-z]/.test(ch))
}

/** 입력 가능한 알파벳 글자 수 (첫 글자 힌트 포함) */
export function countBodyTextCTypeableLetters(exampleEn: string): number {
  return extractBodyTextCLetters(exampleEn).length
}

/** 위치별 정답 여부 (대소문자 무시). typed[i]가 비면 false */
export function buildBodyTextCCorrectMask(
  exampleEn: string,
  typedLetters: string,
): boolean[] {
  const answer = extractBodyTextCLetters(exampleEn)
  return answer.map((ch, index) => {
    const typed = typedLetters[index]
    if (typed === undefined || typed === '') return false
    return typed.toLowerCase() === ch.toLowerCase()
  })
}

/**
 * 재도전 표시용 슬롯 — 잠금 칸은 정답, 비잠금은 editable 순으로 채움(빈 칸 null).
 * `typedLetters` 문자열과 달리 중간 빈칸을 표현한다.
 */
export function buildBodyTextCRetrySlots(
  exampleEn: string,
  lockedMask: readonly boolean[],
  editableTyped: string,
): (string | null)[] {
  const answer = extractBodyTextCLetters(exampleEn)
  const slots: (string | null)[] = answer.map((ch, i) => (lockedMask[i] ? ch : null))
  let editableIndex = 0

  for (let i = 0; i < slots.length; i += 1) {
    if (lockedMask[i]) continue
    const typed = editableTyped[editableIndex]
    if (typed === undefined || typed === '') {
      slots[i] = null
    } else {
      slots[i] = typed
      editableIndex += 1
    }
  }

  return slots
}

/** 알파벳 입력 + 공백·문장부호 자동 삽입으로 문장 복원 (채점용) */
export function reconstructBodyTextCAnswer(
  exampleEn: string,
  typedLetters: string,
): string {
  const target = exampleEn.trim()
  let letterIndex = 0
  let out = ''

  for (let i = 0; i < target.length; i += 1) {
    const ch = target[i]!
    if (/[A-Za-z]/.test(ch)) {
      out += typedLetters[letterIndex] ?? ''
      letterIndex += 1
    } else {
      out += ch
    }
  }

  return out
}

/**
 * 슬롯 배열로 복원 — 재도전 때 중간 빈칸이 있어도 위치 유지
 */
export function reconstructBodyTextCAnswerFromSlots(
  exampleEn: string,
  slots: readonly (string | null)[],
): string {
  const target = exampleEn.trim()
  let letterIndex = 0
  let out = ''

  for (let i = 0; i < target.length; i += 1) {
    const ch = target[i]!
    if (/[A-Za-z]/.test(ch)) {
      out += slots[letterIndex] ?? ''
      letterIndex += 1
    } else {
      out += ch
    }
  }

  return out
}

/**
 * 표시용 토큰 — 단어 첫 글자는 음영 힌트, 나머지는 `_`.
 * `typedLetters`는 알파벳 순서대로 채우며 힌트 글자도 덮어쓸 수 있다.
 * `lockedMask`가 있으면 맞은 글자는 `locked` 종류로 음영 표시.
 */
export function buildBodyTextCDisplayChars(
  exampleEn: string,
  typedLetters: string,
  lockedMask?: readonly boolean[] | null,
): BodyTextCDisplayChar[] {
  const target = exampleEn.trim()
  const chars: BodyTextCDisplayChar[] = []
  let letterIndex = 0

  for (let i = 0; i < target.length; i += 1) {
    const ch = target[i]!

    if (/\s/.test(ch)) {
      chars.push({ kind: 'gap' })
      continue
    }

    if (/[^A-Za-z]/.test(ch)) {
      chars.push({ kind: 'punct', char: ch })
      continue
    }

    const isWordStart =
      i === 0 || /\s/.test(target[i - 1]!) || /[^A-Za-z\s]/.test(target[i - 1]!)

    const isLocked = Boolean(lockedMask?.[letterIndex])
    if (isLocked) {
      chars.push({ kind: 'locked', char: ch, typeIndex: letterIndex })
      letterIndex += 1
      continue
    }

    const typed = typedLetters[letterIndex]
    if (typed !== undefined && typed !== '') {
      chars.push({ kind: 'filled', char: typed, typeIndex: letterIndex })
    } else if (isWordStart) {
      chars.push({ kind: 'hint', char: ch, typeIndex: letterIndex })
    } else {
      chars.push({ kind: 'blank', char: '_', typeIndex: letterIndex })
    }
    letterIndex += 1
  }

  return chars
}

/**
 * 재도전 표시 — 슬롯 배열 기준(중간 빈칸 허용)
 */
export function buildBodyTextCDisplayCharsFromSlots(
  exampleEn: string,
  slots: readonly (string | null)[],
  lockedMask: readonly boolean[],
): BodyTextCDisplayChar[] {
  const target = exampleEn.trim()
  const chars: BodyTextCDisplayChar[] = []
  let letterIndex = 0

  for (let i = 0; i < target.length; i += 1) {
    const ch = target[i]!

    if (/\s/.test(ch)) {
      chars.push({ kind: 'gap' })
      continue
    }

    if (/[^A-Za-z]/.test(ch)) {
      chars.push({ kind: 'punct', char: ch })
      continue
    }

    const isWordStart =
      i === 0 || /\s/.test(target[i - 1]!) || /[^A-Za-z\s]/.test(target[i - 1]!)

    if (lockedMask[letterIndex]) {
      chars.push({ kind: 'locked', char: ch, typeIndex: letterIndex })
      letterIndex += 1
      continue
    }

    const typed = slots[letterIndex]
    if (typed !== undefined && typed !== null && typed !== '') {
      chars.push({ kind: 'filled', char: typed, typeIndex: letterIndex })
    } else if (isWordStart) {
      chars.push({ kind: 'hint', char: ch, typeIndex: letterIndex })
    } else {
      chars.push({ kind: 'blank', char: '_', typeIndex: letterIndex })
    }
    letterIndex += 1
  }

  return chars
}

/**
 * 재도전 실패 후 스펠링 칸 공개 — 맞은 칸은 초록, 틀린 칸은 정답 글자를 빨강으로.
 */
export function buildBodyTextCRevealChars(
  exampleEn: string,
  correctMask: readonly boolean[],
): BodyTextCDisplayChar[] {
  const target = exampleEn.trim()
  const chars: BodyTextCDisplayChar[] = []
  let letterIndex = 0

  for (let i = 0; i < target.length; i += 1) {
    const ch = target[i]!

    if (/\s/.test(ch)) {
      chars.push({ kind: 'gap' })
      continue
    }

    if (/[^A-Za-z]/.test(ch)) {
      chars.push({ kind: 'punct', char: ch })
      continue
    }

    if (correctMask[letterIndex]) {
      chars.push({ kind: 'locked', char: ch, typeIndex: letterIndex })
    } else {
      chars.push({ kind: 'revealed', char: ch, typeIndex: letterIndex })
    }
    letterIndex += 1
  }

  return chars
}

/**
 * 마지막 제출 기준 정답 칸. 1차에서 잠근 칸 + 재도전에서 맞힌 칸.
 */
export function buildBodyTextCFinalCorrectMask(
  exampleEn: string,
  lockedMask: readonly boolean[] | null,
  slots: readonly (string | null)[] | null,
  typedLetters: string,
): boolean[] {
  const answer = extractBodyTextCLetters(exampleEn)
  return answer.map((ch, index) => {
    if (lockedMask?.[index]) return true
    const typed =
      slots && index < slots.length ? slots[index] : typedLetters[index]
    if (typed == null || typed === '') return false
    return typed.toLowerCase() === ch.toLowerCase()
  })
}

/** 표시 토큰을 단어 단위로 묶어 flex gap으로 띄어쓰기를 준다 */
export function groupBodyTextCDisplayWords(
  chars: BodyTextCDisplayChar[],
): BodyTextCDisplayChar[][] {
  const words: BodyTextCDisplayChar[][] = []
  let current: BodyTextCDisplayChar[] = []

  for (const ch of chars) {
    if (ch.kind === 'gap') {
      if (current.length > 0) {
        words.push(current)
        current = []
      }
      continue
    }
    current.push(ch)
  }
  if (current.length > 0) words.push(current)
  return words
}

export const BODY_TEXT_C_COACH_RETRY =
  '아쉽다! 맞은 글자는 남겨둘게. 틀린 곳만 다시 써봐!'

/** Figma `body-text-c.svg` 프레임 기준 — 진행률 바 */
export const BODY_TEXT_C_PROGRESS_BAR = { x: 33, y: 142, w: 326, h: 18 }

/** Figma — 진행률 텍스트 */
export const BODY_TEXT_C_PROGRESS_LABEL = { x: 168, y: 146, w: 60, h: 18 }

/**
 * 헤더 아래~제출 위 SVG 데모(빈칸·점선·잔글씨) 전부 가림.
 * 제시문·입력 박스는 이 위에 React로 다시 그림.
 */
export const BODY_TEXT_C_CONTENT_BAKE_MASK = { x: 0, y: 108, w: 393, h: 540 }

/** Figma — 문제(예문 뜻 · 한국어). 헤더 바로 아래. 짧으면 낮게, 길면 박스가 자람 */
export const BODY_TEXT_C_PASSAGE = { x: 16, y: 118, w: 361, h: 72 }

/** 문장 완성 입력 박스 — 제시문 바로 아래. 긴 영작은 아래로 자람 */
export const BODY_TEXT_C_SENTENCE_BOX = { x: 24, y: 198, w: 345, h: 240 }

/** Figma — 제출하기 버튼 */
export const BODY_TEXT_C_SUBMIT_BTN = { x: 30, y: 751, w: 333, h: 60 }

/** Figma — SVG 제출 버튼(그림자 포함) 가림 */
export const BODY_TEXT_C_SUBMIT_BTN_MASK = { x: 26, y: 747, w: 341, h: 68 }

/** 하단 피드백 시트 */
export const BODY_TEXT_C_FEEDBACK_SHEET = { x: 0, y: 648, w: 393, h: 204 }

export function normalizeBodyTextCAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\./g, '')
}

export function matchesBodyTextCAnswer(answer: string, question: BodyTextCQuestion): boolean {
  return normalizeBodyTextCAnswer(answer) === normalizeBodyTextCAnswer(question.exampleEn)
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
