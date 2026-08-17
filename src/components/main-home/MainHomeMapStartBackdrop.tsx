import {
  FRAME_H,
  MAIN_HOME_SKY_GRADIENT,
} from './assignment-home'
import { MainHomeMapCanvas } from './MainHomeMapCanvas'
import { MainHomeMapDecor } from './MainHomeMapDecor'
import { MapCastleSprite } from './MapCastleSprite'
import { MapCharacter } from './MapCharacter'
import {
  fullMapRectStyle,
  getCastleAccentColor,
  MAIN_HOME_ASSETS,
  MAIN_HOME_GRASS,
  MAP_CASTLE_SLOTS,
  MAP_SCROLL_H,
  MASCOT_WAVE_RECT,
  NAV_H,
  SKY_FIXED_H,
  START_FLAG_RECT,
  START_LOCATION_PILL_RECT,
} from './assignment-home'

/**
 * 학원/학교 메인과 동일한 시작 지점 맵 배경 (스크롤·히트 없음).
 * 초대코드 화면 등 미리보기용.
 */
export function MainHomeMapStartBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-x-0 top-0 z-[1]"
        style={{
          height: `${(SKY_FIXED_H / FRAME_H) * 100}%`,
          background: MAIN_HOME_SKY_GRADIENT,
        }}
      />

      <div
        className="absolute inset-x-0 overflow-hidden"
        style={{
          top: `${(SKY_FIXED_H / FRAME_H) * 100}%`,
          bottom: `${(NAV_H / FRAME_H) * 100}%`,
          background: MAIN_HOME_GRASS,
        }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: `393 / ${MAP_SCROLL_H}`,
            background: MAIN_HOME_GRASS,
          }}
        >
          <MainHomeMapCanvas />
          <MainHomeMapDecor />

          {/* 성 — 배경이 벡터가 되면서 더 이상 구워져 있지 않다 (본 화면과 동일하게 색도 다르게) */}
          {MAP_CASTLE_SLOTS.slice(0, 4).map((castle, index) => (
            <MapCastleSprite
              key={castle.id}
              color={getCastleAccentColor(index)}
              className="absolute z-[1] select-none"
              style={fullMapRectStyle(castle.x, castle.y, castle.w, castle.h)}
            />
          ))}

          <img
            src={MAIN_HOME_ASSETS.startFlag}
            alt=""
            draggable={false}
            className="absolute z-[2] object-contain object-bottom"
            style={fullMapRectStyle(
              START_FLAG_RECT.x,
              START_FLAG_RECT.y,
              START_FLAG_RECT.w,
              START_FLAG_RECT.h,
            )}
          />

          <MapCharacter
            style={fullMapRectStyle(
              MASCOT_WAVE_RECT.x,
              MASCOT_WAVE_RECT.y,
              MASCOT_WAVE_RECT.w,
              MASCOT_WAVE_RECT.h,
            )}
          />
          <div
            className="absolute z-[2] flex items-center justify-center rounded-full bg-[#4F91EB]"
            style={fullMapRectStyle(
              START_LOCATION_PILL_RECT.x,
              START_LOCATION_PILL_RECT.y,
              START_LOCATION_PILL_RECT.w,
              START_LOCATION_PILL_RECT.h,
            )}
          >
            <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] font-bold leading-none tracking-[-0.02em] text-white">
              현재 위치
            </span>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: `${(NAV_H / FRAME_H) * 100}%`,
          background: '#FFFFFF',
        }}
      />
    </div>
  )
}
