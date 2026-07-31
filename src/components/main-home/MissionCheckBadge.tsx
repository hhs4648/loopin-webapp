import type { CSSProperties } from 'react'

type MissionCheckBadgeProps = {
  /** 성 메인 컬러 — 별표 원 채움 */
  color: string
  style: CSSProperties
  alt?: string
}

/**
 * 완료 별표 (`별표.svg` → `mission-star.svg`).
 * 맵에 구워진 자물쇠를 덮고, 원 배경은 성 액센트 색과 동일.
 */
export function MissionCheckBadge({
  color,
  style,
  alt = '완료',
}: MissionCheckBadgeProps) {
  // 인스턴스마다 filter id 충돌 방지
  const filterId = `mission-star-shadow-${color.replace('#', '')}`

  return (
    <svg
      aria-label={alt}
      role="img"
      viewBox="0 0 67 67"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute z-[2] object-contain"
      style={style}
    >
      {/* 은은한 아우라 — 성 색 */}
      <circle cx="33.5" cy="33.5" r="33.5" fill={color} fillOpacity={0.18} />
      <g filter={`url(#${filterId})`}>
        <circle cx="33.4991" cy="33.4991" r="19.9405" fill={color} />
        <circle
          cx="33.4991"
          cy="33.4991"
          r="18.9435"
          stroke="white"
          strokeWidth="1.99405"
        />
      </g>
      <path
        d="M33.4987 22.3359L36.0058 30.0519L44.1188 30.0519L37.5552 34.8207L40.0623 42.5366L33.4987 37.7679L26.9351 42.5366L29.4422 34.8207L22.8786 30.0519L30.9916 30.0519L33.4987 22.3359Z"
        fill="white"
      />
      <defs>
        <filter
          id={filterId}
          x="8.77288"
          y="11.1657"
          width="49.4542"
          height="49.4542"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2.39286" />
          <feGaussianBlur stdDeviation="2.39286" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.1 0 0 0 0 0.15 0 0 0 0 0.3 0 0 0 0.18 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  )
}
