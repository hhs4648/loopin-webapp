export const FRAME_W = 393
export const FRAME_H = 852

export const WORD_SPELL_ASSETS = {
  base: '/assets/word-c.svg?v=2',
  filling: '/assets/word-c-fill.svg?v=2',
  correct: '/assets/word-c-correct.svg',
  wrong: '/assets/word-c-wrong.svg',
} as const

export type WordSpellQuestionId = string

export type WordSpellQuestion = {
  id: WordSpellQuestionId
  korean: string
  englishBefore: string
  englishAfter: string
  answer: string
  answerHint: string
}

export const WORD_SPELL_QUESTIONS: WordSpellQuestion[] = [
  {
    id: 'various',
    korean: '우리는 축제에서 다양한 음식들을 먹어 보았다.',
    englishBefore: 'We tried ',
    englishAfter: ' foods at the festival.',
    answer: 'various',
    answerHint: 'various(다양한)',
  },
  {
    id: 'wave',
    korean: '나는 매일 아침 친구에게 손을 흔든다.',
    englishBefore: 'I ',
    englishAfter: ' to my friend every morning.',
    answer: 'wave',
    answerHint: 'wave(손을 흔들다)',
  },
  {
    id: 'run-errands',
    korean: '나는 주말마다 엄마를 위해 심부름을 한다.',
    englishBefore: 'I ',
    englishAfter: ' for my mom on weekends.',
    answer: 'run errands',
    answerHint: 'run errands(심부름하다)',
  },
  {
    id: 'latest',
    korean: '나는 그 게임의 최신 버전을 샀다.',
    englishBefore: 'I bought the ',
    englishAfter: ' version of the game.',
    answer: 'latest',
    answerHint: 'latest(최신의)',
  },
]

export type WordSpellTile = {
  id: string
  letter: string
  x: number
  y: number
  w: number
  h: number
}

/**
 * SVG에 박힌 데모 한국어·영어·빈칸·잔상 전부 가림.
 * 진행바 아래 ~ 알파벳 트레이 직전까지만 (트레이·제출 버튼은 남김).
 */
/**
 * 구워진 본문 가림 — **진행바(138~162) 아래부터** 시작한다.
 * y 140이면 진행바 구간까지 덮어서, 그 위에 얹히는 카드와 진행바가 붙어 보였다.
 */
export const WORD_SPELL_CONTENT_BAKE_MASK = { x: 0, y: 166, w: 393, h: 374 }

/**
 * 본문 카드 — 진행바·트레이 사이 가운데.
 * 너무 길면 하단이 트레이와 겹치고, 예전 SLOTS 흰 마스크에 잘려
 * 「회색 박스 밖으로 글자가 나온」것처럼 보였다.
 */
/**
 * 문제 카드 — 윗변이 진행바 아래(162)에서 14px 떨어지도록 176부터.
 * 예전 156은 진행바에 6px 물려서 카드가 바에 붙어 보였다.
 * 아래는 글자 트레이(456)에 닿지 않게 448에서 끝낸다.
 */
export const WORD_SPELL_CARD = { x: 20, y: 176, w: 353, h: 272 }

/** @deprecated CONTENT_BAKE_MASK로 통합 */
export const WORD_SPELL_ABOVE_BAKE_MASK = WORD_SPELL_CONTENT_BAKE_MASK

/** 카드 안 텍스트 (카드와 동일 클립 영역, 좌우·상하 패딩) */
export const WORD_SPELL_CARD_TEXT = { x: 36, y: 192, w: 321, h: 240 }

/**
 * 하단 별도 빈칸 줄은 쓰지 않음(문장 안 인라인 빈칸만).
 * 카드와 겹치지 않게 트레이 위 잔상만 가림.
 */
export const WORD_SPELL_SLOTS_MASK = { x: 8, y: 456, w: 377, h: 88 }

/** Figma `word-c.svg` — 하단 알파벳 타일 가림 */
export const WORD_SPELL_TRAY_MASK = { x: 12, y: 548, w: 369, h: 160 }

/** Figma `word-c.svg` — 제출하기 버튼 */
export const WORD_SPELL_SUBMIT_BTN = { x: 30, y: 751, w: 333, h: 60 }

/** Figma `word-c-wrong.svg` — 하단 피드백 시트 (y=648 h=204) */
export const WORD_SPELL_FEEDBACK_SHEET = { x: 0, y: 648, w: 393, h: 204 }

const SLOT_AREA = { x: 20, y: 440, w: 353, h: 44 }
const SLOT_ROW_GAP = 8
const SLOT_TWO_ROW_THRESHOLD = 9
const TRAY_AREA = { x: 20, w: 353 }
const TRAY_TILE = { w: 44, h: 52, row1Y: 568, row2Y: 630, row1Max: 6 }
const SLOT_GAP = 6
/** 단어 사이 띄어쓰기 간격 (글자 칸 간격 SLOT_GAP의 확연한 배수) */
const WORD_GAP = 36

export const PREFILLED_TILE_PREFIX = 'prefill:'

function shuffleLetters(letters: string[]): string[] {
  const next = [...letters]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function centerRowLayouts(
  count: number,
  y: number,
): Array<{ x: number; y: number; w: number; h: number }> {
  if (count <= 0) return []

  const { w, h } = TRAY_TILE
  const gap = count > 1 ? Math.min(12, (TRAY_AREA.w - count * w) / (count - 1)) : 0
  const totalWidth = count * w + (count - 1) * gap
  const startX = TRAY_AREA.x + (TRAY_AREA.w - totalWidth) / 2

  return Array.from({ length: count }, (_, index) => ({
    x: startX + index * (w + gap),
    y,
    w,
    h,
  }))
}

export function getSpellingLetters(answer: string): string[] {
  return answer.replace(/\s/g, '').split('')
}

export function getSpellingLength(answer: string): number {
  return getSpellingLetters(answer).length
}

export function getSpaceAfterSlotIndices(answer: string): number[] {
  const indices: number[] = []
  let letterIndex = 0

  for (const char of answer) {
    if (char === ' ') {
      indices.push(letterIndex - 1)
      continue
    }
    letterIndex += 1
  }

  return indices
}

export function getPrefilledLetter(answer: string): string {
  return getSpellingLetters(answer)[0] ?? ''
}

export function isPrefilledTileId(tileId: string | null): boolean {
  return tileId?.startsWith(PREFILLED_TILE_PREFIX) ?? false
}

export function isPrefilledSlotIndex(slotIndex: number, slots: (string | null)[]): boolean {
  return slotIndex === 0 && isPrefilledTileId(slots[0] ?? null)
}

export function createPrefilledTile(
  questionId: string,
  letter: string,
): WordSpellTile {
  return {
    id: `${PREFILLED_TILE_PREFIX}${questionId}:0`,
    letter,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }
}

export function buildQuestionState(question: WordSpellQuestion): {
  tiles: WordSpellTile[]
  slots: (string | null)[]
} {
  const prefilled = createPrefilledTile(
    question.id,
    getPrefilledLetter(question.answer),
  )
  const trayTiles = buildQuestionTiles(question)
  const length = getSpellingLength(question.answer)
  const slots = Array.from({ length: length }, () => null) as (string | null)[]
  if (length > 0) slots[0] = prefilled.id

  return { tiles: [prefilled, ...trayTiles], slots }
}

export function matchesSpellAnswer(built: string, answer: string): boolean {
  return built === answer.replace(/\s/g, '')
}

/** 띄어쓰기 기준으로 슬롯 인덱스 그룹화 (문장 밑줄·하단 칸 줄바꿈용) */
export function getAnswerWordGroups(
  slotCount: number,
  spaceAfterSlotIndices: number[],
): number[][] {
  if (slotCount <= 0) return []

  const groups: number[][] = []
  let current: number[] = []

  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    current.push(slotIndex)
    if (
      spaceAfterSlotIndices.includes(slotIndex) ||
      slotIndex === slotCount - 1
    ) {
      groups.push(current)
      current = []
    }
  }

  return groups
}

function layoutSlotRow(
  startIndex: number,
  endIndex: number,
  rowY: number,
  spaceAfterSlotIndices: number[],
): Array<{ x: number; y: number; w: number; h: number }> {
  const count = endIndex - startIndex
  if (count <= 0) return []

  const { x, w: areaW, h } = SLOT_AREA
  const maxSlotW = 37.13
  const minSlotW = 26
  const rowSpaces = spaceAfterSlotIndices.filter(
    (index) => index >= startIndex && index < endIndex - 1,
  )
  const wordGapCount = rowSpaces.length
  const normalGapCount = Math.max(0, count - 1 - wordGapCount)
  const totalGapWidth = wordGapCount * WORD_GAP + normalGapCount * SLOT_GAP
  const slotW = Math.max(
    minSlotW,
    Math.min(maxSlotW, (areaW - totalGapWidth) / count),
  )
  const totalWidth = count * slotW + totalGapWidth
  let currentX = x + (areaW - totalWidth) / 2

  return Array.from({ length: count }, (_, offset) => {
    const slotIndex = startIndex + offset
    const layout = { x: currentX, y: rowY, w: slotW, h }
    if (offset < count - 1) {
      const gap = spaceAfterSlotIndices.includes(slotIndex) ? WORD_GAP : SLOT_GAP
      currentX += slotW + gap
    }
    return layout
  })
}

function pickTwoRowSplitIndex(
  count: number,
  spaceAfterSlotIndices: number[],
): number {
  const ideal = Math.ceil(count / 2)
  const spacesNearMiddle = spaceAfterSlotIndices
    .map((index) => index + 1)
    .filter((split) => split > 0 && split < count)
    .sort(
      (left, right) => Math.abs(left - ideal) - Math.abs(right - ideal),
    )

  return spacesNearMiddle[0] ?? ideal
}

export function getSlotLayouts(
  count: number,
  spaceAfterSlotIndices: number[] = [],
): Array<{ x: number; y: number; w: number; h: number }> {
  if (count <= 0) return []

  const { y } = SLOT_AREA

  if (count <= SLOT_TWO_ROW_THRESHOLD) {
    return layoutSlotRow(0, count, y, spaceAfterSlotIndices)
  }

  const splitAt = pickTwoRowSplitIndex(count, spaceAfterSlotIndices)
  return [
    ...layoutSlotRow(0, splitAt, y, spaceAfterSlotIndices),
    ...layoutSlotRow(
      splitAt,
      count,
      y + SLOT_AREA.h + SLOT_ROW_GAP,
      spaceAfterSlotIndices,
    ),
  ]
}

function getTrayPositions(count: number): Array<{ x: number; y: number; w: number; h: number }> {
  const { row1Y, row2Y, row1Max } = TRAY_TILE

  if (count <= row1Max) {
    return centerRowLayouts(count, row1Y)
  }

  return [
    ...centerRowLayouts(row1Max, row1Y),
    ...centerRowLayouts(count - row1Max, row2Y),
  ]
}

export function buildQuestionTiles(question: WordSpellQuestion): WordSpellTile[] {
  const shuffledLetters = shuffleLetters(
    getSpellingLetters(question.answer).slice(1),
  )
  const positions = getTrayPositions(shuffledLetters.length)

  return shuffledLetters.map((letter, index) => ({
    id: `${question.id}-tile-${index}`,
    letter,
    ...positions[index],
  }))
}

export function getWordSpellTile(
  tiles: WordSpellTile[],
  id: string,
): WordSpellTile | undefined {
  return tiles.find((tile) => tile.id === id)
}

export function buildWordFromSlots(slots: (string | null)[], tiles: WordSpellTile[]): string {
  return slots
    .map((tileId) => (tileId ? getWordSpellTile(tiles, tileId)?.letter ?? '' : ''))
    .join('')
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
