export const FRAME_W = 393
export const FRAME_H = 852

export const WORD_SPELL_ASSETS = {
  base: '/assets/단어C.svg',
  filling: '/assets/단어C_채우기.svg',
  correct: '/assets/단어C_정답시.svg',
  wrong: '/assets/단어C_오답시.svg',
} as const

export type WordSpellQuestionId = 'various' | 'wave' | 'run-errands' | 'latest'

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

/** Figma `단어C.svg` — 한국어 예문 영역 */
export const WORD_SPELL_KOREAN_PROMPT = { x: 36, y: 228, w: 322, h: 48 }

/** Figma `단어C.svg` — 영어 문장 + 밑줄 영역 */
export const WORD_SPELL_PROMPT = { x: 36, y: 281, w: 322, h: 72 }

/** Figma `단어C.svg` — 진행률 바 */
export const WORD_SPELL_PROGRESS_BAR = { x: 31.6172, y: 142, w: 326, h: 18 }

/** Figma `단어C.svg` — 진행률 텍스트 */
export const WORD_SPELL_PROGRESS_LABEL = { x: 168, y: 146, w: 60, h: 18 }

/** Figma `단어C.svg` — 빈칸 슬롯 가림 */
export const WORD_SPELL_SLOTS_MASK = { x: 15, y: 425, w: 363, h: 58 }

/** Figma `단어C.svg` — 하단 알파벳 타일 가림 */
export const WORD_SPELL_TRAY_MASK = { x: 15, y: 560, w: 363, h: 140 }

/** Figma `단어C.svg` — 제출하기 버튼 */
export const WORD_SPELL_SUBMIT_BTN = { x: 30, y: 751, w: 333, h: 60 }

/** Figma `단어C_오답시.svg` — 하단 피드백 시트 (y=648 h=204) */
export const WORD_SPELL_FEEDBACK_SHEET = { x: 0, y: 648, w: 393, h: 204 }

const SLOT_AREA = { x: 16, y: 431, w: 361, h: 48 }
const TRAY_AREA = { x: 20, w: 353 }
const TRAY_TILE = { w: 44, h: 52, row1Y: 576, row2Y: 638, row1Max: 6 }

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

export function matchesSpellAnswer(built: string, answer: string): boolean {
  return built === answer.replace(/\s/g, '')
}

export function getSlotLayouts(count: number): Array<{ x: number; y: number; w: number; h: number }> {
  if (count <= 0) return []

  const { x, y, w: areaW, h } = SLOT_AREA
  const maxSlotW = 37.13
  const minSlotW = 26
  const slotW = Math.max(minSlotW, Math.min(maxSlotW, (areaW - (count - 1) * 6) / count))
  const gap = count > 1 ? (areaW - count * slotW) / (count - 1) : 0
  const startX = x + (areaW - (count * slotW + (count - 1) * gap)) / 2

  return Array.from({ length: count }, (_, index) => ({
    x: startX + index * (slotW + gap),
    y,
    w: slotW,
    h,
  }))
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
  const shuffledLetters = shuffleLetters(getSpellingLetters(question.answer))
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
