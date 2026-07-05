export const FRAME_W = 393
export const FRAME_H = 852

/** Figma `학습완료화면.svg` (394×829) — 393×852 프레임 기준으로 스케일 */
const SVG_W = 394
const SVG_H = 829

export const LEARNING_COMPLETE_ASSET = '/assets/학습완료화면.svg'

export type LearningCompleteWordId = 'various' | 'wave' | 'run-errands' | 'latest'

export type LearningCompleteWord = {
  id: LearningCompleteWordId
  english: string
  meaningKo: string
  partOfSpeech: string
  partOfSpeechKo: string
  exampleEn: string
  exampleKo: string
  box: { x: number; y: number; w: number; h: number }
}

function scaleRect(rect: { x: number; y: number; w: number; h: number }) {
  return {
    x: (rect.x / SVG_W) * FRAME_W,
    y: (rect.y / SVG_H) * FRAME_H,
    w: (rect.w / SVG_W) * FRAME_W,
    h: (rect.h / SVG_H) * FRAME_H,
  }
}

export const LEARNING_COMPLETE_WORDS: LearningCompleteWord[] = [
  {
    id: 'various',
    english: 'various',
    meaningKo: '다양한',
    partOfSpeech: '형용사',
    partOfSpeechKo: '다양한',
    exampleEn: 'We tried various foods at the festival.',
    exampleKo: '우리는 축제에서 다양한 음식들을 먹어 보았다.',
    box: scaleRect({ x: 20, y: 484, w: 172, h: 46 }),
  },
  {
    id: 'wave',
    english: 'wave',
    meaningKo: '(손을) 흔들다',
    partOfSpeech: '동사',
    partOfSpeechKo: '(손을) 흔들다',
    exampleEn: 'I wave to my friend every morning.',
    exampleKo: '나는 매일 아침 친구에게 손을 흔든다.',
    box: scaleRect({ x: 201, y: 484, w: 172, h: 46 }),
  },
  {
    id: 'run-errands',
    english: 'run errands',
    meaningKo: '심부름하다',
    partOfSpeech: '동사',
    partOfSpeechKo: '심부름하다',
    exampleEn: 'I run errands for my mom on weekends.',
    exampleKo: '나는 주말마다 엄마를 위해 심부름을 한다.',
    box: scaleRect({ x: 20, y: 536, w: 172, h: 46 }),
  },
  {
    id: 'latest',
    english: 'latest',
    meaningKo: '최신의',
    partOfSpeech: '형용사',
    partOfSpeechKo: '최신의',
    exampleEn: 'I bought the latest version of the game.',
    exampleKo: '나는 그 게임의 최신 버전을 샀다.',
    box: scaleRect({ x: 201, y: 536, w: 172, h: 46 }),
  },
]

/** SVG에 박혀 있는 단어 카드·상세 영역을 가리고 React로 렌더 */
export const LEARNING_COMPLETE_WORD_LIST_MASK = scaleRect({ x: 8, y: 472, w: 378, h: 122 })
export const LEARNING_COMPLETE_DETAIL_CARD = scaleRect({ x: 20, y: 347, w: 353, h: 93 })

/** Figma — 메인 버튼 (학습 완료) */
export const LEARNING_COMPLETE_PRIMARY_BTN = scaleRect({ x: 29, y: 757, w: 228, h: 54 })

/** Figma — 보조 버튼 */
export const LEARNING_COMPLETE_SECONDARY_BTN = scaleRect({ x: 265, y: 757, w: 99, h: 54 })

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}
