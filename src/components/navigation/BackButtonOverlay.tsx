import { useCurrentBackNavigation } from './BackNavigationProvider'
import {
  FIGMA_HEADER_BACK_HIT,
  figmaNavRectStyle,
  type FigmaNavRect,
} from './figma-navigation'

export type BackButtonOverlayVariant = 'figma-hit' | 'labeled'

type BackButtonOverlayProps = {
  variant?: BackButtonOverlayVariant
  hit?: FigmaNavRect
  className?: string
}

/**
 * Figma header `<` — path `M45.5 81.5L37 90L45.5 98.5` (약 17px 높이).
 * 텍스트 `<`(28px)는 제목과 겹쳐 보여서 SVG로 맞춤.
 */
function BackChevronIcon() {
  return (
    <svg
      aria-hidden
      width="12"
      height="20"
      viewBox="0 0 12 20"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M10 1.5L2 10L10 18.5"
        stroke="#A0AEB9"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BackButtonOverlay({
  variant = 'figma-hit',
  hit = FIGMA_HEADER_BACK_HIT,
  className = '',
}: BackButtonOverlayProps) {
  const { visible, onBack } = useCurrentBackNavigation()

  if (!visible) return null

  const isLabeled = variant === 'labeled'

  return (
    <button
      type="button"
      aria-label="뒤로가기"
      className={`absolute z-[100] flex cursor-pointer items-center justify-center bg-transparent ${className}`}
      style={figmaNavRectStyle(hit)}
      onClick={onBack}
    >
      {isLabeled ? <BackChevronIcon /> : null}
    </button>
  )
}
