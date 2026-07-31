import {
  FRAME_H,
  MAIN_HOME_SKY,
} from './session-round-dropdown'
import { MapCharacter } from './MapCharacter'
import {
  fullMapRectStyle,
  MAIN_HOME_ASSETS,
  MAIN_HOME_GRASS,
  MAP_CONTENT_H,
  MAP_SCROLL_H,
  MAP_SKY_CROP,
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
          background: MAIN_HOME_SKY,
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
          <div
            className="absolute inset-x-0"
            style={{
              top: `${(-MAP_SKY_CROP / MAP_SCROLL_H) * 100}%`,
              height: `${(MAP_CONTENT_H / MAP_SCROLL_H) * 100}%`,
              backgroundImage: `url(${MAIN_HOME_ASSETS.map})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'left top',
              backgroundRepeat: 'no-repeat',
            }}
          />

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
