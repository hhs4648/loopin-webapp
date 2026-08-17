import { FRAME_H, FRAME_W } from '../main-home/assignment-home'
import { GYM_NAV_TAB_COUNT } from './gym'

/**
 * 하단 내비 **「헬스장」 칸 위**에 뜨는 `New` 알림.
 *
 * 오답 다시 출제는 성 맵에 안 올라가고 헬스장에서만 푼다. 학생이 놓치지 않게
 * 내비 「헬스장」 칸 위에 `New`를 띄운다.
 *
 * 내비 자체(`nav-bar.svg`)에는 손대지 않는다. 시안을 고치면 5칸 시안을 다시 뽑아야 하고,
 * 알림은 상태에 따라 붙었다 떨어지는 것이라 그림에 구울 수 없다.
 */

/** 헬스장은 5칸 중 4번째(0-based 3) */
const GYM_TAB_INDEX = 3
/** 내비 윗변(y 770)보다 조금 위 */
const BADGE = { y: 754, w: 34, h: 18 } as const

export function GymNewBadge({ count }: { count: number }) {
  if (count <= 0) return null

  const slotCenterPct = ((GYM_TAB_INDEX + 0.5) / GYM_NAV_TAB_COUNT) * 100

  return (
    <div
      className="pointer-events-none absolute z-[61] flex items-center justify-center rounded-full bg-[#FF4C4C] shadow-[0_2px_6px_rgba(255,76,76,0.35)]"
      style={{
        left: `${slotCenterPct}%`,
        top: `${(BADGE.y / FRAME_H) * 100}%`,
        width: `${(BADGE.w / FRAME_W) * 100}%`,
        height: `${(BADGE.h / FRAME_H) * 100}%`,
        transform: 'translateX(-50%)',
      }}
      role="status"
      aria-label={`헬스장에 새 오답 문제 ${count}개`}
    >
      <span className="text-[10px] leading-none font-bold text-white">
        New{count > 1 ? ` ${count}` : ''}
      </span>
    </div>
  )
}
