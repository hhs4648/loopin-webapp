import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { useEnterToContinue } from '../exercise/use-enter-to-continue'
import {
  EXERCISE_CTA_CLASS,
  EXERCISE_SCORE_CLASS,
  EXERCISE_SCORE_LABEL_CLASS,
} from '../exercise/exercise-typography'
import {
  BODY_TEXT_COMPLETE_ASSET,
  BODY_TEXT_COMPLETE_BAKED_SUBTITLE_MASK,
  BODY_TEXT_COMPLETE_CORRECT_LABEL,
  BODY_TEXT_COMPLETE_PRIMARY_BTN,
  BODY_TEXT_COMPLETE_SCORE,
  BODY_TEXT_TOTAL_QUESTIONS,
  calcBodyTextScore,
  figmaCamouflageStyle,
  figmaRectStyle,
} from './body-text-complete'

type BodyTextCompleteScreenProps = {
  correctCount: number
  onContinue?: () => void
}

export function BodyTextCompleteScreen({
  correctCount,
  onContinue,
}: BodyTextCompleteScreenProps) {
  const score = calcBodyTextScore(correctCount)
  useEnterToContinue(onContinue)

  return (
    <FigmaAssetFrame
      src={BODY_TEXT_COMPLETE_ASSET}
      alt="본문 학습 완료"
      bgClassName="bg-gradient-to-b from-[#D3EFFE] to-[#F0FAFF]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={figmaCamouflageStyle(BODY_TEXT_COMPLETE_SCORE)}
      />
      <p
        className={`pointer-events-none absolute flex items-center justify-center bg-gradient-to-b from-[#0E9CF7] to-[#0085E9] bg-clip-text ${EXERCISE_SCORE_CLASS} text-transparent`}
        style={figmaRectStyle(BODY_TEXT_COMPLETE_SCORE)}
      >
        {score}
      </p>

      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full bg-white"
        style={figmaRectStyle(BODY_TEXT_COMPLETE_CORRECT_LABEL)}
      />
      <p
        className={`pointer-events-none absolute flex items-center justify-center ${EXERCISE_SCORE_LABEL_CLASS}`}
        style={figmaRectStyle(BODY_TEXT_COMPLETE_CORRECT_LABEL)}
      >
        {BODY_TEXT_TOTAL_QUESTIONS}문제 중 {correctCount}개 정답
      </p>

      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={figmaCamouflageStyle(BODY_TEXT_COMPLETE_BAKED_SUBTITLE_MASK)}
      />

      {onContinue && (
        <button
          type="button"
          aria-label="계속하기"
          className={`absolute z-10 flex cursor-pointer items-center justify-center rounded-[20px] border border-white ${EXERCISE_CTA_CLASS} text-white shadow-sm`}
          style={{
            ...figmaRectStyle(BODY_TEXT_COMPLETE_PRIMARY_BTN),
            background: 'linear-gradient(to bottom, #5BA3F5, #3C86FF)',
          }}
          onClick={onContinue}
        >
          계속하기
        </button>
      )}
    </FigmaAssetFrame>
  )
}
