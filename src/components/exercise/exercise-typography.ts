/** 한국어 본문 — Noto Sans KR (body font-sans) */
export const FONT_KO = 'font-sans'

/** 영어 본문·선택지 — Inter */
export const FONT_EN = 'font-en'

export const COLOR_TEXT_PRIMARY = 'text-[#1E1E1E]'
export const COLOR_TEXT_KO = 'text-[#1E293B]'
export const COLOR_TEXT_MUTED = 'text-[#9E9FA7]'
export const COLOR_TEXT_SUBTLE = 'text-[#9AA4B4]'
export const COLOR_CORRECT = 'text-[#22C55E]'
export const COLOR_WRONG = 'text-[#FF4B4B]'
export const COLOR_CORRECT_BG = 'bg-[#22C55E]'
export const COLOR_WRONG_BG = 'bg-[#FF4B4B]'

/** 문제 화면 공통 — 영어 본문·선택지·입력 */
const EXERCISE_EN_BASE =
  `${FONT_EN} text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#1E1E1E] antialiased`

/** 문제 화면 공통 — 한국어 지문·힌트 */
const EXERCISE_KO_BASE =
  `${FONT_KO} text-[13px] font-medium leading-snug text-[#1E293B]`

/** 진행률 (1/4) */
export const EXERCISE_PROGRESS_CLASS = 'text-[11px] font-medium text-[#9E9FA7]'

/** 피드백 제목 — 정답입니다 / 오답입니다 */
export function exerciseFeedbackTitleClass(isCorrect: boolean) {
  return `text-center text-[22px] font-bold leading-none ${
    isCorrect ? COLOR_CORRECT : COLOR_WRONG
  }`
}

/** 피드백·완료 시트 중립 제목 */
export const EXERCISE_SHEET_TITLE_CLASS =
  'text-center text-[22px] font-bold leading-snug text-[#1E1E1E]'

/** 피드백 해설 */
export const EXERCISE_FEEDBACK_HINT_CLASS =
  'mt-4 text-center text-[15px] font-semibold leading-snug text-[#374151]'

/** 제출·계속하기 버튼 */
export const EXERCISE_BTN_TEXT_CLASS = 'text-[17px] font-bold'

/** 제출·계속하기 버튼 (흰색 텍스트) */
export const EXERCISE_CTA_CLASS = `${EXERCISE_BTN_TEXT_CLASS} text-white`

/** 한국어 지문·문제 */
export const EXERCISE_PASSAGE_KO_CLASS = EXERCISE_KO_BASE

/** 한국어 힌트·키워드 */
export const EXERCISE_HINT_KO_CLASS = EXERCISE_KO_BASE

/** 영어 지문·예문 */
export const EXERCISE_PASSAGE_EN_CLASS = EXERCISE_EN_BASE

/** 영어 선택지·타일·입력 */
export const EXERCISE_OPTION_EN_CLASS = EXERCISE_EN_BASE

/** 영어 퀴즈 제시 단어 */
export const EXERCISE_HEADWORD_CLASS =
  `${FONT_EN} text-[28px] font-bold leading-none tracking-[-0.02em] text-[#1E1E1E] antialiased`

/** 영어 직접 입력 */
export const EXERCISE_INPUT_EN_CLASS =
  `${EXERCISE_EN_BASE} w-full outline-none placeholder:font-normal placeholder:text-[#9AA4B4]`

/** 배치된 타일·슬롯 */
export const EXERCISE_PLACED_TILE_CLASS = EXERCISE_EN_BASE

/** 빈 칸 안내 */
export const EXERCISE_EMPTY_HINT_CLASS =
  `${FONT_EN} text-[17px] font-medium leading-snug text-[#9AA4B4] antialiased`

/** 문법 빈칸 */
export const EXERCISE_GRAMMAR_BLANK_CLASS =
  `inline-flex h-[29px] min-w-[48px] shrink-0 items-center justify-center rounded-[10.5px] border-[3px] border-[#3C86FF] bg-[#EFF1FE] px-2 ${EXERCISE_EN_BASE} leading-none`

/** 문법 O/X */
export const EXERCISE_OX_LABEL_CLASS = `${FONT_EN} text-[52px] font-bold leading-none antialiased`

/** 완료 화면 점수 */
export const EXERCISE_SCORE_CLASS = 'text-[64px] font-bold leading-none'

/** 완료 화면 부제 */
export const EXERCISE_SCORE_LABEL_CLASS = 'text-[14px] font-semibold text-[#1E293B]'

/** 단어 매칭 타일 — 영어 */
export const EXERCISE_MATCH_TILE_EN_CLASS = EXERCISE_EN_BASE

/** 단어 매칭 타일 — 한국어 */
export const EXERCISE_MATCH_TILE_KO_CLASS =
  `${FONT_KO} text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[#1E1E1E]`

/** 한국어 보조 설명 */
export const EXERCISE_PASSAGE_KO_MUTED_CLASS =
  `${FONT_KO} text-[13px] font-medium leading-snug text-[#6B7280]`

/** 학습 완료 — 영어 단어 */
export const EXERCISE_REVIEW_WORD_CLASS =
  `${FONT_EN} text-[22px] font-bold leading-tight text-[#1580EF] antialiased`

/** 학습 완료 — 예문 */
export const EXERCISE_REVIEW_EXAMPLE_CLASS =
  `${FONT_EN} text-[13px] font-semibold leading-snug text-[#1580EF] antialiased`

/** 학습 완료 — 품사·메타 */
export const EXERCISE_META_CLASS = 'text-[11px] text-[#6B7380]'

/** 학습 완료 — 한국어 뜻 */
export const EXERCISE_REVIEW_KO_CLASS = 'text-[15px] font-semibold leading-tight text-[#0F172A]'

/** 학습 완료 — 보조 라벨 */
export const EXERCISE_REVIEW_SUB_CLASS = 'text-[12px] leading-tight text-[#6B7380]'

export function exerciseOptionEnStateClass(state: 'idle' | 'correct' | 'wrong') {
  switch (state) {
    case 'correct':
      return `${EXERCISE_OPTION_EN_CLASS} text-[#22C55E]`
    case 'wrong':
      return `${EXERCISE_OPTION_EN_CLASS} text-[#EF4444]`
    default:
      return EXERCISE_OPTION_EN_CLASS
  }
}

export function exerciseOxLabelClass(
  state: 'idle' | 'correct' | 'wrong',
  optionId: 'o' | 'x',
) {
  if (state === 'correct') return `${EXERCISE_OX_LABEL_CLASS} text-[#22C55E]`
  if (state === 'wrong') return `${EXERCISE_OX_LABEL_CLASS} text-[#EF4444]`
  return optionId === 'o'
    ? `${EXERCISE_OX_LABEL_CLASS} text-[#11C882]`
    : `${EXERCISE_OX_LABEL_CLASS} text-[#FF414E]`
}
