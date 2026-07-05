export const FRAME_W = 393
export const FRAME_H = 852

export const BODY_TEXT_A_ASSET = '/assets/본문A.svg'

export type BodyTextAQuestionId = 'various' | 'wave' | 'run-errands' | 'latest'

export type BodyTextAQuestion = {
  id: BodyTextAQuestionId
  /** 예문 (영어) */
  exampleEn: string
  /** 예문 뜻 (한국어 전체) */
  exampleKo: string
  /** 예문 뜻을 나눈 조각 — 하단 버튼 */
  segments: string[]
}

export type BodyTextATile = {
  id: string
  segmentIndex: number
  label: string
}

/** 단어C 예문 · 예문 뜻 기준 4문제 */
export const BODY_TEXT_A_QUESTIONS: BodyTextAQuestion[] = [
  {
    id: 'various',
    exampleEn: 'We tried various foods at the festival.',
    exampleKo: '우리는 축제에서 다양한 음식들을 먹어 보았다.',
    segments: ['우리는', '축제에서', '다양한', '음식들을', '먹어 보았다'],
  },
  {
    id: 'wave',
    exampleEn: 'I wave to my friend every morning.',
    exampleKo: '나는 매일 아침 친구에게 손을 흔든다.',
    segments: ['나는', '매일 아침', '친구에게', '손을 흔든다'],
  },
  {
    id: 'run-errands',
    exampleEn: 'I run errands for my mom on weekends.',
    exampleKo: '나는 주말마다 엄마를 위해 심부름을 한다.',
    segments: ['나는', '주말마다', '엄마를 위해', '심부름을 한다'],
  },
  {
    id: 'latest',
    exampleEn: 'I bought the latest version of the game.',
    exampleKo: '나는 그 게임의 최신 버전을 샀다.',
    segments: ['나는', '그 게임의', '최신', '버전을', '샀다'],
  },
]

/** Figma `본문A.svg` — 진행률 바 */
export const BODY_TEXT_A_PROGRESS_BAR = { x: 33, y: 142, w: 326, h: 18 }

/** Figma — 진행률 텍스트 */
export const BODY_TEXT_A_PROGRESS_LABEL = { x: 168, y: 146, w: 60, h: 18 }

/** Figma — 예문(영어) 버블 */
export const BODY_TEXT_A_PASSAGE = { x: 69, y: 211, w: 306, h: 56 }

/** Figma — 예문 스피커 */
export const BODY_TEXT_A_SPEAKER_HIT = { x: 19, y: 212, w: 46.5, h: 45.875 }

/** Figma — 문장 완성 점선 박스 */
export const BODY_TEXT_A_SENTENCE_BOX = { x: 24, y: 344, w: 345, h: 137 }

/** Figma — 하단 예문 뜻 버튼 가림 */
export const BODY_TEXT_A_TILES_MASK = { x: 18, y: 527, w: 355, h: 218 }

/** Figma — 제출하기 버튼 */
export const BODY_TEXT_A_SUBMIT_BTN = { x: 30, y: 751, w: 333, h: 60 }

/** 하단 피드백 시트 */
export const BODY_TEXT_A_FEEDBACK_SHEET = { x: 0, y: 648, w: 393, h: 204 }

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

export function buildBodyTextATiles(question: BodyTextAQuestion): BodyTextATile[] {
  const indexed = question.segments.map((label, segmentIndex) => ({ label, segmentIndex }))
  const shuffled = shuffleIndexedSegments(indexed)

  return shuffled.map((item, index) => ({
    id: `${question.id}-segment-${index}`,
    segmentIndex: item.segmentIndex,
    label: item.label,
  }))
}

export function getBodyTextATile(tiles: BodyTextATile[], id: string): BodyTextATile | undefined {
  return tiles.find((tile) => tile.id === id)
}

export function matchesBodyTextAnswer(
  selectedTiles: BodyTextATile[],
  question: BodyTextAQuestion,
): boolean {
  if (selectedTiles.length !== question.segments.length) return false
  return selectedTiles.every((tile, index) => tile.segmentIndex === index)
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
