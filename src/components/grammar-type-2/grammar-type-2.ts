export const FRAME_W = 393
export const FRAME_H = 852

export const GRAMMAR_TYPE_2_ASSET = '/assets/유형2.svg'
export const GRAMMAR_TYPE_2_X_ASSET = '/assets/유형2정답X.svg'

export type GrammarType2OptionId = 'o' | 'x'

export type GrammarType2WordOption = {
  id: string
  label: string
}

export type GrammarType2OxQuestion = {
  kind: 'ox'
  id: string
  /** true이면 SVG 지문을 덮고 passageLines 표시 */
  maskPassage: boolean
  passageLines?: string[]
  correctOptionId: GrammarType2OptionId
}

export type GrammarType2WordChoiceQuestion = {
  kind: 'word-choice'
  id: string
  asset: string
  options: GrammarType2WordOption[]
  correctOptionId: string
  optionBoxes: readonly { x: number; y: number; w: number; h: number }[]
}

export type GrammarType2Question = GrammarType2OxQuestion | GrammarType2WordChoiceQuestion

/** Figma — 지문 박스 */
export const GRAMMAR_TYPE_2_PASSAGE = { x: 21, y: 253, w: 350, h: 160 }

/** Figma — O / X 선택지 */
export const GRAMMAR_TYPE_2_OPTION_BOXES = [
  { x: 21, y: 435, w: 164, h: 126 },
  { x: 207, y: 435, w: 164, h: 126 },
] as const

export const GRAMMAR_TYPE_2_OPTIONS: { id: GrammarType2OptionId; label: string }[] = [
  { id: 'o', label: 'O' },
  { id: 'x', label: 'X' },
]

/** Figma — 유형2정답X 선택지 (smiles / to smile / smiling) */
export const GRAMMAR_TYPE_2_X_OPTION_BOXES = [
  { x: 26, y: 391, w: 343, h: 76 },
  { x: 26, y: 483, w: 343, h: 76 },
  { x: 26, y: 575, w: 343, h: 76 },
] as const

/** Figma — 정답/오답 피드백 시트 */
export const GRAMMAR_TYPE_2_FEEDBACK_SHEET = { x: 0, y: 648, w: 393, h: 204 }

export const GRAMMAR_TYPE_2_QUESTIONS: GrammarType2Question[] = [
  {
    kind: 'ox',
    id: 'ox-q1',
    maskPassage: false,
    correctOptionId: 'x',
  },
  {
    kind: 'word-choice',
    id: 'x-followup-smiles',
    asset: GRAMMAR_TYPE_2_X_ASSET,
    options: [
      { id: 'smiles', label: 'smiles' },
      { id: 'to-smile', label: 'to smile' },
      { id: 'smiling', label: 'smiling' },
    ],
    correctOptionId: 'smiles',
    optionBoxes: GRAMMAR_TYPE_2_X_OPTION_BOXES,
  },
  {
    kind: 'ox',
    id: 'ox-q2',
    maskPassage: true,
    passageLines: ['One of the students is late for class.'],
    correctOptionId: 'o',
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
