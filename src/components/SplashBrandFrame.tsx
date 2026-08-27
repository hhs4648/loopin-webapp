import type { ReactNode } from 'react'

/** Figma `플래시화면` — 원본 `_design-source/플래시화면.svg` */
export const SPLASH_ASSET = '/assets/splash-screen.svg?v=1'

/** 시안에 구워진 가짜 시계·신호·배터리 높이. 로고(y≈351)는 건드리지 않는다. */
const SPLASH_STATUS_BAR_H = 53
const SPLASH_FRAME_H = 852

/**
 * 스플래시·온보딩 로딩 공통 화면. 학습 로고가 아니라 학습 워드마크 풀프레임.
 */
export function SplashBrandFrame({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-full w-full justify-center bg-white">
      <div className="relative aspect-[393/852] w-full max-w-[540px] self-center">
        <img
          src={SPLASH_ASSET}
          alt="학습"
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          draggable={false}
        />
        {/*
          시안에 구워진 가짜 상태바(18:00·신호·와이파이·배터리)를 가린다.
          시계·아이콘은 다시 그리지 않는다 — 실기기에서는 OS가 진짜 상태바를 그린다.
        */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] bg-white"
          style={{ height: `${(SPLASH_STATUS_BAR_H / SPLASH_FRAME_H) * 100}%` }}
          aria-hidden
        />
        {children}
      </div>
    </div>
  )
}
