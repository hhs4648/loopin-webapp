import type { CSSProperties } from 'react'
import {
  castleMascotClipRect,
  castleSparkleRects,
  CURRENT_LOCATION_PILL,
  fullMapRectStyle,
  MAIN_HOME_ASSETS,
} from './assignment-home'

type CastleCompleteMascotProps = {
  castle: { id?: string; x: number; y: number; w: number; h: number }
  /** 현재 위치일 때만 하단 「현재 위치」 필 표시 */
  showCurrentLocation?: boolean
}

/** 발끝(성 밑변) → 필 상단 */
const PILL_GAP = 6

function Sparkle({ style }: { style: CSSProperties }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      className="pointer-events-none absolute z-[2]"
      style={style}
    >
      <path
        d="M8 0.75L9.25 5.4L14.25 8L9.25 10.6L8 15.25L6.75 10.6L1.75 8L6.75 5.4L8 0.75Z"
        fill="#FFC92D"
      />
    </svg>
  )
}

/**
 * 완료(현재 위치) 성 — 맵 성 위 만세 루핀(`mascot-banzai.svg`).
 *
 * 배치는 `캐릭터 성도착` 참고:
 * 가로 중앙 · 발끝 Y = 성 바닥 Y · 크기는 성 대비 참고 비율.
 * 하단 필은 항상 「현재 위치」(파랑). 「진행중」은 성 상단 `CastleRetryingPill`.
 */
export function CastleCompleteMascot({
  castle,
  showCurrentLocation = true,
}: CastleCompleteMascotProps) {
  const box = castleMascotClipRect(castle)
  const sparkles = castleSparkleRects(castle)
  const { w: pillW, h: pillH } = CURRENT_LOCATION_PILL

  const footX = box.x + box.w / 2
  const footY = box.y + box.h

  return (
    <>
      <Sparkle
        style={fullMapRectStyle(
          sparkles.left.x,
          sparkles.left.y,
          sparkles.left.w,
          sparkles.left.h,
        )}
      />
      <Sparkle
        style={fullMapRectStyle(
          sparkles.right.x,
          sparkles.right.y,
          sparkles.right.w,
          sparkles.right.h,
        )}
      />

      <img
        src={MAIN_HOME_ASSETS.mascotCheer}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute z-[2] block max-w-none object-contain object-bottom"
        style={fullMapRectStyle(box.x, box.y, box.w, box.h)}
      />

      {showCurrentLocation ? (
        <div
          aria-hidden
          className="pointer-events-none absolute z-[3] flex items-center justify-center rounded-full bg-[#4F91EB]"
          style={fullMapRectStyle(
            footX - pillW / 2,
            footY + PILL_GAP,
            pillW,
            pillH,
          )}
        >
          <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] font-bold leading-none tracking-[-0.02em] text-white">
            현재 위치
          </span>
        </div>
      ) : null}
    </>
  )
}
