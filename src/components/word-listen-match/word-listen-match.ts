/**
 * 단어 B · TTS 뜻 짝맞추기
 * 레이아웃·페이지 규칙은 단어 A(`word-match`)와 동일. 왼쪽만 오디오 타일.
 */
export {
  FEEDBACK_MS,
  FRAME_H,
  FRAME_W,
  PAGE_SIZE,
  WORD_MATCH_TILE_COVERS,
  buildTilesFromPairs,
  fillMatchPage,
  figmaRectStyle,
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

/** 시안 안내 문구 영역 (진행바 아래 · 타일 위) — 구워진 A 문구 덮고 B 카피로 교체 */
export const WORD_LISTEN_MATCH_PROMPT = {
  x: 24,
  y: 118,
  w: 345,
  h: 72,
} as const

export const WORD_LISTEN_MATCH_PROMPT_COPY = '의미가 일치하는 것을 고르세요'
