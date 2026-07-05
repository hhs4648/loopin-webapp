export const FRAME_W = 393
export const FRAME_H = 852

export const BODY_TEXT_B_ASSET = '/assets/본문A.svg'

export type BodyTextBQuestionId = 'various' | 'wave' | 'run-errands' | 'latest'

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
    segments: ['We tried', 'various', 'foods', 'at the festival'],
  },
  {
    id: 'wave',
    promptKo: '나는 매일 아침 친구에게 손을 흔든다.',
    exampleEn: 'I wave to my friend every morning.',
    segments: ['I', 'wave', 'to my friend', 'every morning'],
  },
  {
    id: 'run-errands',
    promptKo: '나는 주말마다 엄마를 위해 심부름을 한다.',
    exampleEn: 'I run errands for my mom on weekends.',
    segments: ['I', 'run errands', 'for my mom', 'on weekends'],
  },
  {
    id: 'latest',
    promptKo: '나는 그 게임의 최신 버전을 샀다.',
    exampleEn: 'I bought the latest version of the game.',
    segments: ['I bought', 'the latest', 'version', 'of the game'],
  },
]

/** Figma `본문A.svg` 프레임 기준 — 진행률 바 */
export const BODY_TEXT_B_PROGRESS_BAR = { x: 33, y: 142, w: 326, h: 18 }

/** Figma — 진행률 텍스트 */
export const BODY_TEXT_B_PROGRESS_LABEL = { x: 168, y: 146, w: 60, h: 18 }

/** Figma — 문제(예문 뜻 · 한국어) 버블 */
export const BODY_TEXT_B_PASSAGE = { x: 69, y: 211, w: 306, h: 56 }

/** Figma — 문장 완성 점선 박스 */
export const BODY_TEXT_B_SENTENCE_BOX = { x: 24, y: 344, w: 345, h: 137 }

/** Figma — 하단 영어 버튼 가림 */
export const BODY_TEXT_B_TILES_MASK = { x: 18, y: 527, w: 355, h: 218 }

/** Figma — 제출하기 버튼 */
export const BODY_TEXT_B_SUBMIT_BTN = { x: 30, y: 751, w: 333, h: 60 }

/** 하단 피드백 시트 */
export const BODY_TEXT_B_FEEDBACK_SHEET = { x: 0, y: 648, w: 393, h: 204 }

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
  const indexed = question.segments.map((label, segmentIndex) => ({ label, segmentIndex }))
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
