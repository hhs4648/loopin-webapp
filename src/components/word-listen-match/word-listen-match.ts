/**
 * 단어 B · TTS 뜻 짝맞추기
 * 레이아웃·페이지 규칙은 단어 A(`word-match`)와 동일. 왼쪽만 오디오 타일.
 */
export {
  FEEDBACK_MS,
  FRAME_H,
  FRAME_W,
  MATCH_TILE_SHADOW,
  PAGE_SIZE,
  WORD_MATCH_TILE_COVERS,
  buildTilesFromPairs,
  fillMatchPage,
  figmaRectStyle,
  isFillPairId,
  isMatchingPair,
  pickNextPage,
  type WordMatchPair,
  type WordPairId,
  type WordTile,
} from '../word-match/word-match'

/** A와 동일 그리드 — 전용 Export 전까지 `word-a-start` 재사용 */
export const WORD_LISTEN_MATCH_ASSETS = {
  base: '/assets/word-a-start.svg?v=listen-b',
} as const

/**
 * 안내 문구 — 옛 진행바 아래 · 첫 타일(214) 위.
 */
export const WORD_LISTEN_MATCH_PROMPT = {
  x: 24,
  y: 176,
  w: 345,
  h: 32,
} as const

export const WORD_LISTEN_MATCH_PROMPT_COPY = '의미가 일치하는 것을 고르세요'
