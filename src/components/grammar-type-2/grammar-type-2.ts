import { shuffleArray } from '../../lib/shuffle'

export const FRAME_W = 393
export const FRAME_H = 852

export const GRAMMAR_TYPE_2_ASSET = '/assets/grammar-type-2.svg'
export const GRAMMAR_TYPE_2_X_ASSET = '/assets/grammar-type-2-x.svg'

export type GrammarType2OptionId = 'o' | 'x'

export type GrammarType2WordOption = {
  id: string
  label: string
}

export type GrammarType2OxQuestion = {
  kind: 'ox'
  id: string
  /** true이면 SVG 지문을 덮고 passage 표시 */
  maskPassage: boolean
  passageLines?: string[]
  correctOptionId: GrammarType2OptionId
  /**
   * 정답이 X일 때 — OX 종료 후 틀린 부분(빨간 밑줄) + 3지선다 교정
   * O 문항에는 두지 않음
   */
  xCorrection?: {
    wrongPart: string
    passageBefore: string
    passageAfter: string
    options: GrammarType2WordOption[]
    correctOptionId: string
  }
}

export type GrammarType2WordChoiceQuestion = {
  kind: 'word-choice'
  id: string
  asset: string
  options: GrammarType2WordOption[]
  correctOptionId: string
  optionBoxes: readonly { x: number; y: number; w: number; h: number }[]
  /** 교정 화면 — 틀린 부분 빨간 밑줄 지문 */
  maskPassage?: boolean
  passageBefore?: string
  wrongPart?: string
  passageAfter?: string
}

export type GrammarType2Question = GrammarType2OxQuestion | GrammarType2WordChoiceQuestion

/** Figma — 지문 박스 (`grammar-type-2.svg`) */
export const GRAMMAR_TYPE_2_PASSAGE = { x: 21, y: 253, w: 350, h: 160 }

/** Figma — 지문 박스 (`grammar-type-2-x.svg`) — OX와 y가 다름 */
export const GRAMMAR_TYPE_2_X_PASSAGE = { x: 22, y: 202, w: 350, h: 160 }

/** Figma — O / X 선택지 */
export const GRAMMAR_TYPE_2_OPTION_BOXES = [
  { x: 21, y: 435, w: 164, h: 126 },
  { x: 207, y: 435, w: 164, h: 126 },
] as const

export const GRAMMAR_TYPE_2_OPTIONS: { id: GrammarType2OptionId; label: string }[] = [
  { id: 'o', label: 'O' },
  { id: 'x', label: 'X' },
]

/** Figma — grammar-type-2-x 선택지 (smiles / to smile / smiling) */
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
    maskPassage: true,
    passageLines: ['She always smiling when she sees her friends.'],
    correctOptionId: 'x',
    xCorrection: {
      wrongPart: 'smiling',
      passageBefore: 'She always',
      passageAfter: 'when she sees her friends.',
      options: [
        { id: 'smiles', label: 'smiles' },
        { id: 'to-smile', label: 'to smile' },
        { id: 'smiling', label: 'smiling' },
      ],
      correctOptionId: 'smiles',
    },
  },
  {
    kind: 'ox',
    id: 'ox-q2',
    maskPassage: true,
    passageLines: ['One of the students is late for class.'],
    correctOptionId: 'o',
  },
]

/** OX 1문항 + (X면) 교정 1문항을 실제 진행 스텝으로 펼침 */
export function expandGrammarType2Steps(
  questions: GrammarType2Question[],
): GrammarType2Question[] {
  const steps: GrammarType2Question[] = []

  for (const question of questions) {
    if (question.kind === 'ox') {
      steps.push({
        ...question,
        xCorrection: undefined,
      })
      if (question.correctOptionId === 'x' && question.xCorrection) {
        const fix = question.xCorrection
        steps.push({
          kind: 'word-choice',
          id: `${question.id}:fix`,
          asset: GRAMMAR_TYPE_2_X_ASSET,
          options: fix.options,
          correctOptionId: fix.correctOptionId,
          optionBoxes: GRAMMAR_TYPE_2_X_OPTION_BOXES,
          maskPassage: true,
          passageBefore: fix.passageBefore,
          wrongPart: fix.wrongPart,
          passageAfter: fix.passageAfter,
        })
      }
      continue
    }

    steps.push(question)
  }

  return steps
}

/**
 * 문항 순서를 섞되, 정답 X OX 바로 다음에 3지선다 교정이 오도록 묶음을 유지한다.
 * (재개 시 이미 펼쳐진 스텝도 OX→:fix 단위로만 셔플)
 */
export function prepareGrammarType2Steps(
  questions: GrammarType2Question[],
): GrammarType2Question[] {
  const source = [...questions]
  const hasAttachedCorrection = source.some(
    (question) => question.kind === 'ox' && Boolean(question.xCorrection),
  )

  // 원본 OX(+xCorrection) 형태 → 셔플 후 펼치기
  if (hasAttachedCorrection || source.every((question) => question.kind === 'ox')) {
    return expandGrammarType2Steps(shuffleArray(source))
  }

  // 이미 펼쳐진 스텝 → [OX, :fix?] 단위로만 셔플
  const units: GrammarType2Question[][] = []
  let index = 0
  while (index < source.length) {
    const question = source[index]!
    if (question.kind === 'ox') {
      const unit: GrammarType2Question[] = [question]
      const next = source[index + 1]
      if (
        next?.kind === 'word-choice' &&
        next.id === `${question.id}:fix`
      ) {
        unit.push(next)
        index += 2
      } else {
        index += 1
      }
      units.push(unit)
      continue
    }

    units.push([question])
    index += 1
  }

  return shuffleArray(units).flat()
}

export function countGrammarType2Steps(questions: GrammarType2Question[]): number {
  return expandGrammarType2Steps(questions).length
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
