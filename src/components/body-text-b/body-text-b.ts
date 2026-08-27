export const FRAME_W = 393
export const FRAME_H = 852

export const BODY_TEXT_B_ASSET = '/assets/body-text-a.svg?v=2'

export type BodyTextBQuestionId = string

export type BodyTextBQuestion = {
  id: BodyTextBQuestionId
  /** 문제 (예문 뜻 · 한국어) */
  promptKo: string
  /** 정답 예문 (영어 전체) */
  exampleEn: string
  /** 예문을 나눈 조각 — 하단 영어 버튼 */
  segments: string[]
}

export type BodyTextBTile = {
  id: string
  segmentIndex: number
  label: string
}

/** 단어C — 예문 뜻(문제) · 영어 예문 조각 */
export const BODY_TEXT_B_QUESTIONS: BodyTextBQuestion[] = [
  {
    id: 'various',
    promptKo: '우리는 축제에서 다양한 음식들을 먹어 보았다.',
    exampleEn: 'We tried various foods at the festival.',
    segments: ['we tried', 'various', 'foods', 'at the festival'],
  },
  {
    id: 'wave',
    promptKo: '나는 매일 아침 친구에게 손을 흔든다.',
    exampleEn: 'I wave to my friend every morning.',
    segments: ['i', 'wave', 'to my friend', 'every morning'],
  },
  {
    id: 'run-errands',
    promptKo: '나는 주말마다 엄마를 위해 심부름을 한다.',
    exampleEn: 'I run errands for my mom on weekends.',
    segments: ['i', 'run errands', 'for my mom', 'on weekends'],
  },
  {
    id: 'latest',
    promptKo: '나는 그 게임의 최신 버전을 샀다.',
    exampleEn: 'I bought the latest version of the game.',
    segments: ['i bought', 'the latest', 'version', 'of the game'],
  },
]

/** Figma `body-text-a.svg` 프레임 기준 — 진행률 바 */
export const BODY_TEXT_B_PROGRESS_BAR = { x: 33, y: 142, w: 326, h: 18 }

/** Figma — 진행률 텍스트 */
export const BODY_TEXT_B_PROGRESS_LABEL = { x: 168, y: 146, w: 60, h: 18 }

/** Figma — 문제(예문 뜻 · 한국어). 헤더 바로 아래. 짧으면 낮게, 길면 박스가 자람 */
export const BODY_TEXT_B_PASSAGE = { x: 16, y: 118, w: 361, h: 80 }

/** 에셋 예문·옛 스피커·옛 문장박스 자리까지 가림. 청크(y 362)는 덮지 않음 */
export const BODY_TEXT_B_PASSAGE_BAKE_MASK = { x: 16, y: 108, w: 361, h: 254 }

/** @deprecated 베이크 마스크로 통합 — 호환용 */
export const BODY_TEXT_B_HINT_GAP_MASK = { x: 16, y: 202, w: 361, h: 12 }

/** @deprecated 베이크 마스크로 통합 — 호환용 */
export const BODY_TEXT_B_SPEAKER_MASK = { x: 16, y: 118, w: 52, h: 54 }

/** 문장 완성 박스 — 제시문 바로 아래. 조각이 많으면 아래로 자람 */
export const BODY_TEXT_B_SENTENCE_BOX = { x: 24, y: 206, w: 345, h: 148 }

/** 하단 영어 버튼. 문장 박스 바로 아래부터 코치·제출 직전까지 덮음 */
export const BODY_TEXT_B_TILES_MASK = { x: 18, y: 362, w: 355, h: 383 }

/** Figma — 제출하기 버튼 */
export const BODY_TEXT_B_SUBMIT_BTN = { x: 30, y: 751, w: 333, h: 60 }

/** 마스코트 미니 코치(말풍선) — 본문 A와 동일 좌표 */
export const BODY_TEXT_B_COACH_BUBBLE = { x: 91, y: 691, w: 200, h: 44 } as const

/** 마스코트 미니 코치(캐릭터) — 본문 A와 동일 좌표 */
export const BODY_TEXT_B_COACH_IMAGE = { x: 299, y: 671, w: 64, h: 64 } as const

/**
 * 타일 영역이 코치와 겹치는 하단 비율.
 * 조각이 많으면 3번째 줄이 말풍선·캐릭터 밑으로 들어가 안 보이므로,
 * 그만큼 padding-bottom을 두고 넘치면 스크롤한다.
 */
export function bodyTextBTilesCoachPadPct(contentShift = 0): number {
  const coachClusterTop = BODY_TEXT_B_COACH_IMAGE.y - 20
  const overlap =
    BODY_TEXT_B_TILES_MASK.y +
    BODY_TEXT_B_TILES_MASK.h +
    contentShift -
    coachClusterTop
  return Math.max(0, (overlap / BODY_TEXT_B_TILES_MASK.h) * 100)
}

export const MASCOT_COACH_BLUSH_ASSET = '/assets/mascot-blush.png'
export const MASCOT_COACH_WAVE_ASSET = '/assets/mascot-wave.png'
export const MASCOT_COACH_SAD_ASSET = '/assets/mascot-sad.png'

/** @deprecated 팝업 시트 제거 — `ExerciseContinueButton`이 제출 슬롯 사용 */
export const BODY_TEXT_B_FEEDBACK_SHEET = { x: 0, y: 740, w: 393, h: 112 }

/** 본문 B 청크 — 힌트가 되지 않게 소문자·마침표 제거 */
export function normalizeBodyTextBChunk(label: string): string {
  return label.replace(/\./g, '').toLowerCase().trim()
}

function shuffleIndexedSegments(
  items: Array<{ label: string; segmentIndex: number }>,
): Array<{ label: string; segmentIndex: number }> {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export function buildBodyTextBTiles(question: BodyTextBQuestion): BodyTextBTile[] {
  const indexed = question.segments.map((label, segmentIndex) => ({
    label: normalizeBodyTextBChunk(label),
    segmentIndex,
  }))
  const shuffled = shuffleIndexedSegments(indexed)

  return shuffled.map((item, index) => ({
    id: `${question.id}-segment-${index}`,
    segmentIndex: item.segmentIndex,
    label: item.label,
  }))
}

export function getBodyTextBTile(tiles: BodyTextBTile[], id: string): BodyTextBTile | undefined {
  return tiles.find((tile) => tile.id === id)
}

export function matchesBodyTextAnswer(
  selectedTiles: BodyTextBTile[],
  question: BodyTextBQuestion,
): boolean {
  const expected = question.segments.map(normalizeBodyTextBChunk)
  if (selectedTiles.length !== expected.length) return false
  // 같은 글자 청크는 서로 바꿔도 정답 (원래 인덱스 비교면 오답 처리됨)
  return selectedTiles.every((tile, index) => tile.label === expected[index])
}

/** 위치가 틀린 조각 개수 (재도전 허용 ≤2 판정용) */
export function countBodyTextWrongPositions(
  selectedTiles: BodyTextBTile[],
  question: BodyTextBQuestion,
): number {
  const expected = question.segments.map(normalizeBodyTextBChunk)
  return selectedTiles.reduce(
    (count, tile, index) => count + (tile.label === expected[index] ? 0 : 1),
    0,
  )
}

/** 재도전 허용: 틀린 조각이 이 개수 이하일 때만 1회 */
export const BODY_TEXT_RETRY_WRONG_LIMIT = 2

export const BODY_TEXT_COACH_RETRY =
  '음...순서가 살짝 꼬였어. 카드를 다시 눌러서 고쳐봐!'

export function formatBodyTextBAnswer(question: BodyTextBQuestion): string {
  return question.exampleEn
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

/** 말풍선 — 아래를 시안에 맞추고, 글이 길면 위로 커지게 (잘리지 않게) */
export function figmaRectBottomGrowStyle(rect: {
  x: number
  y: number
  w: number
  h: number
}) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    bottom: `${((FRAME_H - rect.y - rect.h) / FRAME_H) * 100}%`,
    height: 'auto',
    minHeight: `${(rect.h / FRAME_H) * 100}%`,
  }
}
