import type { CSSProperties } from 'react'

/**
 * 맵 성 — `map-castle.svg`를 인라인으로 옮긴 것.
 *
 * `<img>`가 아니라 인라인 SVG인 이유는 **성마다 색을 다르게** 칠하기 위해서다
 * (`getCastleAccentColor`). 파일로 두면 색을 바꿀 수 없어 105개가 전부 같은 빨강이 된다.
 *
 * 원본은 빨강 계열 한 벌뿐이라, 강조색 하나에서 밝기만 바꿔 팔레트를 만든다.
 * 창문(연한 하늘색)·깃대(어두운 색)는 성 색과 무관하게 고정 — 원본 그대로다.
 */

/** `#RRGGBB` → 밝기 조정. `amount > 0`이면 흰색 쪽, `< 0`이면 검정 쪽으로 섞는다. */
function shade(hex: string, amount: number): string {
  const value = hex.replace('#', '')
  const to = amount > 0 ? 255 : 0
  const ratio = Math.abs(amount)
  const channel = (offset: number) => {
    const base = parseInt(value.slice(offset, offset + 2), 16)
    return Math.round(base + (to - base) * ratio)
  }
  return `rgb(${channel(0)}, ${channel(2)}, ${channel(4)})`
}

export function MapCastleSprite({
  color,
  style,
  className = '',
  title,
}: {
  /** 성 강조색 — `getCastleAccentColor(index)` */
  color: string
  style?: CSSProperties
  className?: string
  title?: string
}) {
  // 원본(#FD3D3D→#FCAB1F 몸통, #FF8E90→#FFC866 성벽, #DE4D50 흉벽)의 명도 관계를 그대로 옮겼다
  const towerTop = color
  const towerBottom = shade(color, 0.45)
  const wallTop = shade(color, 0.4)
  const wallBottom = shade(color, 0.62)
  const battlement = shade(color, -0.14)

  const uid = `castle-${color.replace('#', '')}`

  return (
    <svg
      viewBox="0 0 74 82"
      className={className}
      style={style}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`${uid}-tower`} x1="37" y1="30.87" x2="37" y2="81.58" gradientUnits="userSpaceOnUse">
          <stop stopColor={towerTop} />
          <stop offset="1" stopColor={towerBottom} stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`${uid}-wall`} x1="37" y1="42.63" x2="63.56" y2="100.34" gradientUnits="userSpaceOnUse">
          <stop stopColor={wallTop} />
          <stop offset="1" stopColor={wallBottom} />
        </linearGradient>
        <linearGradient id={`${uid}-pole`} x1="32.06" y1="0" x2="32.06" y2="64.35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9D5353" />
          <stop offset="1" stopColor="#252433" />
        </linearGradient>
        <linearGradient id={`${uid}-flag`} x1="1.93" y1="-1.51" x2="58.39" y2="-0.58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFCF75" />
          <stop offset="1" stopColor="#D9C6FF" />
        </linearGradient>
        <linearGradient id={`${uid}-door`} x1="37" y1="62.41" x2="37" y2="81.58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF0B4" stopOpacity="0.25" />
          <stop offset="0.55" stopColor="#FFF6D2" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFFEF5" />
        </linearGradient>
      </defs>

      {/* 깃대 */}
      <path d="M33.8245 1.83745C33.8245 0.822655 33.0357 0 32.0627 0C31.0896 0 30.3008 0.822655 30.3008 1.83745V29.0317C30.3008 30.0464 31.0896 30.8691 32.0627 30.8691C33.0357 30.8691 33.8245 30.0464 33.8245 29.0317V1.83745Z" fill={`url(#${uid}-pole)`} />
      {/* 깃발 */}
      <path d="M30.3008 12.4967H47.0431C48.3056 12.4967 49.3287 11.4297 49.3287 10.1131V4.59036C49.3287 3.27413 48.3056 2.20703 47.0431 2.20703H30.3008V12.4967Z" fill={`url(#${uid}-flag)`} />
      {/* 성벽 */}
      <path d="M6.34262 42.6328C7.89948 42.6328 9.16187 43.9484 9.16187 45.5721V47.7755H11.9802V45.5721C11.9802 43.9484 13.2425 42.6328 14.7994 42.6328H18.3228C19.8796 42.6328 21.142 43.9484 21.142 45.5721V47.7755H52.8563V45.5721C52.8563 43.9484 54.1188 42.6328 55.6756 42.6328H59.1986C60.7555 42.6328 62.018 43.9484 62.018 45.5721V47.7755H64.8363V45.5721C64.8363 43.9484 66.0988 42.6328 67.6557 42.6328H71.1787C72.7355 42.6328 73.998 43.9484 73.998 45.5721V47.7755H73.999V75.7047C73.999 78.9519 71.474 81.5842 68.3603 81.5842H5.63754C2.524 81.5842 0 78.9519 0 75.7047V45.5721C0 43.9484 1.26238 42.6328 2.81925 42.6328H6.34262Z" fill={`url(#${uid}-wall)`} />
      {/* 가운데 탑 */}
      <path d="M50.0367 30.8711H23.9609V81.5846H50.0367V30.8711Z" fill={`url(#${uid}-tower)`} />
      {/* 문 */}
      <path d="M31.4492 81.5836V71.2176C31.4492 68.0207 33.9336 65.4297 36.9991 65.4297C40.0646 65.4297 42.549 68.0207 42.549 71.2176V81.5836H31.4492Z" fill={`url(#${uid}-door)`} />
      {/* 흉벽 */}
      <path d="M21.1445 23.5184C21.1445 21.8948 22.4067 20.5781 23.9636 20.5781H27.4873C29.0445 20.5781 30.306 21.8948 30.306 23.5184V25.7229H21.1445V23.5184Z" fill={battlement} />
      <path d="M21.1445 25.7227H52.8579V30.1326C52.8579 31.7562 51.5964 33.0718 50.0395 33.0718H23.9636C22.4067 33.0718 21.1445 31.7562 21.1445 30.1326V25.7227Z" fill={battlement} />
      <path d="M32.418 23.5184C32.418 21.8948 33.6805 20.5781 35.2373 20.5781H38.7603C40.3172 20.5781 41.5797 21.8948 41.5797 23.5184V25.7229H32.418V23.5184Z" fill={battlement} />
      <path d="M43.6953 23.5184C43.6953 21.8948 44.9568 20.5781 46.5137 20.5781H50.0376C51.5945 20.5781 52.857 21.8948 52.857 23.5184V25.7229H43.6953V23.5184Z" fill={battlement} />
      {/* 창문 — 성 색과 무관하게 고정 */}
      <path d="M65.539 54.3867H58.4915C57.7131 54.3867 57.082 55.0448 57.082 55.8567V63.2064C57.082 64.0183 57.7131 64.6764 58.4915 64.6764H65.539C66.3174 64.6764 66.9485 64.0183 66.9485 63.2064V55.8567C66.9485 55.0448 66.3174 54.3867 65.539 54.3867Z" fill="#E8F3FF" />
      <path d="M40.8766 39.6875H33.1243C32.3459 39.6875 31.7148 40.3456 31.7148 41.1575V48.5072C31.7148 49.3191 32.3459 49.9772 33.1243 49.9772H40.8766C41.655 49.9772 42.2861 49.3191 42.2861 48.5072V41.1575C42.2861 40.3456 41.655 39.6875 40.8766 39.6875Z" fill="#E8F3FF" />
      <path d="M15.5038 54.3867H8.45638C7.67794 54.3867 7.04688 55.0448 7.04688 55.8567V63.2064C7.04688 64.0183 7.67794 64.6764 8.45638 64.6764H15.5038C16.2823 64.6764 16.9133 64.0183 16.9133 63.2064V55.8567C16.9133 55.0448 16.2823 54.3867 15.5038 54.3867Z" fill="#E8F3FF" />
    </svg>
  )
}
