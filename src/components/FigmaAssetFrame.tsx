import type { ReactNode } from 'react'
import {
  BackButtonOverlay,
  type BackButtonOverlayVariant,
} from './navigation/BackButtonOverlay'
import type { BackButtonMask } from './navigation/figma-navigation'
import { ComboOverlay } from './exercise/ComboOverlay'

interface FigmaAssetFrameProps {
  src: string
  alt: string
  bgClassName?: string
  /** false면 뒤로가기 버튼 미표시 */
  backButton?: false | BackButtonOverlayVariant
  /**
   * 에셋에 구워진 `<`를 가릴 덮개. 기본은 흰 헤더용.
   * 뒤로가기는 화면마다 좌표가 달랐어서 **한 자리로 통일**했고(`BACK_BUTTON_HIT`),
   * 구운 화살표는 이 덮개로 지운다. 배경이 흰색이 아닌 화면은 직접 넘겨야 한다.
   */
  backButtonMask?: BackButtonMask | null
  children?: ReactNode
}

/** Figma Export 프레임(393×852) 표시용 공통 컨테이너 */
export function FigmaAssetFrame({
  src,
  alt,
  bgClassName = 'bg-white',
  backButton = 'figma-hit',
  /**
   * 기본은 **덮개 없음**. 구운 `<`가 있는 화면만 명시적으로 넘긴다 —
   * 예전에 흰 덮개를 기본값으로 뒀다가, 화살표가 없는 하늘색 완료·캘린더 화면에
   * 흰 사각형이 그대로 보였다(2026-08-08).
   */
  backButtonMask = null,
  children,
}: FigmaAssetFrameProps) {
  return (
    <div className={`flex min-h-full w-full justify-center ${bgClassName}`}>
      <div className="relative aspect-[393/852] w-full max-w-[540px] self-center">
        <img
          src={src}
          alt={alt}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          draggable={false}
        />
        {backButton !== false ? (
          <BackButtonOverlay mask={backButtonMask ?? undefined} />
        ) : null}
        {children}
        {/*
          콤보 배지·버스트. 러너가 `ComboProvider`로 감쌌을 때만 그려진다 —
          설정 창처럼 러너 밖에서 이 컨테이너를 쓰는 화면에는 나타나지 않는다.
        */}
        <ComboOverlay />
      </div>
    </div>
  )
}

