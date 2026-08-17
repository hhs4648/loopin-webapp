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
 * 안내 문구 — **진행바 아래 · 타일 위** 빈 띠에 놓는다.
 *
 * 예전 값(y 118, h 72)은 세로 가운데가 154라, 진행바(138~162) **뒤에 글자가 깔렸다.**
 * 흰 배경까지 진행바 구간을 덮고 있어서 둘이 겹쳐 보였다.
 * 시안 실측: 진행바 아래 162, 첫 타일 위 208 → 그 사이 46px가 문구 자리다.
 */
export const WORD_LISTEN_MATCH_PROMPT = {
  x: 24,
  y: 166,
  w: 345,
  h: 38,
} as const

export const WORD_LISTEN_MATCH_PROMPT_COPY = '의미가 일치하는 것을 고르세요'
