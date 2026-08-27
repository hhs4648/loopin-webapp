import {
  MAIN_HOME_NAV_TABS,
  type MainHomeNavTabId,
} from '../main-home/assignment-home'
import {
  GYM_NAV_BAR,
  GYM_NAV_HIT_WIDTH_RATIO,
  GYM_NAV_TAB_COUNT,
  gymRectStyle,
} from './gym'

/** 시안에 구워진 하단 내비 위 투명 히트 */
export function GymNavHits({
  onSelectNav,
}: {
  onSelectNav?: (id: MainHomeNavTabId) => void
}) {
  return (
    <nav
      aria-label="메인 메뉴"
      className="pointer-events-none absolute inset-0 z-10"
    >
      {MAIN_HOME_NAV_TABS.map((tab, index) => {
        const slotCenterPct = ((index + 0.5) / GYM_NAV_TAB_COUNT) * 100
        const hitWidthPct = (GYM_NAV_HIT_WIDTH_RATIO / GYM_NAV_TAB_COUNT) * 100
        return (
          <button
            key={tab.id}
            type="button"
            aria-label={tab.ariaLabel}
            aria-current={tab.id === 'gym' ? 'page' : undefined}
            className="pointer-events-auto absolute bg-transparent"
            style={{
              ...gymRectStyle({
                x: 0,
                y: GYM_NAV_BAR.y,
                w: 0,
                h: GYM_NAV_BAR.h,
              }),
              left: `${slotCenterPct}%`,
              width: `${hitWidthPct}%`,
              transform: 'translateX(-50%)',
            }}
            onClick={() => onSelectNav?.(tab.id)}
          />
        )
      })}
    </nav>
  )
}
