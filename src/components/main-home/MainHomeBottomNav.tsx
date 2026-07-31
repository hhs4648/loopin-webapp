/**
 * Figma `메인화면(과제 부여 받은후)` 하단 탭바를 뷰포트에 고정.
 * (아이콘/라벨은 SVG 시안 — React로 다시 그리지 않음)
 *
 * 히트 영역은 탭 칸 전체가 아니라 아이콘·라벨 근처(칸 폭의 ~52%)만.
 */
import type { MainHomeNavTabId } from './assignment-home'
import {
  FRAME_H,
  MAIN_HOME_ASSETS,
  MAIN_HOME_NAV_TABS,
  NAV_H,
} from './assignment-home'

/** 탭 슬롯 대비 클릭 가능 폭 비율 (좌우 여백으로 오탭 방지) */
const TAB_HIT_WIDTH_RATIO = 0.52

export function MainHomeBottomNav({
  activeId = 'home',
  onSelect,
}: {
  activeId?: MainHomeNavTabId
  onSelect?: (id: MainHomeNavTabId) => void
}) {
  const tabCount = MAIN_HOME_NAV_TABS.length

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[60] overflow-hidden bg-[#F4F6FA]"
      style={{ height: `${(NAV_H / FRAME_H) * 100}%` }}
    >
      <img
        src={MAIN_HOME_ASSETS.bottomNav}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full max-w-none select-none object-fill"
      />

      <nav aria-label="메인 메뉴" className="pointer-events-none absolute inset-0 z-10">
        {MAIN_HOME_NAV_TABS.map((tab, index) => {
          const active = tab.id === activeId
          const slotCenterPct = ((index + 0.5) / tabCount) * 100
          const hitWidthPct = (TAB_HIT_WIDTH_RATIO / tabCount) * 100
          return (
            <button
              key={tab.id}
              type="button"
              aria-label={tab.ariaLabel}
              aria-current={active ? 'page' : undefined}
              className="pointer-events-auto absolute top-0 bottom-0 bg-transparent"
              style={{
                left: `${slotCenterPct}%`,
                width: `${hitWidthPct}%`,
                transform: 'translateX(-50%)',
              }}
              onClick={() => onSelect?.(tab.id)}
            />
          )
        })}
      </nav>
    </div>
  )
}
