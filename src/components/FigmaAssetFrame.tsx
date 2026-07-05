import type { ReactNode } from 'react'

interface FigmaAssetFrameProps {
  src: string
  alt: string
  bgClassName?: string
  children?: ReactNode
}

/** Figma Export 프레임(393×852) 표시용 공통 컨테이너 */
export function FigmaAssetFrame({
  src,
  alt,
  bgClassName = 'bg-white',
  children,
}: FigmaAssetFrameProps) {
  return (
    <div className={`flex min-h-dvh w-full justify-center ${bgClassName}`}>
      <div className="relative aspect-[393/852] w-full max-w-[393px] self-center">
        <img
          src={src}
          alt={alt}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          draggable={false}
        />
        {children}
      </div>
    </div>
  )
}
