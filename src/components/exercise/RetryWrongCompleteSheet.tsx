import { playTapSfx } from './answer-sfx'
import {
  EXERCISE_CTA_CLASS,
  EXERCISE_SHEET_TITLE_CLASS,
} from './exercise-typography'
import { figmaRectStyle, RETRY_WRONG_COMPLETE_SHEET } from './retry-wrong-ui'

type RetryWrongCompleteSheetProps = {
  onHome?: () => void
}

export function RetryWrongCompleteSheet({ onHome }: RetryWrongCompleteSheetProps) {
  return (
    <div className="absolute z-20" style={figmaRectStyle(RETRY_WRONG_COMPLETE_SHEET)}>
      <div className="flex h-full flex-col rounded-t-[24px] border-t border-[#E4E7EA] bg-white px-[30px] pb-[41px] pt-[30px] shadow-[0_-10px_24px_rgba(0,0,0,0.06)]">
        <p className={EXERCISE_SHEET_TITLE_CLASS}>
          오답 문제를 다 풀었습니다
        </p>
        {onHome && (
          <button
            type="button"
            aria-label="홈"
            className={`mt-auto flex h-[60px] w-full cursor-pointer items-center justify-center rounded-2xl border border-white ${EXERCISE_CTA_CLASS} text-white shadow-sm`}
            style={{ background: 'linear-gradient(to bottom, #5BA3F5, #3C86FF)' }}
            onClick={() => {
              playTapSfx()
              onHome?.()
            }}
          >
            홈
          </button>
        )}
      </div>
    </div>
  )
}
