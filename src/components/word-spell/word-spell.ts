export const FRAME_W = 393
export const FRAME_H = 852

export const WORD_SPELL_ASSETS = {
  base: '/assets/단어C.svg',
  filling: '/assets/단어C_채우기.svg',
  correct: '/assets/단어C_정답시.svg',
} as const

export const WORD_SPELL_ANSWER = 'teenager'
export const WORD_SPELL_SLOT_COUNT = 8

export type WordSpellTile = {
  id: string
  letter: string
  x: number
  y: number
  w: number
  h: number
}

/** Figma `단어C.svg` — 빈칸 슬롯 (y=431 h=48) */
export const WORD_SPELL_SLOTS = [
  { x: 23.4805, y: 431, w: 37.13, h: 48 },
  { x: 67.6094, y: 431, w: 37.13, h: 48 },
  { x: 111.738, y: 431, w: 37.13, h: 48 },
  { x: 155.871, y: 431, w: 37.13, h: 48 },
  { x: 200, y: 431, w: 37.13, h: 48 },
  { x: 244.129, y: 431, w: 37.13, h: 48 },
  { x: 288.262, y: 431, w: 37.13, h: 48 },
  { x: 332.391, y: 431, w: 37.13, h: 48 },
] as const

/** Figma `단어C.svg` — 하단 알파벳 타일 */
export const WORD_SPELL_TILES: WordSpellTile[] = [
  { id: 'tile-e1', letter: 'e', x: 35.5, y: 576, w: 44, h: 52 },
  { id: 'tile-t', letter: 't', x: 88, y: 576, w: 44, h: 52 },
  { id: 'tile-e2', letter: 'e', x: 143.5, y: 576, w: 44, h: 52 },
  { id: 'tile-n', letter: 'n', x: 197.5, y: 576, w: 44, h: 52 },
  { id: 'tile-a', letter: 'a', x: 251.5, y: 576, w: 44, h: 52 },
  { id: 'tile-g', letter: 'g', x: 305.5, y: 576, w: 44, h: 52 },
  { id: 'tile-e3', letter: 'e', x: 143.5, y: 638, w: 44, h: 52 },
  { id: 'tile-r', letter: 'r', x: 197.5, y: 638, w: 44, h: 52 },
]

/** Figma `단어C.svg` — 제출하기 버튼 */
export const WORD_SPELL_SUBMIT_BTN = { x: 30, y: 751, w: 333, h: 60 }

const tileById = new Map(WORD_SPELL_TILES.map((tile) => [tile.id, tile]))

export function getWordSpellTile(id: string): WordSpellTile | undefined {
  return tileById.get(id)
}

export function buildWordFromSlots(slots: (string | null)[]): string {
  return slots
    .map((tileId) => (tileId ? tileById.get(tileId)?.letter ?? '' : ''))
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
