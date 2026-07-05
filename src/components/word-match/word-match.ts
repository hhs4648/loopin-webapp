export const FRAME_W = 393
export const FRAME_H = 852

export const WORD_MATCH_ASSETS = {
  base: '/assets/단어A_시작.svg',
} as const

export const FEEDBACK_MS = 500

/** Figma `단어A_전체정답.svg` — 하단 완료 시트 (y=684 h=168) */
export const WORD_MATCH_COMPLETE_SHEET = { x: 0, y: 684, w: 393, h: 168 }

/** Figma `단어A_전체정답.svg` — 계속하기 버튼 (x=30 y=751 w=333 h=60) */
export const WORD_MATCH_CONTINUE_BTN = { x: 30, y: 751, w: 333, h: 60 }

/** Figma — 1회차 빨간 성 (assigned star 1) */
export const STAR_1_CASTLE_HIT = { x: 155, y: 275, w: 100, h: 125 }

export type WordPairId = 'wave' | 'latest' | 'various' | 'run-errands'

export type WordTile = {
  id: string
  pairId: WordPairId
  label: string
  side: 'en' | 'ko'
  x: number
  y: number
  w: number
  h: number
}

type TileRow = {
  y: number
  en: { id: string; label: string; pairId: WordPairId }
  ko: { id: string; label: string; pairId: WordPairId }
}

/** Figma `단어A_시작.svg` — row order matches the exported frame */
const TILE_ROWS: TileRow[] = [
  {
    y: 214,
    en: { id: 'en-wave', label: 'wave', pairId: 'wave' },
    ko: { id: 'ko-latest', label: '최신의', pairId: 'latest' },
  },
  {
    y: 328,
    en: { id: 'en-latest', label: 'latest', pairId: 'latest' },
    ko: { id: 'ko-wave', label: '손을 흔들다', pairId: 'wave' },
  },
  {
    y: 442,
    en: { id: 'en-various', label: 'various', pairId: 'various' },
    ko: { id: 'ko-various', label: '다양한', pairId: 'various' },
  },
  {
    y: 556,
    en: { id: 'en-run-errands', label: 'run errands', pairId: 'run-errands' },
    ko: { id: 'ko-run-errands', label: '심부름하다', pairId: 'run-errands' },
  },
]

const TILE_W = 168
const TILE_H = 98
const EN_X = 21
const KO_X = 205

export const WORD_TILES: WordTile[] = TILE_ROWS.flatMap((row) => [
  {
    id: row.en.id,
    pairId: row.en.pairId,
    label: row.en.label,
    side: 'en',
    x: EN_X,
    y: row.y,
    w: TILE_W,
    h: TILE_H,
  },
  {
    id: row.ko.id,
    pairId: row.ko.pairId,
    label: row.ko.label,
    side: 'ko',
    x: KO_X,
    y: row.y,
    w: TILE_W,
    h: TILE_H,
  },
])

export const WORD_PAIR_TILES: Record<WordPairId, { en: string; ko: string }> = {
  wave: { en: 'en-wave', ko: 'ko-wave' },
  latest: { en: 'en-latest', ko: 'ko-latest' },
  various: { en: 'en-various', ko: 'ko-various' },
  'run-errands': { en: 'en-run-errands', ko: 'ko-run-errands' },
}

export const WORD_PAIR_COUNT = Object.keys(WORD_PAIR_TILES).length

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

export function isMatchingPair(a: WordTile, b: WordTile) {
  return Object.values(WORD_PAIR_TILES).some(
    (pair) =>
      (pair.en === a.id && pair.ko === b.id) || (pair.en === b.id && pair.ko === a.id),
  )
}
