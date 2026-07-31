export const FRAME_W = 393
export const FRAME_H = 852

const SVG_W = 732
const SVG_H = 1585

const LEARNING_ASSET_VERSION = '2'

export const CASTLE_LEARNING_ASSETS = {
  step1: `/assets/castle-learning-1.svg?v=${LEARNING_ASSET_VERSION}`,
  step2: `/assets/castle-learning-2.svg?v=${LEARNING_ASSET_VERSION}`,
  step3: `/assets/castle-learning-3.svg?v=${LEARNING_ASSET_VERSION}`,
  step4: `/assets/castle-learning-4.svg?v=${LEARNING_ASSET_VERSION}`,
} as const

export type CastleLearningStepId = 1 | 2 | 3 | 4

export type CastleLearningQuizOption = {
  id: string
  label: string
  box: { x: number; y: number; w: number; h: number }
}

export type CastleLearningStep =
  | {
      id: 1 | 3
      kind: 'info'
      asset: string
      narration: string
      continueButton: { x: number; y: number; w: number; h: number }
    }
  | {
      id: 2 | 4
      kind: 'quiz'
      asset: string
      narration: string
      correctOptionId: string
      options: CastleLearningQuizOption[]
      confirmButton: { x: number; y: number; w: number; h: number }
    }

function scaleRect(rect: { x: number; y: number; w: number; h: number }) {
  return {
    x: (rect.x / SVG_W) * FRAME_W,
    y: (rect.y / SVG_H) * FRAME_H,
    w: (rect.w / SVG_W) * FRAME_W,
    h: (rect.h / SVG_H) * FRAME_H,
  }
}

const CONTINUE_BUTTON = scaleRect({ x: 37.207, y: 1454.78, w: 656.696, h: 96.7371 })

/** 학습 SVG 좌상단 `<` (732×1585 원본) */
export const CASTLE_HEADER_BACK_HIT = scaleRect({ x: 17, y: 38, w: 55, h: 55 })

const QUIZ_OPTION_BOXES_STEP_2 = [
  { x: 38.5984, y: 466.477, w: 653.906, h: 82.7846 },
  { x: 38.5984, y: 570.657, w: 653.906, h: 82.7846 },
  { x: 38.5984, y: 674.833, w: 653.906, h: 82.7846 },
  { x: 38.5984, y: 779.012, w: 653.906, h: 82.7846 },
].map(scaleRect)

const QUIZ_OPTION_BOXES_STEP_4 = [
  { x: 38.5984, y: 559.493, w: 653.906, h: 79.064 },
  { x: 38.5984, y: 656.231, w: 653.906, h: 79.064 },
  { x: 38.5984, y: 752.969, w: 653.906, h: 79.064 },
  { x: 38.5984, y: 849.704, w: 653.906, h: 79.064 },
].map(scaleRect)

export const CASTLE_LEARNING_STEPS: Record<CastleLearningStepId, CastleLearningStep> = {
  1: {
    id: 1,
    kind: 'info',
    asset: CASTLE_LEARNING_ASSETS.step1,
    narration: 'can 뒤에는 동사원형이 와.',
    continueButton: CONTINUE_BUTTON,
  },
  2: {
    id: 2,
    kind: 'quiz',
    asset: CASTLE_LEARNING_ASSETS.step2,
    narration: '한 번 이거 뒤에 뭐가 나오는지 골라볼래?',
    correctOptionId: 'swim',
    confirmButton: CONTINUE_BUTTON,
    options: [
      { id: 'swims', label: 'swims', box: QUIZ_OPTION_BOXES_STEP_2[0] },
      { id: 'swim', label: 'swim', box: QUIZ_OPTION_BOXES_STEP_2[1] },
      { id: 'swimming', label: 'swimming', box: QUIZ_OPTION_BOXES_STEP_2[2] },
      { id: 'swam', label: 'swam', box: QUIZ_OPTION_BOXES_STEP_2[3] },
    ],
  },
  3: {
    id: 3,
    kind: 'info',
    asset: CASTLE_LEARNING_ASSETS.step3,
    narration: '좋아, 이제 우리가 오늘 배운 것들을 빈칸채우기해보자!',
    continueButton: CONTINUE_BUTTON,
  },
  4: {
    id: 4,
    kind: 'quiz',
    asset: CASTLE_LEARNING_ASSETS.step4,
    narration: '오늘 배운 것들을 정리해볼까?',
    correctOptionId: 'base-form',
    confirmButton: CONTINUE_BUTTON,
    options: [
      { id: 'base-form', label: '동사원형', box: QUIZ_OPTION_BOXES_STEP_4[0] },
      { id: 'gerund', label: '동명사', box: QUIZ_OPTION_BOXES_STEP_4[1] },
      { id: 'past', label: '과거형', box: QUIZ_OPTION_BOXES_STEP_4[2] },
      { id: 'to-infinitive', label: 'to부정사', box: QUIZ_OPTION_BOXES_STEP_4[3] },
    ],
  },
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

export function getNextCastleLearningStep(
  stepId: CastleLearningStepId,
): CastleLearningStepId | null {
  if (stepId >= 4) return null
  return (stepId + 1) as CastleLearningStepId
}
