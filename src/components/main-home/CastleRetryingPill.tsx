import type { CSSProperties } from 'react'

type CastleStatusPillTone = 'coral' | 'sky'

type CastleStatusPillProps = {
  style: CSSProperties
  label: string
  /** coral = 재도전/진행중 · sky = 과제 부여됨 */
  tone?: CastleStatusPillTone
  /** 재도전·진행중만 바운스 */
  bounce?: boolean
}

const TONE_CLASS: Record<CastleStatusPillTone, string> = {
  coral: 'bg-[#FF8A65] shadow-[0_3px_0_#E56A45]',
  sky: 'bg-[#4F91EA] shadow-[0_3px_0_#3A7BD5]',
}

/**
 * 성 자물쇠/별표 **자리** 상단 상태 필.
 * 베이크 자물쇠·별표를 덮어 상태를 보여 준다.
 */
export function CastleStatusPill({
  style,
  label,
  tone = 'coral',
  bounce = false,
}: CastleStatusPillProps) {
  return (
    <div
      aria-label={label}
      className={`pointer-events-none absolute z-[40] flex items-center justify-center rounded-full ${TONE_CLASS[tone]}`}
      style={{
        ...style,
        ...(bounce
          ? { animation: 'castle-retry-bounce 1.1s ease-in-out infinite' }
          : {}),
      }}
    >
      <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] font-bold leading-none tracking-[-0.02em] text-white">
        {label}
      </span>
    </div>
  )
}

type CastleRetryingPillProps = {
  style: CSSProperties
  /** 기본 「재도전 중!」 · 풀이 중 성은 「진행중」 */
  label?: string
}

/** @deprecated `CastleStatusPill` tone=coral 사용 */
export function CastleRetryingPill({
  style,
  label = '재도전 중!',
}: CastleRetryingPillProps) {
  return <CastleStatusPill style={style} label={label} tone="coral" bounce />
}
