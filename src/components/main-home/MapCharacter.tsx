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
      // object-contain만 — `startMascotBox()`가 정사각+여백 비율로 발끝을 맞춘다.
      // object-bottom을 쓰면 여백 역산과 어긋날 수 있다.
      className="pointer-events-none absolute z-[2] object-contain"
      style={style}
    />
  )
}
