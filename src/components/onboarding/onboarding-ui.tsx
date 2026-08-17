import { useState } from 'react'
import { TermsDocSheet } from './TermsDocSheet'
import {
  ONBOARDING_BODY_CLASS,
  ONBOARDING_BUTTON_LABEL_CLASS,
  ONBOARDING_CAPTION_CLASS,
  ONBOARDING_CHECK_RING,
  ONBOARDING_CHECK_SIZE,
  ONBOARDING_CTA_BG,
  ONBOARDING_CTA_BG_DISABLED,
  ONBOARDING_CTA_RADIUS_CLASS,
  ONBOARDING_OPTION_LABEL_X,
  ONBOARDING_TEXT,
  ONBOARDING_TEXT_MUTED,
} from './onboarding-typography'

export const FRAME_W = 393
export const FRAME_H = 852

/** Figma 393×852 — 하단 CTA 버튼 자리 (x=30 y=741 w=333 h=60) */
export const NEXT_BTN =
  'absolute left-[7.63%] top-[86.97%] h-[7.04%] w-[84.73%]'

/** Figma 393×852 — 입력 필드 (x=22.5 y=230.5 w=347 h=60) */
export const INPUT_FIELD =
  `absolute left-[5.73%] top-[27.05%] h-[7.04%] w-[88.29%] bg-transparent px-4 outline-none ${ONBOARDING_BODY_CLASS} ${ONBOARDING_TEXT} placeholder:text-[#767676]`

/** Figma 393×852 — 입력 필드 하단 안내 */
export const INPUT_HINT =
  `absolute left-[5.73%] top-[35.8%] w-[88.29%] pl-3 ${ONBOARDING_CAPTION_CLASS} ${ONBOARDING_TEXT_MUTED}`

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

/** 시안에 구워진 문구를 가리는 덮개 (라벨보다 넓게) */
export const TERM_LABEL_COVER = { x: 50, w: 280, h: 34 } as const

/** React 라벨 — 시안 문구와 같은 x에서 시작한다 */
export const TERM_LABEL_RECT = {
  x: ONBOARDING_OPTION_LABEL_X,
  w: 330 - ONBOARDING_OPTION_LABEL_X,
  h: 34,
} as const

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

/** 특수문자 제거 — 숫자·영문·한글·공백만 남긴다 */
function stripSpecialCharacters(value: string): string {
  return value.replace(/[^0-9a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, '')
}

export function sanitizeSchoolNameInput(value: string): string {
  return stripSpecialCharacters(value)
}

/**
 * 이름 입력 제한 — 학생·선생님 온보딩 공용.
 * 이름 화면 SVG(`onboarding-teacher-02-school.svg`, 파일명과 달리 "이름을 적어주세요")에
 * "2 ~ 5자 이내여야 하고 특수문자는 허용되지 않아요"가 그려져 있다.
 */
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 5

export function sanitizeNameInput(value: string): string {
  return stripSpecialCharacters(value).slice(0, NAME_MAX_LENGTH)
}

/**
 * 온보딩 선택 원 — 약관 동의·학년·회원 유형이 전부 같은 모양을 쓴다.
 *
 * `hasBakedRing`(기본 true): 시안 이미지에 회색 링이 이미 그려져 있으므로
 * 선택됐을 때만 파란 원을 덮어 그린다. Figma 에셋이 없는 화면(회원 유형)은
 * `hasBakedRing={false}`로 두면 미선택 링까지 직접 그린다.
 */
export function CircleCheckbox({
  checked,
  cx,
  cy,
  label,
  onToggle,
  hasBakedRing = true,
}: {
  checked: boolean
  cx: number
  cy: number
  label: string
  onToggle: () => void
  hasBakedRing?: boolean
}) {
  const circle = figmaRect(cx, cy, ONBOARDING_CHECK_SIZE)

  return (
    <button
      type="button"
      aria-label={`${label} ${checked ? '선택됨' : '선택 안 됨'}`}
      aria-pressed={checked}
      className="absolute z-[3] cursor-pointer bg-transparent p-0"
      style={circle}
      onClick={onToggle}
    >
      {checked ? (
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
      ) : hasBakedRing ? null : (
        <span
          className={`block h-full w-full rounded-full ${ONBOARDING_CHECK_RING}`}
        />
      )}
    </button>
  )
}

/**
 * 온보딩 하단 CTA — 전 화면 같은 자리·크기·글자(18px Bold).
 *
 * `hasBakedButton`(기본 true): 시안 이미지에 회색 비활성 버튼이 그려져 있어
 * 비활성일 땐 투명 히트 영역만 얹는다. 에셋이 없는 화면(회원 유형)은
 * `hasBakedButton={false}`로 두면 비활성 버튼까지 직접 그린다.
 */
export function NextStepButton({
  enabled,
  onClick,
  label = '다음',
  hasBakedButton = true,
}: {
  enabled: boolean
  onClick: () => void
  label?: string
  hasBakedButton?: boolean
}) {
  const painted = enabled || !hasBakedButton

  return (
    <button
      type="button"
      aria-label={label}
      disabled={!enabled}
      onClick={onClick}
      className={`${NEXT_BTN} ${ONBOARDING_CTA_RADIUS_CLASS} ${ONBOARDING_BUTTON_LABEL_CLASS} ${
        enabled
          ? `cursor-pointer ${ONBOARDING_CTA_BG} text-white`
          : `cursor-not-allowed ${
              hasBakedButton
                ? 'bg-transparent'
                : `${ONBOARDING_CTA_BG_DISABLED} text-white`
            }`
      }`}
    >
      {painted ? label : null}
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
        const coverStyle = figmaAbsRect({
          x: TERM_LABEL_COVER.x,
          y: row.cy - TERM_LABEL_COVER.h / 2,
          w: TERM_LABEL_COVER.w,
          h: TERM_LABEL_COVER.h,
        })
        const labelStyle = figmaAbsRect({
          x: TERM_LABEL_RECT.x,
          y: row.cy - TERM_LABEL_RECT.h / 2,
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
            {/* 시안에 구워진 문구 덮개 */}
            <span
              aria-hidden
              className="pointer-events-none absolute z-[3] block bg-[#fefefe]"
              style={coverStyle}
            />
            <span
              aria-hidden
              className={`pointer-events-none absolute z-[3] flex items-center text-left ${ONBOARDING_BODY_CLASS} ${ONBOARDING_TEXT}`}
              style={labelStyle}
            >
              <span className={`mr-1 shrink-0 ${ONBOARDING_TEXT_MUTED}`}>
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
