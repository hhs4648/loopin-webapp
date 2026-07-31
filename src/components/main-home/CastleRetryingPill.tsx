import type { CSSProperties } from 'react'

type CastleRetryingPillProps = {
  style: CSSProperties
}

/**
 * 완료 성 자물쇠(별표) **자리**의 「재도전 중!」 필.
 * 재도전 중엔 별표 대신 표시 · 끝나면 별표 복귀.
 */
export function CastleRetryingPill({ style }: CastleRetryingPillProps) {
  return (
    <div
      aria-label="재도전 중"
      className="pointer-events-none absolute z-[40] flex items-center justify-center rounded-full bg-[#FF8A65] shadow-[0_3px_0_#E56A45]"
      style={{
        ...style,
        animation: 'castle-retry-bounce 1.1s ease-in-out infinite',
      }}
    >
      <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] font-bold leading-none tracking-[-0.02em] text-white">
        재도전 중!
      </span>
    </div>
  )
}

/** 맵 화면 상단 고정 — 재도전 풀이 중임을 분명히 표시 */
export function RetryingStatusBanner() {
  return (
    <div
      role="status"
      aria-label="재도전 중"
      className="pointer-events-none absolute left-1/2 top-[7.5%] z-[45] -translate-x-1/2 rounded-full bg-[#FF8A65] px-4 py-2 shadow-[0_3px_0_#E56A45]"
    >
      <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[15px] font-bold leading-none tracking-[-0.02em] text-white">
        재도전 중!
      </span>
    </div>
  )
}
