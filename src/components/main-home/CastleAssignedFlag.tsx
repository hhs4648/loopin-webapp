import type { CSSProperties } from 'react'

type CastleAssignedFlagProps = {
  /** 성 메인 컬러 — 뱃지 원 채움 (`getCastleAccentColor`) */
  color: string
  style: CSSProperties
  /** 다음에 풀 성 하나만 true — 살짝 튀어오른다 */
  next?: boolean
  alt?: string
}

/**
 * 과제 부여·미시작 성 마커 — **깃발**.
 *
 * 맵 SVG에 구워진 자물쇠(흰 원)를 덮는다. 예전에는 부여된 성도 자물쇠 그대로여서
 * **부여된 성과 아직 안 준 성이 똑같이 보였다.** 자물쇠는 「아직 안 준 성」에만 남기고,
 * 부여된 성은 이 깃발로 「도전 가능」을 표시한다.
 *
 * 완료 별표(`MissionCheckBadge`)와 **같은 원형 뱃지 계열**이되 글리프가 별↔깃발로
 * 확실히 달라, 색만으로 구분하지 않는다. 뷰박스·크기도 별표와 같아
 * `fullMapMarkerStyle` 자리에 그대로 들어간다.
 */
export function CastleAssignedFlag({
  color,
  style,
  next = false,
  alt = '과제 부여됨',
}: CastleAssignedFlagProps) {
  // 인스턴스마다 filter id 충돌 방지
  const filterId = `castle-flag-shadow-${color.replace('#', '')}`

  return (
    <svg
      aria-label={alt}
      role="img"
      viewBox="0 0 67 67"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute z-[2] object-contain"
      style={{
        ...style,
        ...(next
          ? { animation: 'castle-retry-bounce 1.1s ease-in-out infinite' }
          : {}),
      }}
    >
      {/* 은은한 아우라 — 성 색. 다음에 풀 성은 조금 더 진하게 */}
      <circle
        cx="33.5"
        cy="33.5"
        r="33.5"
        fill={color}
        fillOpacity={next ? 0.28 : 0.18}
      />
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
      {/*
        깃대 + 깃발. 글리프 무게중심이 원 중심(33.5)에 오도록 통째로 1.5 왼쪽으로 민다 —
        깃발이 오른쪽에만 달려서 좌표 그대로 두면 오른쪽으로 쏠려 보인다.
      */}
      <rect
        x="24.9"
        y="21.8"
        width="2.9"
        height="23.4"
        rx="1.45"
        fill="white"
      />
      <path
        d="M27.8 23.6H41.4C42.1 23.6 42.5 24.4 42 24.9L38.1 29.2C37.8 29.6 37.8 30.1 38.1 30.4L42 34.7C42.5 35.2 42.1 36 41.4 36H27.8V23.6Z"
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
