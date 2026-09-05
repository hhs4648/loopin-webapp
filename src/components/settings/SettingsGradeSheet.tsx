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
      <div className="shrink-0 rounded-t-[28px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-12px_32px_rgba(15,23,42,0.12)]">
        <div
          className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-gradient-to-r from-[#2AA3FF]/30 via-[#B2F165]/80 to-[#2AA3FF]/30"
          aria-hidden
        />
        <h2 className="mb-3 font-sans text-[20px] font-extrabold tracking-[-0.03em] text-[#0B1220]">
          학년 변경
        </h2>
        <ul className="flex flex-col gap-2.5 pb-2">
          {SETTINGS_GRADE_OPTIONS.map((option) => {
            const selected = selectedId === option.id
            return (
              <li key={option.id}>
                <button
                  type="button"
                  aria-label={option.shortLabel}
                  aria-pressed={selected}
                  className={`flex h-[54px] w-full items-center justify-between rounded-[16px] px-4 font-sans text-[16px] font-bold transition-colors ${
                    selected
                      ? 'bg-[#2AA3FF] text-white shadow-[0_6px_16px_rgba(42,163,255,0.35)]'
                      : 'bg-[#F3F6FA] text-[#0B1220] hover:bg-[#E8F4FF]'
                  }`}
                  onClick={() => {
                    playTapSfx()
                    onSelect(option.id)
                  }}
                >
                  <span>{option.shortLabel}</span>
                  {selected ? (
                    <span className="text-[15px] font-extrabold" aria-hidden>
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
