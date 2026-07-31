import type { CSSProperties } from 'react'
import { MAIN_HOME_ASSETS } from './assignment-home'

type MapCharacterProps = {
  style: CSSProperties
}

/** 루핀 캐릭터 — 맵 위 장식 오버레이 (클릭 불가) */
export function MapCharacter({ style }: MapCharacterProps) {
  return (
    <img
      src={MAIN_HOME_ASSETS.mascotWave}
      alt=""
      aria-hidden
      draggable={false}
      className="pointer-events-none absolute z-[2] object-contain object-bottom"
      style={style}
    />
  )
}
