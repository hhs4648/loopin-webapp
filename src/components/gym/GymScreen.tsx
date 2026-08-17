import { playTapSfx } from '../exercise/answer-sfx'
import {
  FRAME_H,
  FRAME_W,
  MAIN_HOME_NAV_TABS,
  type MainHomeNavTabId,
} from '../main-home/assignment-home'
import type { StudentAssignment } from '../../lib/sync/types'
import {
  GYM_ASSET,
  GYM_CHARACTER_HIT,
  GYM_NAV_BAR,
  GYM_NAV_HIT_WIDTH_RATIO,
  GYM_NAV_TAB_COUNT,
  gymRectStyle,
} from './gym'

/**
 * 헬스장 — 하단 내비 「헬스장」 탭으로 들어온다.
 *
 * 교사 웹 「오답만 다시 출제」로 내려온 개인 과제를 여기서 푼다.
 * 복습하기(`ReviewMainWindow`)와 같은 **풀스크린 오버레이** 방식이다(라우트 아님).
 *
 * 시안에 내비가 구워져 있어서 React 내비를 겹쳐 올리지 않고 **투명 히트영역만** 얹는다.
 * 겹쳐 올리면 내비가 두 겹으로 보이고, 구워진 쪽의 「헬스장」 활성 표시도 가려진다.
 */
export function GymScreen({
  assignments = [],
  onSelectNav,
  onStart,
}: {
  /** 밀려 있는 오답 과제 — **오래된 순**으로 들어온다 */
  assignments?: StudentAssignment[]
  onSelectNav?: (id: MainHomeNavTabId) => void
  onStart?: (assignment: StudentAssignment) => void
}) {
  // 여러 개 쌓여 있으면 **먼저 낸 것부터** 푼다(사용자 지정 2026-08-11)
  const next = assignments[0] ?? null
  const waitingExtra = Math.max(0, assignments.length - 1)

  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="헬스장"
    >
      <img
        src={GYM_ASSET}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full max-w-none select-none object-fill"
      />

      {/*
        운동하는 캐릭터 = 오답 풀기 진입. 밀린 과제가 없으면 버튼을 아예 두지 않는다 —
        눌러도 아무 일 없는 버튼보다 없는 게 낫다.
      */}
      {next ? (
        <>
          <button
            type="button"
            aria-label={`오답 다시 풀기 · ${next.title}${
              waitingExtra > 0 ? ` 외 ${waitingExtra}개 대기` : ''
            }`}
            onClick={() => {
              playTapSfx()
              onStart?.(next)
            }}
            className="absolute z-10 cursor-pointer bg-transparent"
            style={gymRectStyle(GYM_CHARACTER_HIT)}
          />
          {/* 캐릭터 위에 대기 알림 — 투명 히트라 어디를 눌러야 할지 보이게 */}
          <div
            className="pointer-events-none absolute z-[11] flex justify-center"
            style={{
              left: `${(GYM_CHARACTER_HIT.x / FRAME_W) * 100}%`,
              top: `${((GYM_CHARACTER_HIT.y - 36) / FRAME_H) * 100}%`,
              width: `${(GYM_CHARACTER_HIT.w / FRAME_W) * 100}%`,
            }}
            aria-hidden
          >
            <span className="rounded-full bg-[#1E9EFF] px-3 py-1.5 text-[13px] font-bold leading-none text-white shadow-[0_2px_8px_rgba(30,158,255,0.35)]">
              {waitingExtra > 0
                ? `오답 ${assignments.length}개 · 탭해서 풀기`
                : '오답 다시 풀기 · 탭'}
            </span>
          </div>
        </>
      ) : (
        <p
          className="pointer-events-none absolute z-10 px-6 text-center text-[14px] font-medium leading-snug text-[#6B7280]"
          style={{
            left: 0,
            right: 0,
            top: `${((GYM_CHARACTER_HIT.y + GYM_CHARACTER_HIT.h + 12) / FRAME_H) * 100}%`,
          }}
        >
          선생님이 오답만 다시 내주시면
          <br />
          캐릭터를 눌러 풀 수 있어요
        </p>
      )}

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
    </div>
  )
}
