export const FRAME_W = 393
export const FRAME_H = 852

export const BODY_TEXT_A_ASSET = '/assets/body-text-a.svg?v=2'

export type BodyTextAQuestionId = string

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

/** Figma `body-text-a.svg` — 진행률 바 */
export const BODY_TEXT_A_PROGRESS_BAR = { x: 33, y: 142, w: 326, h: 18 }

/** Figma — 진행률 텍스트 */
export const BODY_TEXT_A_PROGRESS_LABEL = { x: 168, y: 146, w: 60, h: 18 }

/** Figma — 예문(영어). 앱 프레임 기준 가운데 · 스피커는 위쪽 별도 */
export const BODY_TEXT_A_PASSAGE = { x: 24, y: 232, w: 345, h: 104 }

/** 에셋에 박힌 예문·옛 스피커 자리 가림 */
export const BODY_TEXT_A_PASSAGE_BAKE_MASK = { x: 16, y: 200, w: 361, h: 132 }

/** 「단어를…」등 에셋 안내 — 문장박스 직전까지 */
export const BODY_TEXT_A_HINT_GAP_MASK = { x: 16, y: 320, w: 361, h: 24 }

/**
 * 예문 듣기 스피커 — 제시문 왼쪽 위(텍스트와 분리).
 * 가운데 정렬 예문과 겹치지 않도록 제시문 박스 밖에 둠.
 */
export const BODY_TEXT_A_SPEAKER_HIT = { x: 24, y: 178, w: 48, h: 48 }

/** Figma — 문장 완성 점선 박스 */
export const BODY_TEXT_A_SENTENCE_BOX = { x: 24, y: 344, w: 345, h: 137 }

/** Figma — 하단 예문 뜻 버튼 가림 */
export const BODY_TEXT_A_TILES_MASK = { x: 18, y: 527, w: 355, h: 218 }

/** Figma — 제출하기 버튼 */
export const BODY_TEXT_A_SUBMIT_BTN = { x: 30, y: 751, w: 333, h: 60 }

/** 루핀 미니 코치(말풍선) */
export const BODY_TEXT_A_COACH_BUBBLE = { x: 91, y: 691, w: 200, h: 44 } as const

/** 루핀 미니 코치(캐릭터) */
export const BODY_TEXT_A_COACH_IMAGE = { x: 299, y: 671, w: 64, h: 64 } as const

export const LOOPIN_COACH_BLUSH_ASSET = '/assets/loopin-blush.png'
export const LOOPIN_COACH_WAVE_ASSET = '/assets/loopin-wave.png'
export const LOOPIN_COACH_SAD_ASSET = '/assets/loopin-sad.png'

/** @deprecated 팝업 시트 제거 — `ExerciseContinueButton`이 제출 슬롯 사용 */
export const BODY_TEXT_A_FEEDBACK_SHEET = { x: 0, y: 740, w: 393, h: 112 }

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

/** 위치가 틀린 조각 개수 (재도전 허용 ≤2 판정용) */
export function countBodyTextWrongPositions(selectedTiles: BodyTextATile[]): number {
  return selectedTiles.reduce(
    (count, tile, index) => count + (tile.segmentIndex === index ? 0 : 1),
    0,
  )
}

/** 재도전 허용: 틀린 조각이 이 개수 이하일 때만 1회 */
export const BODY_TEXT_RETRY_WRONG_LIMIT = 2

export const BODY_TEXT_COACH_RETRY =
  '음...순서가 살짝 꼬였어. 카드를 다시 눌러서 고쳐봐!'

export function formatBodyTextAAnswer(question: BodyTextAQuestion): string {
  return question.segments.join(' ')
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
