import { useState } from 'react'
import { playTapSfx } from '../exercise/answer-sfx'
import { useBackNavigation } from '../navigation/BackNavigationProvider'
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  sanitizeNameInput,
} from '../onboarding/onboarding-ui'

type SettingsNameSheetProps = {
  initialName: string
  /** 저장 결과 — 실패하면 시트를 닫지 않고 이유를 보여 준다 */
  onSubmit: (name: string) => Promise<{ ok: boolean; message?: string }>
  onClose: () => void
}

/**
 * 설정 「닉네임」— 이름 변경.
 *
 * 글자 수·특수문자 규칙은 **온보딩과 같은 함수**를 쓴다(`sanitizeNameInput`).
 * 여기서 따로 만들면 온보딩에서는 되는 이름이 설정에서는 안 되는 식으로 갈라진다.
 */
export function SettingsNameSheet({
  initialName,
  onSubmit,
  onClose,
}: SettingsNameSheetProps) {
  const [name, setName] = useState(() => sanitizeNameInput(initialName))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useBackNavigation(onClose)

  const trimmed = name.trim()
  const canSave = trimmed.length >= NAME_MIN_LENGTH && !saving

  async function handleSubmit() {
    if (!canSave) return
    playTapSfx()
    setError(null)
    setSaving(true)

    const result = await onSubmit(trimmed)
    if (!result.ok) {
      // 서버에 안 들어갔으면 닫지 않는다 — 닫으면 바뀐 줄 알고 넘어간다
      setError(result.message ?? '이름을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
      setSaving(false)
      return
    }
    onClose()
  }

  return (
    <div
      className="absolute inset-0 z-[120] flex flex-col justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="닉네임 변경"
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
      <form
        className="shrink-0 rounded-t-[24px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-10px_24px_rgba(0,0,0,0.08)]"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit()
        }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E5E7EB]" aria-hidden />
        <h2 className="mb-3 font-['Pretendard',sans-serif] text-[18px] font-bold text-[#111111]">
          닉네임 변경
        </h2>

        <label className="sr-only" htmlFor="settings-name-input">
          닉네임
        </label>
        <input
          id="settings-name-input"
          type="text"
          value={name}
          autoFocus
          autoComplete="off"
          maxLength={NAME_MAX_LENGTH}
          placeholder="이름을 입력해 주세요"
          onChange={(event) => {
            setName(sanitizeNameInput(event.target.value))
            setError(null)
          }}
          className="h-[52px] w-full rounded-[14px] bg-[#F7F8FA] px-4 font-['Pretendard',sans-serif] text-[16px] font-semibold text-[#111111] outline-none placeholder:font-medium placeholder:text-[#A5ADBA] focus:ring-2 focus:ring-[#2AA3FF]"
        />

        <p
          className={`mt-2 min-h-[18px] px-1 font-['Pretendard',sans-serif] text-[13px] font-medium ${
            error ? 'text-[#FF5A5A]' : 'text-[#8C94A1]'
          }`}
          role={error ? 'alert' : undefined}
        >
          {error ??
            `${NAME_MIN_LENGTH}~${NAME_MAX_LENGTH}자 이내여야 하고 특수문자는 쓸 수 없어요.`}
        </p>

        <div className="mt-3 flex gap-2 pb-2">
          <button
            type="button"
            className="h-[52px] flex-1 rounded-[14px] bg-[#F7F8FA] font-['Pretendard',sans-serif] text-[16px] font-bold text-[#667085]"
            onClick={() => {
              playTapSfx()
              onClose()
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="h-[52px] flex-1 rounded-[14px] bg-[#2AA3FF] font-['Pretendard',sans-serif] text-[16px] font-bold text-white disabled:opacity-40"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
