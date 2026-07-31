import type { ReactNode } from 'react'
import {
  BackButtonOverlay,
  type BackButtonOverlayVariant,
} from './navigation/BackButtonOverlay'
import type { FigmaNavRect } from './navigation/figma-navigation'

interface FigmaAssetFrameProps {
  src: string
  alt: string
  bgClassName?: string
  /** false면 뒤로가기 버튼 미표시. 기본은 SVG `<` 위 투명 히트 영역 */
  backButton?: false | BackButtonOverlayVariant
  backButtonHit?: FigmaNavRect
  children?: ReactNode
}

/** Figma Export 프레임(393×852) 표시용 공통 컨테이너 */
export function FigmaAssetFrame({
  src,
  alt,
  bgClassName = 'bg-white',
  backButton = 'figma-hit',
  backButtonHit,
  children,
}: FigmaAssetFrameProps) {
  return (
    <div className={`flex min-h-dvh w-full justify-center ${bgClassName}`}>
      <div className="relative aspect-[393/852] w-full max-w-[540px] self-center">
        <img
          src={src}
          alt={alt}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          draggable={false}
        />
        {backButton !== false ? (
          <BackButtonOverlay
            variant={backButton}
            hit={backButtonHit}
          />
        ) : null}
        {children}
      </div>
    </div>
  )
}
