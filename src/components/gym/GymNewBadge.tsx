import {
  FRAME_H,
  FRAME_W,
  MAIN_HOME_NAV_TABS,
} from '../main-home/assignment-home'

/**
 * 하단 내비 **「헬스장」 칸 위**에 뜨는 `New` 알림.
 *
 * 오답 다시 출제는 성 맵에 안 올라가고 헬스장에서만 푼다. 학생이 놓치지 않게
 * 내비 「헬스장」 칸 위에 `New`를 띄운다.
 *
 * 내비 자체(`nav-bar.svg`)에는 손대지 않는다 — 알림은 상태에 따라 붙었다 떨어지는
 * 것이라 그림에 구울 수 없다.
 *
 * 자리는 **탭 목록에서 찾는다.** 예전엔 칸 번호를 `3`으로 박아 뒀는데, 단어장을 빼면서
 * 헬스장이 한 칸 당겨졌다 — 그때 같이 안 고치면 알림만 엉뚱한 칸에 남는다.
 * 목록이 바뀌면 따라오도록 이름으로 찾는다.
 */

const GYM_TAB_INDEX = MAIN_HOME_NAV_TABS.findIndex((tab) => tab.id === 'gym')
/** 내비 윗변(y 770)보다 조금 위 */
const BADGE = { y: 754, w: 34, h: 18 } as const

export function GymNewBadge({ count }: { count: number }) {
  if (count <= 0 || GYM_TAB_INDEX < 0) return null

  const slotCenterPct =
    ((GYM_TAB_INDEX + 0.5) / MAIN_HOME_NAV_TABS.length) * 100

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
