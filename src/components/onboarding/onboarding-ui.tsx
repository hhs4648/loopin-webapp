export const FRAME_W = 393
export const FRAME_H = 852

/** Figma 393×852 — 다음 버튼 */
export const NEXT_BTN =
  'absolute left-[7.63%] top-[86.97%] h-[7.04%] w-[84.73%]'

/** Figma 393×852 — 입력 필드 */
export const INPUT_FIELD =
  'absolute left-[5.73%] top-[27.05%] h-[7.04%] w-[88.29%] bg-transparent px-4 text-base text-[#1e1e1e] outline-none placeholder:text-[#767676]'

/** Figma 393×852 — 입력 필드 하단 안내 */
export const INPUT_HINT =
  'absolute left-[5.73%] top-[35.8%] w-[88.29%] pl-3 text-sm text-[#767676]'

export const TERM_ROWS = [
  { id: 'service', cx: 32, cy: 242, label: '서비스 이용약관', required: true },
  { id: 'privacy', cx: 32, cy: 310, label: '개인정보 처리방침', required: true },
  { id: 'marketing', cx: 32, cy: 378, label: '마케팅 정보 수신', required: false },
] as const

export const AGREE_ALL_ROW = { cx: 31, cy: 689, label: '모두 동의합니다' }

export type TermId = (typeof TERM_ROWS)[number]['id']

export type TermState = Record<TermId, boolean>

export function figmaRect(cx: number, cy: number, size: number) {
  const half = size / 2
  return {
    left: `${((cx - half) / FRAME_W) * 100}%`,
    top: `${((cy - half) / FRAME_H) * 100}%`,
    width: `${(size / FRAME_W) * 100}%`,
    height: `${(size / FRAME_H) * 100}%`,
  }
}

export function sanitizeSchoolNameInput(value: string): string {
  return value.replace(/[^0-9a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, '')
}

export function CircleCheckbox({
  checked,
  cx,
  cy,
  label,
  onToggle,
}: {
  checked: boolean
  cx: number
  cy: number
  label: string
  onToggle: () => void
}) {
  const circle = figmaRect(cx, cy, 21)

  return (
    <button
      type="button"
      aria-label={`${label} ${checked ? '선택됨' : '선택 안 됨'}`}
      aria-pressed={checked}
      className="absolute cursor-pointer bg-transparent p-0"
      style={circle}
      onClick={onToggle}
    >
      {checked && (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-[#2AA3FF]">
          <svg
            viewBox="0 0 12 10"
            className="h-[45%] w-[55%]"
            fill="none"
            aria-hidden
          >
            <path
              d="M1 5.2L4.2 8.4L11 1.4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </button>
  )
}

export function NextStepButton({
  enabled,
  onClick,
}: {
  enabled: boolean
  onClick: () => void
}) {
  if (!enabled) {
    return (
      <button
        type="button"
        aria-label="다음"
        className={`${NEXT_BTN} cursor-not-allowed bg-transparent`}
        disabled
      />
    )
  }

  return (
    <button
      type="button"
      aria-label="다음"
      className={`${NEXT_BTN} cursor-pointer rounded-[19px] bg-[#2AA3FF] text-sm font-semibold text-white`}
      onClick={onClick}
    >
      다음
    </button>
  )
}

export function TermsStep({
  terms,
  onToggleTerm,
  onToggleAgreeAll,
  onNext,
}: {
  terms: TermState
  onToggleTerm: (id: TermId) => void
  onToggleAgreeAll: () => void
  onNext: () => void
}) {
  const requiredTermsAccepted = TERM_ROWS.filter((row) => row.required).every(
    (row) => terms[row.id],
  )
  const allTermsChecked = TERM_ROWS.every((row) => terms[row.id])

  return (
    <>
      {TERM_ROWS.map((row) => (
        <CircleCheckbox
          key={row.id}
          checked={terms[row.id]}
          cx={row.cx}
          cy={row.cy}
          label={row.label}
          onToggle={() => onToggleTerm(row.id)}
        />
      ))}

      <CircleCheckbox
        checked={allTermsChecked}
        cx={AGREE_ALL_ROW.cx}
        cy={AGREE_ALL_ROW.cy}
        label={AGREE_ALL_ROW.label}
        onToggle={onToggleAgreeAll}
      />

      <NextStepButton enabled={requiredTermsAccepted} onClick={onNext} />
    </>
  )
}
