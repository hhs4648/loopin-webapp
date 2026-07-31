import {
  preloadLoopinTts,
  preloadLoopinEnglishTexts,
  speakLoopinEnglish,
  stopLoopinTts,
} from '../../lib/tts/loopin-tts'

export const FRAME_W = 393
export const FRAME_H = 852

export const WORD_QUIZ_ASSETS = {
  base: '/assets/word-b-start.svg',
} as const

export const FEEDBACK_MS = 500

export type WordQuizId = string

export type WordQuizQuestion = {
  id: WordQuizId
  word: string
  correctAnswer: string
  options: string[]
}

export const WORD_QUIZ_QUESTIONS: WordQuizQuestion[] = [
  {
    id: 'various',
    word: 'various',
    correctAnswer: '다양한',
    options: ['최신의', '다양한', '심부름하다'],
  },
  {
    id: 'wave',
    word: 'wave',
    correctAnswer: '손을 흔들다',
    options: ['다양한', '최신의', '손을 흔들다'],
  },
  {
    id: 'run-errands',
    word: 'run errands',
    correctAnswer: '심부름하다',
    options: ['손을 흔들다', '심부름하다', '다양한'],
  },
  {
    id: 'latest',
    word: 'latest',
    correctAnswer: '최신의',
    options: ['다양한', '심부름하다', '최신의'],
  },
]

/** 예문 듣기 스피커 — 앱 왼쪽 정렬 */
export const WORD_QUIZ_SPEAKER_HIT = { x: 24, y: 230, w: 48, h: 48 }

/**
 * 영어 단어 — 앱 프레임 기준 가운데(스피커와 묶여 가운데 맞추지 않음).
 */
export const WORD_QUIZ_PROMPT_WORD = { x: 24, y: 230, w: 345, h: 48 }

/** 에셋에 박힌 옛 스피커·단어 자리 가림 */
export const WORD_QUIZ_PROMPT_BAKE_MASK = { x: 70, y: 220, w: 260, h: 68 }

/** Figma — 진행률 바 (1/4 기준 x=31.6172 w=326) */
export const WORD_QUIZ_PROGRESS_BAR = { x: 31.6172, y: 142, w: 326, h: 18 }

/** Figma — 진행률 텍스트 (1/4) */
export const WORD_QUIZ_PROGRESS_LABEL = { x: 168, y: 146, w: 60, h: 18 }

export const WORD_QUIZ_OPTIONS = [
  { x: 20, y: 325, w: 354, h: 76 },
  { x: 20, y: 417, w: 354, h: 76 },
  { x: 20, y: 509, w: 354, h: 76 },
] as const

export function shuffleOptions<T>(items: readonly T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

/**
 * 3지선다 선택지 — 정답을 0/1/2번 슬롯에 균등 확률로 배치.
 * (원본 배열에서 정답이 맨 앞에 있어도 위치에 치우치지 않음)
 */
export function shuffleChoicesWithRandomCorrect(
  options: readonly string[],
  correctAnswer: string,
): string[] {
  const distractors = shuffleOptions([
    ...new Set(options.filter((option) => option !== correctAnswer)),
  ]).slice(0, 2)

  const slot = Math.floor(Math.random() * (distractors.length + 1))
  const next = [...distractors]
  next.splice(slot, 0, correctAnswer)
  return next
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

/** Loopin 제공 TTS — 번들 wav + Edge Aria/SunHi (Supabase Function) */
export function stopEnglishWordAudio() {
  stopLoopinTts()
}

export function preloadEnglishWordAudio(): Promise<void> {
  return preloadLoopinTts()
}

export function preloadEnglishWords(texts: readonly string[]): Promise<void> {
  return preloadLoopinEnglishTexts(texts)
}

export function speakEnglishWord(word: string, options?: { force?: boolean }) {
  speakLoopinEnglish(word, options)
}

export function speakEnglishText(
  text: string,
  options?: { force?: boolean; audioKey?: string },
) {
  void options?.audioKey
  speakLoopinEnglish(text, options)
}
