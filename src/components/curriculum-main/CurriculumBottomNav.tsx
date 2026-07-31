/**
 * 커리큘럼·설정 공통 하단 탭바.
 * 아이콘/라벨은 시안 SVG — `activeId`에 따라 홈/전체 활성 에셋 전환.
 *
 * 히트 영역은 탭 칸 전체가 아니라 아이콘·라벨 근처(칸 폭의 ~52%)만.
 */
import type { CurriculumNavTabId } from './curriculum-main'
import {
  CURRICULUM_NAV_TABS,
  FRAME_H,
  NAV_H,
  curriculumNavAssetFor,
} from './curriculum-main'

const TAB_HIT_WIDTH_RATIO = 0.52

export function CurriculumBottomNav({
  activeId = 'home',
  onSelect,
}: {
  activeId?: CurriculumNavTabId
  onSelect?: (id: CurriculumNavTabId) => void
}) {
  const tabCount = CURRICULUM_NAV_TABS.length
  const asset = curriculumNavAssetFor(activeId)

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[60] overflow-hidden bg-[#F4F6FA]"
      style={{ height: `${(NAV_H / FRAME_H) * 100}%` }}
    >
      <img
        src={asset}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full max-w-none select-none object-fill"
      />

      <nav aria-label="메인 메뉴" className="pointer-events-none absolute inset-0 z-10">
        {CURRICULUM_NAV_TABS.map((tab, index) => {
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
