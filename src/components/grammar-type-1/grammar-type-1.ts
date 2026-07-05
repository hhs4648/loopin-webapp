export const FRAME_W = 393
export const FRAME_H = 852

export const GRAMMAR_TYPE_1_ASSET = '/assets/유형1.svg'

export type GrammarType1QuestionId = 'smiles-choice' | 'students-verb'

export type GrammarType1Option = {
  id: string
  label: string
}

export type GrammarType1Question = {
  id: GrammarType1QuestionId
  /** true이면 SVG 지문을 덮고 passageBefore/After를 표시 */
  maskPassage: boolean
  passageBefore: string
  passageAfter: string
  options: GrammarType1Option[]
  correctOptionId: string
}

/** Figma — 지문 박스 */
export const GRAMMAR_TYPE_1_PASSAGE = { x: 21, y: 253, w: 350, h: 179 }

/** Figma — 지문 영어 문장 영역 (1번 문제 2줄 지문과 동일 위치·높이) */
export const GRAMMAR_TYPE_1_PASSAGE_ENGLISH = { x: 33, y: 329.5, w: 327, h: 64 }

/** Figma — 빈칸 박스 */
export const GRAMMAR_TYPE_1_PASSAGE_BLANK = { x: 237.5, y: 329.5, w: 81, h: 29 }

/** Figma — 하단 선택지 */
export const GRAMMAR_TYPE_1_OPTION_BOXES = [
  { x: 21, y: 454, w: 164, h: 90 },
  { x: 207, y: 454, w: 164, h: 90 },
] as const

/** Figma — 정답/오답 피드백 시트 */
export const GRAMMAR_TYPE_1_FEEDBACK_SHEET = { x: 0, y: 648, w: 393, h: 204 }

export const GRAMMAR_TYPE_1_QUESTIONS: GrammarType1Question[] = [
  {
    id: 'smiles-choice',
    maskPassage: false,
    passageBefore: '',
    passageAfter: '',
    options: [
      { id: 'smile', label: 'smile' },
      { id: 'smiles', label: 'smiles' },
    ],
    correctOptionId: 'smiles',
  },
  {
    id: 'students-verb',
    maskPassage: true,
    passageBefore: 'One of the students',
    passageAfter: 'late for class.',
    options: [
      { id: 'is', label: 'is' },
      { id: 'are', label: 'are' },
    ],
    correctOptionId: 'is',
  },
]

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
