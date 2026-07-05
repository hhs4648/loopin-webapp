import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  EXERCISE_BTN_TEXT_CLASS,
  EXERCISE_CTA_CLASS,
  EXERCISE_SCORE_CLASS,
  EXERCISE_SCORE_LABEL_CLASS,
} from '../exercise/exercise-typography'
import {
  GRAMMAR_COMPLETE_ASSET,
  GRAMMAR_COMPLETE_BAKED_BUTTONS_MASK,
  GRAMMAR_COMPLETE_BAKED_SUBTITLE_MASK,
  GRAMMAR_COMPLETE_CORRECT_LABEL,
  GRAMMAR_COMPLETE_HOME_BTN,
  GRAMMAR_COMPLETE_RETRY_ALL_BTN,
  GRAMMAR_COMPLETE_RETRY_WRONG_BTN,
  GRAMMAR_COMPLETE_SCORE,
  SESSION_TOTAL_QUESTIONS,
  calcSessionScore,
  figmaCamouflageStyle,
  figmaRectStyle,
} from './grammar-complete'

type GrammarCompleteScreenProps = {
  correctCount: number
  wrongCount: number
  onRetryAll?: () => void
  onRetryWrongOnly?: () => void
  onHome?: () => void
}

export function GrammarCompleteScreen({
  correctCount,
  wrongCount,
  onRetryAll,
  onRetryWrongOnly,
  onHome,
}: GrammarCompleteScreenProps) {
  const score = calcSessionScore(correctCount)
  const canRetryWrongOnly = wrongCount > 0

  return (
    <FigmaAssetFrame
      src={GRAMMAR_COMPLETE_ASSET}
      alt="문법 학습 완료"
      bgClassName="bg-gradient-to-b from-[#D3EFFE] to-[#F0FAFF]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={figmaCamouflageStyle(GRAMMAR_COMPLETE_SCORE)}
      />
      <p
        className={`pointer-events-none absolute flex items-center justify-center bg-gradient-to-b from-[#0E9CF7] to-[#0085E9] bg-clip-text ${EXERCISE_SCORE_CLASS} text-transparent`}
        style={figmaRectStyle(GRAMMAR_COMPLETE_SCORE)}
      >
        {score}
      </p>

      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full bg-white"
        style={figmaRectStyle(GRAMMAR_COMPLETE_CORRECT_LABEL)}
      />
      <p
        className={`pointer-events-none absolute flex items-center justify-center ${EXERCISE_SCORE_LABEL_CLASS}`}
        style={figmaRectStyle(GRAMMAR_COMPLETE_CORRECT_LABEL)}
      >
        {SESSION_TOTAL_QUESTIONS}문제 중 {correctCount}개 정답
      </p>

      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={figmaCamouflageStyle(GRAMMAR_COMPLETE_BAKED_SUBTITLE_MASK)}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={figmaCamouflageStyle(GRAMMAR_COMPLETE_BAKED_BUTTONS_MASK)}
      />

      {onRetryAll && (
        <button
          type="button"
          aria-label="전부 재도전"
          className={`absolute z-10 flex cursor-pointer items-center justify-center rounded-[20px] border border-white ${EXERCISE_CTA_CLASS} text-white shadow-sm`}
          style={{
            ...figmaRectStyle(GRAMMAR_COMPLETE_RETRY_ALL_BTN),
            background: 'linear-gradient(to bottom, #5BA3F5, #3C86FF)',
          }}
          onClick={onRetryAll}
        >
          전부 재도전
        </button>
      )}

      {onRetryWrongOnly && (
        <button
          type="button"
          aria-label="오답만 풀기"
          disabled={!canRetryWrongOnly}
          className={`absolute z-10 flex items-center justify-center rounded-[20px] border ${EXERCISE_BTN_TEXT_CLASS} ${
            canRetryWrongOnly
              ? 'cursor-pointer border-[#3C86FF] bg-white text-[#3C86FF]'
              : 'cursor-default border-[#D1D5DB] bg-[#F3F4F6] text-[#9CA3AF]'
          }`}
          style={figmaRectStyle(GRAMMAR_COMPLETE_RETRY_WRONG_BTN)}
          onClick={onRetryWrongOnly}
        >
          오답만 풀기
        </button>
      )}

      {onHome && (
        <button
          type="button"
          aria-label="홈"
          className={`absolute z-10 flex cursor-pointer items-center justify-center rounded-[20px] border border-[#D1D5DB] bg-white ${EXERCISE_BTN_TEXT_CLASS} text-[#374151]`}
          style={figmaRectStyle(GRAMMAR_COMPLETE_HOME_BTN)}
          onClick={onHome}
        >
          홈
        </button>
      )}
    </FigmaAssetFrame>
  )
}
