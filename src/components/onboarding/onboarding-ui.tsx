import { useState } from 'react'
import { TermsDocSheet } from './TermsDocSheet'
import {
  ONBOARDING_TERM_LABEL_CLASS,
} from './onboarding-chrome'

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

/**
 * 약관 행 — 체크/라벨로 동의, `>` 로 전문 보기.
 * 순서: 개인정보 처리방침 → 서비스 이용약관 → 마케팅 수신 안내
 */
export const TERM_ROWS = [
  {
    id: 'privacy',
    cx: 32,
    cy: 242,
    label: '개인정보 처리방침',
    required: true,
    docUrl: '/legal/privacy.html',
  },
  {
    id: 'service',
    cx: 32,
    cy: 310,
    label: '서비스 이용약관',
    required: true,
    docUrl: '/legal/terms.html',
  },
  {
    id: 'marketing',
    cx: 32,
    cy: 378,
    label: '마케팅 수신 안내',
    required: false,
    docUrl: '/legal/marketing.html',
  },
] as const

/** 체크·라벨 영역 (동의 토글) — › 제외 */
export const TERM_TOGGLE_HIT = { x: 16, w: 320, h: 52 } as const

/** Figma › chevron 근처 — 전문 보기 */
export const TERM_CHEVRON_HIT = { x: 340, w: 44, h: 52 } as const

/** 베이크된 문구 덮개 + React 라벨 */
export const TERM_LABEL_RECT = { x: 50, w: 280, h: 34 } as const

export const AGREE_ALL_ROW = { cx: 31, cy: 689, label: '모두 동의합니다' }

export type TermId = (typeof TERM_ROWS)[number]['id']

export type TermState = Record<TermId, boolean>

export function termDisplayLabel(row: (typeof TERM_ROWS)[number]): string {
  return row.required ? `[필수] ${row.label}` : `[선택] ${row.label}`
}

export function figmaRect(cx: number, cy: number, size: number) {
  const half = size / 2
  return {
    left: `${((cx - half) / FRAME_W) * 100}%`,
    top: `${((cy - half) / FRAME_H) * 100}%`,
    width: `${(size / FRAME_W) * 100}%`,
    height: `${(size / FRAME_H) * 100}%`,
  }
}

export type FigmaOnboardingRect = { x: number; y: number; w: number; h: number }

/** x/y/w/h 사각형(좌상단 기준) → 393×852 프레임 퍼센트 좌표 */
export function figmaAbsRect(rect: FigmaOnboardingRect) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
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
      className="absolute z-[3] cursor-pointer bg-transparent p-0"
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
  const [openTermId, setOpenTermId] = useState<TermId | null>(null)

  const requiredTermsAccepted = TERM_ROWS.filter((row) => row.required).every(
    (row) => terms[row.id],
  )
  const allTermsChecked = TERM_ROWS.every((row) => terms[row.id])
  const openRow = openTermId
    ? TERM_ROWS.find((r) => r.id === openTermId)
    : undefined

  return (
    <>
      {TERM_ROWS.map((row) => {
        const display = termDisplayLabel(row)
        const rowTop = row.cy - TERM_TOGGLE_HIT.h / 2
        const toggleStyle = figmaAbsRect({
          x: TERM_TOGGLE_HIT.x,
          y: rowTop,
          w: TERM_TOGGLE_HIT.w,
          h: TERM_TOGGLE_HIT.h,
        })
        const chevronStyle = figmaAbsRect({
          x: TERM_CHEVRON_HIT.x,
          y: rowTop,
          w: TERM_CHEVRON_HIT.w,
          h: TERM_CHEVRON_HIT.h,
        })
        const labelTop = row.cy - TERM_LABEL_RECT.h / 2
        const labelStyle = figmaAbsRect({
          x: TERM_LABEL_RECT.x,
          y: labelTop,
          w: TERM_LABEL_RECT.w,
          h: TERM_LABEL_RECT.h,
        })
        return (
          <div key={row.id}>
            {/* 체크·라벨 → 동의 토글 */}
            <button
              type="button"
              aria-label={`${display} ${terms[row.id] ? '선택됨' : '선택 안 됨'}`}
              className="absolute z-[2] cursor-pointer bg-transparent"
              style={toggleStyle}
              onClick={() => onToggleTerm(row.id)}
            />
            <CircleCheckbox
              checked={terms[row.id]}
              cx={row.cx}
              cy={row.cy}
              label={display}
              onToggle={() => onToggleTerm(row.id)}
            />
            <span
              aria-hidden
              className={`pointer-events-none absolute z-[3] flex items-center bg-[#fefefe] px-0 text-left ${ONBOARDING_TERM_LABEL_CLASS}`}
              style={labelStyle}
            >
              <span className="mr-1 shrink-0 text-[#767676]">
                {row.required ? '[필수]' : '[선택]'}
              </span>
              <span className="truncate">{row.label}</span>
            </span>
            {/* › → 전문 보기 */}
            <button
              type="button"
              aria-label={`${row.label} 전문 보기`}
              className="absolute z-[4] cursor-pointer bg-transparent"
              style={chevronStyle}
              onClick={() => setOpenTermId(row.id)}
            />
          </div>
        )
      })}

      <CircleCheckbox
        checked={allTermsChecked}
        cx={AGREE_ALL_ROW.cx}
        cy={AGREE_ALL_ROW.cy}
        label={AGREE_ALL_ROW.label}
        onToggle={onToggleAgreeAll}
      />

      <NextStepButton enabled={requiredTermsAccepted} onClick={onNext} />

      {openRow ? (
        <TermsDocSheet
          label={openRow.label}
          docUrl={openRow.docUrl}
          onClose={() => setOpenTermId(null)}
        />
      ) : null}
    </>
  )
}
