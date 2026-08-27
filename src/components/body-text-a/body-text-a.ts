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

/** Figma — 예문(영어). 스피커 바로 아래. 짧은 문장은 낮게, 길면 박스가 자람 */
export const BODY_TEXT_A_PASSAGE = { x: 24, y: 160, w: 345, h: 72 }

/** 에셋에 박힌 예문·스피커·옛 문장박스 자리까지 가림. 청크(y 396)는 덮지 않음 */
export const BODY_TEXT_A_PASSAGE_BAKE_MASK = { x: 16, y: 108, w: 361, h: 288 }

/** 「단어를…」등 에셋 안내 — 문장박스 직전까지 */
export const BODY_TEXT_A_HINT_GAP_MASK = { x: 16, y: 236, w: 361, h: 12 }

/**
 * 예문 듣기 스피커 — 헤더 바로 아래.
 * 가운데 정렬 예문과 겹치지 않도록 제시문 박스 밖에 둠.
 */
export const BODY_TEXT_A_SPEAKER_HIT = { x: 24, y: 108, w: 48, h: 48 }

/** 문장 완성 박스 — 제시문 바로 아래. 조각이 많으면 아래로 자람 */
export const BODY_TEXT_A_SENTENCE_BOX = { x: 24, y: 240, w: 345, h: 148 }

/** 하단 예문 뜻 버튼. 문장 박스 바로 아래부터 코치·제출 직전까지 덮음 */
export const BODY_TEXT_A_TILES_MASK = { x: 18, y: 396, w: 355, h: 349 }

/** Figma — 제출하기 버튼 */
export const BODY_TEXT_A_SUBMIT_BTN = { x: 30, y: 751, w: 333, h: 60 }

/** 마스코트 미니 코치(말풍선) */
export const BODY_TEXT_A_COACH_BUBBLE = { x: 91, y: 691, w: 200, h: 44 } as const

/** 마스코트 미니 코치(캐릭터) */
export const BODY_TEXT_A_COACH_IMAGE = { x: 299, y: 671, w: 64, h: 64 } as const

/**
 * 타일 영역이 코치와 겹치는 하단 비율.
 * 조각이 많으면 3번째 줄이 말풍선·캐릭터 밑으로 들어가 안 보이므로,
 * 그만큼 padding-bottom을 두고 넘치면 스크롤한다.
 */
export function bodyTextATilesCoachPadPct(contentShift = 0): number {
  // 2줄 말풍선이 캐릭터보다 조금 위로 크므로, 타일은 그보다 위에서 멈춘다.
  const coachClusterTop = BODY_TEXT_A_COACH_IMAGE.y - 20
  const overlap =
    BODY_TEXT_A_TILES_MASK.y +
    BODY_TEXT_A_TILES_MASK.h +
    contentShift -
    coachClusterTop
  return Math.max(0, (overlap / BODY_TEXT_A_TILES_MASK.h) * 100)
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

export const MASCOT_COACH_BLUSH_ASSET = '/assets/mascot-blush.png'
export const MASCOT_COACH_WAVE_ASSET = '/assets/mascot-wave.png'
export const MASCOT_COACH_SAD_ASSET = '/assets/mascot-sad.png'

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
  // 같은 글자 청크는 서로 바꿔도 정답 (원래 인덱스 비교면 오답 처리됨)
  return selectedTiles.every((tile, index) => tile.label === question.segments[index])
}

/** 위치가 틀린 조각 개수 (재도전 허용 ≤2 판정용) */
export function countBodyTextWrongPositions(
  selectedTiles: BodyTextATile[],
  question: BodyTextAQuestion,
): number {
  return selectedTiles.reduce(
    (count, tile, index) => count + (tile.label === question.segments[index] ? 0 : 1),
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
