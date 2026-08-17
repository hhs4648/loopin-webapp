import type { ReactNode } from 'react'
import {
  ONBOARDING_HEADER_MASK_H,
  onboardingHeaderMaskStyle,
} from './onboarding-chrome'
import { OnboardingChrome } from './OnboardingChrome'

type OnboardingFigmaFrameProps = {
  src: string
  alt: string
  bgClassName?: string
  /** 베이크 헤더 덮개 색 — SVG 배경과 맞출 것 */
  headerMaskColor?: string
  children?: ReactNode
}

/**
 * 온보딩 Figma Export — 상단 98px 베이크 헤더를 가리고
 * React 상태바·뒤로가기를 동일 좌표로 올린다.
 */
export function OnboardingFigmaFrame({
  src,
  alt,
  bgClassName = 'bg-white',
  headerMaskColor = '#fefefe',
  children,
}: OnboardingFigmaFrameProps) {
  return (
    <div className={`flex min-h-full w-full justify-center ${bgClassName}`}>
      <div className="relative aspect-[393/852] w-full max-w-[540px] self-center">
        <img
          src={src}
          alt={alt}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          draggable={false}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[5]"
          style={{ ...onboardingHeaderMaskStyle(), background: headerMaskColor }}
        />
        <OnboardingChrome />
        {children}
      </div>
    </div>
  )
}

type OnboardingPhoneShellProps = {
  bgClassName?: string
  children?: ReactNode
}

/** Figma 에셋 없는 온보딩 화면(회원 유형 등) */
export function OnboardingPhoneShell({
  bgClassName = 'bg-white',
  children,
}: OnboardingPhoneShellProps) {
  return (
    <div className={`flex min-h-full w-full justify-center ${bgClassName}`}>
      <div className="relative aspect-[393/852] w-full max-w-[540px] self-center overflow-hidden">
        <OnboardingChrome />
        <div className="absolute inset-0 flex flex-col">{children}</div>
      </div>
    </div>
  )
}

export { ONBOARDING_HEADER_MASK_H }
