import {
  onboardingContentXStyle,
  onboardingTitleTopStyle,
} from './onboarding-chrome'
import {
  ONBOARDING_BODY_CLASS,
  ONBOARDING_CAPTION_CLASS,
  ONBOARDING_OPTION_LABEL_X,
  ONBOARDING_TEXT,
  ONBOARDING_TEXT_MUTED,
  ONBOARDING_TITLE_CLASS,
} from './onboarding-typography'
import { CircleCheckbox, NextStepButton, figmaAbsRect } from './onboarding-ui'

export type AgeGateChoice = 'over14' | 'under14'

const AGE_ROWS: { id: AgeGateChoice; cy: number; label: string }[] = [
  { id: 'over14', cy: 244, label: '만 14세 이상이에요' },
  { id: 'under14', cy: 318, label: '만 14세 미만이에요' },
]

const OPTION_ROW_H = 24

/**
 * Apple 5.1.1(v) — 생년월일은 받지 않는다.
 * 만 14세 미만만 학부모 SMS 동의로 보낸다(개인정보 보호법).
 */
export function AgeGateStep({
  value,
  onChange,
  onNext,
}: {
  value: AgeGateChoice | null
  onChange: (next: AgeGateChoice) => void
  onNext: () => void
}) {
  return (
    <>
      <header
        className="absolute inset-x-0 top-0 z-[2]"
        style={{ ...onboardingTitleTopStyle(), ...onboardingContentXStyle() }}
      >
        <h1 className={ONBOARDING_TITLE_CLASS}>나이를 알려주세요</h1>
        <p className={`mt-2 ${ONBOARDING_CAPTION_CLASS} ${ONBOARDING_TEXT_MUTED}`}>
          만 14세 미만은 보호자 동의가 필요해요
        </p>
      </header>

      <div role="radiogroup" aria-label="만 14세 여부">
        {AGE_ROWS.map((row) => (
          <div key={row.id}>
            <CircleCheckbox
              checked={value === row.id}
              cx={32}
              cy={row.cy}
              label={row.label}
              hasBakedRing={false}
              onToggle={() => onChange(row.id)}
            />
            <button
              type="button"
              role="radio"
              aria-checked={value === row.id}
              className={`absolute z-[2] flex items-center bg-transparent p-0 text-left ${ONBOARDING_BODY_CLASS} ${ONBOARDING_TEXT}`}
              style={figmaAbsRect({
                x: ONBOARDING_OPTION_LABEL_X,
                y: row.cy - OPTION_ROW_H / 2,
                w: 330 - ONBOARDING_OPTION_LABEL_X,
                h: OPTION_ROW_H,
              })}
              onClick={() => onChange(row.id)}
            >
              {row.label}
            </button>
          </div>
        ))}
      </div>

      <NextStepButton
        enabled={value !== null}
        onClick={onNext}
        hasBakedButton={false}
      />
    </>
  )
}
