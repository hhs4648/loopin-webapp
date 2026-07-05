export const FRAME_W = 393
export const FRAME_H = 852

export const BODY_TEXT_C_ASSET = '/assets/본문C.svg'

export type BodyTextCQuestionId = 'various' | 'wave' | 'run-errands' | 'latest'

export type BodyTextCQuestion = {
  id: BodyTextCQuestionId
  /** 문제 (예문 뜻 · 한국어) */
  promptKo: string
  /** 힌트 — 중요 영어 단어 */
  keywords: string[]
  /** 정답 예문 (영어 전체) */
  exampleEn: string
}

/** 단어C — 예문 뜻(문제) · 영어 직접 입력 */
export const BODY_TEXT_C_QUESTIONS: BodyTextCQuestion[] = [
  {
    id: 'various',
    promptKo: '우리는 축제에서 다양한 음식들을 먹어 보았다.',
    keywords: ['various', 'festival', 'foods'],
    exampleEn: 'We tried various foods at the festival.',
  },
  {
    id: 'wave',
    promptKo: '나는 매일 아침 친구에게 손을 흔든다.',
    keywords: ['wave', 'friend', 'morning'],
    exampleEn: 'I wave to my friend every morning.',
  },
  {
    id: 'run-errands',
    promptKo: '나는 주말마다 엄마를 위해 심부름을 한다.',
    keywords: ['run errands', 'mom', 'weekends'],
    exampleEn: 'I run errands for my mom on weekends.',
  },
  {
    id: 'latest',
    promptKo: '나는 그 게임의 최신 버전을 샀다.',
    keywords: ['latest', 'version', 'game'],
    exampleEn: 'I bought the latest version of the game.',
  },
]

export function formatBodyTextCKeywordHint(keywords: string[]): string {
  return `(${keywords.join(',')})`
}

/** Figma `본문C.svg` 프레임 기준 — 진행률 바 */
export const BODY_TEXT_C_PROGRESS_BAR = { x: 33, y: 142, w: 326, h: 18 }

/** Figma — 진행률 텍스트 */
export const BODY_TEXT_C_PROGRESS_LABEL = { x: 168, y: 146, w: 60, h: 18 }

/** Figma — 문제(예문 뜻 · 한국어) 버블 */
export const BODY_TEXT_C_PASSAGE = { x: 17, y: 252, w: 306, h: 84 }

/** Figma — 문장 완성 점선 박스 (본문 A/B와 동일) */
export const BODY_TEXT_C_SENTENCE_BOX = { x: 24, y: 344, w: 345, h: 137 }

/** Figma — 제출하기 버튼 */
export const BODY_TEXT_C_SUBMIT_BTN = { x: 30, y: 751, w: 333, h: 60 }

/** Figma — SVG 제출 버튼(그림자 포함) 가림 */
export const BODY_TEXT_C_SUBMIT_BTN_MASK = { x: 26, y: 747, w: 341, h: 68 }

/** 하단 피드백 시트 */
export const BODY_TEXT_C_FEEDBACK_SHEET = { x: 0, y: 648, w: 393, h: 204 }

export function normalizeBodyTextCAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\./g, '')
}

export function matchesBodyTextCAnswer(answer: string, question: BodyTextCQuestion): boolean {
  return normalizeBodyTextCAnswer(answer) === normalizeBodyTextCAnswer(question.exampleEn)
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
