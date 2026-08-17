import { playTapSfx } from '../exercise/answer-sfx'
import { useBackNavigation } from '../navigation/BackNavigationProvider'
import {
  SETTINGS_GRADE_OPTIONS,
  type SettingsMiddleGradeId,
} from './settings'

type SettingsGradeSheetProps = {
  selectedId: SettingsMiddleGradeId | null
  onSelect: (id: SettingsMiddleGradeId) => void
  onClose: () => void
}

/** 설정 「학년 변경」— 중1·중2·중3만 선택 */
export function SettingsGradeSheet({
  selectedId,
  onSelect,
  onClose,
}: SettingsGradeSheetProps) {
  useBackNavigation(onClose)

  return (
    <div
      className="absolute inset-0 z-[120] flex flex-col justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="학년 변경"
    >
      <button
        type="button"
        aria-label="닫기"
        className="min-h-0 flex-1 bg-transparent"
        onClick={() => {
          playTapSfx()
          onClose()
        }}
      />
      <div className="shrink-0 rounded-t-[24px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-10px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E5E7EB]" aria-hidden />
        <h2 className="mb-3 font-['Pretendard',sans-serif] text-[18px] font-bold text-[#111111]">
          학년 변경
        </h2>
        <ul className="flex flex-col gap-2 pb-2">
          {SETTINGS_GRADE_OPTIONS.map((option) => {
            const selected = selectedId === option.id
            return (
              <li key={option.id}>
                <button
                  type="button"
                  aria-label={option.shortLabel}
                  aria-pressed={selected}
                  className={`flex h-[52px] w-full items-center justify-between rounded-[14px] px-4 font-['Pretendard',sans-serif] text-[16px] font-semibold ${
                    selected
                      ? 'bg-[#E8F4FF] text-[#2AA3FF]'
                      : 'bg-[#F7F8FA] text-[#111111]'
                  }`}
                  onClick={() => {
                    playTapSfx()
                    onSelect(option.id)
                  }}
                >
                  <span>{option.shortLabel}</span>
                  {selected ? (
                    <span className="text-[14px] font-bold" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
