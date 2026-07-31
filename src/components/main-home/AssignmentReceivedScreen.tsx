import { useEffect, useRef } from 'react'
import { SessionRoundDropdown } from './SessionRoundDropdown'
import { FRAME_H, MAIN_HOME_SKY } from './session-round-dropdown'
import { TodayMissionCard } from './TodayMissionCard'
import { figmaRectStyle } from './today-mission'
import {
  PRAISE_CALENDAR_FIXED_RECT,
  PraiseCalendarButton,
} from './PraiseCalendarButton'
import { MainHomeBottomNav } from './MainHomeBottomNav'
import { MapCharacter } from './MapCharacter'
import { CastleCompleteMascot } from './CastleCompleteMascot'
import { MissionCheckBadge } from './MissionCheckBadge'
import { CastleRetryingPill, RetryingStatusBanner } from './CastleRetryingPill'
import { SettingsWindow } from '../settings/SettingsWindow'
import { playTapSfx } from '../exercise/answer-sfx'
import {
  FREE_MAP_CASTLE_COUNT,
  castleCompleteMarkerCenter,
  castleRetryingPillStyle,
  fullMapMarkerStyle,
  fullMapRectStyle,
  getCastleAccentColor,
  MAIN_HOME_ASSETS,
  MAIN_HOME_GRASS,
  MAP_CASTLE_SLOTS,
  MAP_CONTENT_H,
  MAP_SCROLL_H,
  MAP_SKY_CROP,
  MASCOT_WAVE_RECT,
  NAV_H,
  resolveMapCenterScrollTop,
  resolveMapMaxScrollTop,
  resolveMapScrollContentHeight,
  SKY_FIXED_H,
  START_FLAG_RECT,
  START_LOCATION_PILL_RECT,
  type MainHomeNavTabId,
  type MapCastle,
} from './assignment-home'
import type { StudentAssignment } from '../../lib/sync/types'

/** 완료된 성 탭 → 과제 완료 화면(점수·재도전/틀린문제만) */
export type CompletedCastleTarget =
  | { kind: 'assignment'; assignment: StudentAssignment }
  | { kind: 'demo'; index: 0 | 1 }

/**
 * 현재 위치 = 완료된 과제 중 order가 가장 늦은(가장 멀리 간) 성.
 * 재도전 중인 과제는 아직 완료가 아닌 것처럼 제외 → 캐릭터가 이전 성(또는 시작점)으로 후퇴.
 * 완료가 없으면 null → 시작 깃발에 머무름.
 */
function resolveCurrentCastleIndex(
  assignments: StudentAssignment[],
  slotCount: number,
  excludeAssignmentId?: string | null,
): number | null {
  let bestIndex: number | null = null
  let bestOrder = -Infinity
  const limit = Math.min(assignments.length, slotCount)
  for (let i = 0; i < limit; i++) {
    const a = assignments[i]!
    if (a.status !== 'completed') continue
    if (excludeAssignmentId && a.assignmentId === excludeAssignmentId) continue
    if (a.order >= bestOrder) {
      bestOrder = a.order
      bestIndex = i
    }
  }
  return bestIndex
}

/** 배경에 구워진 성 위 투명 히트만 — 성/체크 이미지 오버레이 없음 */
function CastleHit({
  castle,
  ariaLabel,
  onClick,
}: {
  castle: MapCastle
  ariaLabel: string
  onClick?: () => void
}) {
  if (!onClick) return null
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="absolute z-[3] cursor-pointer bg-transparent p-0"
      style={fullMapRectStyle(castle.x, castle.y, castle.w, castle.h)}
      onClick={onClick}
    />
  )
}


function StartFlag() {
  return (
    <img
      src={MAIN_HOME_ASSETS.startFlag}
      alt=""
      aria-hidden
      draggable={false}
      className="pointer-events-none absolute z-[2] object-contain object-bottom"
      style={fullMapRectStyle(
        START_FLAG_RECT.x,
        START_FLAG_RECT.y,
        START_FLAG_RECT.w,
        START_FLAG_RECT.h,
      )}
    />
  )
}

function StartLocationMascot() {
  return (
    <>
      <MapCharacter
        style={fullMapRectStyle(
          MASCOT_WAVE_RECT.x,
          MASCOT_WAVE_RECT.y,
          MASCOT_WAVE_RECT.w,
          MASCOT_WAVE_RECT.h,
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute z-[2] flex items-center justify-center rounded-full bg-[#4F91EB]"
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
    </>
  )
}

type OpenAssignmentOptions = { isRetry?: boolean }

type AssignmentReceivedScreenProps = {
  assignments?: StudentAssignment[]
  /** 선생님 웹에서 지정한 반 이름 */
  className?: string
  /** @deprecated demo fallback */
  star1Completed?: boolean
  /** @deprecated demo fallback */
  star2Completed?: boolean
  /** 재도전 중인 서버 과제 id — 해당 성 별표 위 「재도전 중!」 */
  retryingAssignmentId?: string | null
  /** 재도전 중인 데모 성 인덱스 (0|1) */
  retryingDemoIndex?: 0 | 1 | null
  onOpenAssignment?: (
    assignment: StudentAssignment,
    options?: OpenAssignmentOptions,
  ) => void
  /** 완료된 성 탭 → `GrammarCompleteScreen` (구 재도전 확인 오버레이 대체) */
  onOpenCompletedCastle?: (target: CompletedCastleTarget) => void
  onOpenWordMatch?: (options?: OpenAssignmentOptions) => void
  onOpenCastleLearning?: (options?: OpenAssignmentOptions) => void
  onOpenPraiseCalendar?: () => void
  /** 하단 내비 → 설정 창 */
  settingsOpen?: boolean
  onCloseSettings?: () => void
  /** 홈 → 학원/학교 메인 · 전체 → 설정 창 */
  onGoMain?: () => void
  onOpenSettings?: () => void
}

export function AssignmentReceivedScreen({
  assignments,
  className = 'A반',
  star1Completed = false,
  star2Completed = false,
  retryingAssignmentId = null,
  retryingDemoIndex = null,
  onOpenAssignment,
  onOpenCompletedCastle,
  onOpenWordMatch,
  onOpenCastleLearning,
  onOpenPraiseCalendar,
  settingsOpen = false,
  onCloseSettings,
  onGoMain,
  onOpenSettings,
}: AssignmentReceivedScreenProps) {
  const useServerAssignments = Array.isArray(assignments)
  const serverList = assignments ?? []
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleNavSelect = (id: MainHomeNavTabId) => {
    if (id === 'home') {
      onGoMain?.()
      return
    }
    if (id === 'menu') {
      onOpenSettings?.()
    }
  }

  const openAssignmentOrConfirmRetry = (assignment: StudentAssignment) => {
    playTapSfx()
    // 재도전 풀이 중이면 완료 화면 대신 이어서 풀기
    if (retryingAssignmentId === assignment.assignmentId) {
      onOpenAssignment?.(assignment, { isRetry: true })
      return
    }
    if (assignment.status === 'completed') {
      onOpenCompletedCastle?.({ kind: 'assignment', assignment })
      return
    }
    onOpenAssignment?.(assignment, { isRetry: false })
  }

  const openDemoCastleOrConfirmRetry = (index: 0 | 1) => {
    playTapSfx()
    if (retryingDemoIndex === index) {
      if (index === 0) onOpenWordMatch?.({ isRetry: true })
      else onOpenCastleLearning?.({ isRetry: true })
      return
    }
    const completed = index === 0 ? star1Completed : star2Completed
    if (completed) {
      onOpenCompletedCastle?.({ kind: 'demo', index })
      return
    }
    if (index === 0) onOpenWordMatch?.({ isRetry: false })
    else onOpenCastleLearning?.({ isRetry: false })
  }

  const assignedCount = useServerAssignments
    ? serverList.length
    : FREE_MAP_CASTLE_COUNT
  const mapScrollH = resolveMapScrollContentHeight(assignedCount)
  const visibleSlots = MAP_CASTLE_SLOTS.slice(
    0,
    useServerAssignments ? assignedCount : FREE_MAP_CASTLE_COUNT,
  )

  const currentCastleIndex = useServerAssignments
    ? resolveCurrentCastleIndex(
        serverList,
        visibleSlots.length,
        retryingAssignmentId,
      )
    : retryingDemoIndex === 1
      ? star1Completed
        ? 0
        : null
      : retryingDemoIndex === 0
        ? null
        : star2Completed
          ? 1
          : star1Completed
            ? 0
            : null

  const isRetryingAny =
    Boolean(retryingAssignmentId) ||
    retryingDemoIndex === 0 ||
    retryingDemoIndex === 1

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const clampScroll = () => {
      const maxScroll = resolveMapMaxScrollTop(assignedCount, el)
      if (el.scrollTop > maxScroll) el.scrollTop = maxScroll
    }

    /**
     * 「현재 위치」를 스크롤 뷰포트 세로 중앙에 맞춤.
     * - 완료 성 있음 → 해당 성 중심
     * - 없음 → 시작 지점 「현재 위치」 필
     */
    const centerOnCurrentLocation = () => {
      const focusFrameY =
        currentCastleIndex !== null
          ? (() => {
              const focusCastle = MAP_CASTLE_SLOTS[currentCastleIndex]!
              return focusCastle.y + focusCastle.h / 2
            })()
          : START_LOCATION_PILL_RECT.y + START_LOCATION_PILL_RECT.h / 2

      el.scrollTop = resolveMapCenterScrollTop(
        focusFrameY,
        assignedCount,
        el,
      )
    }

    const raf = requestAnimationFrame(() => {
      centerOnCurrentLocation()
    })

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        requestAnimationFrame(centerOnCurrentLocation)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', centerOnCurrentLocation)

    el.addEventListener('scroll', clampScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', clampScroll)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', centerOnCurrentLocation)
    }
  }, [assignedCount, mapScrollH, currentCastleIndex])

  return (
    <div
      className="flex min-h-dvh w-full justify-center"
      style={{ background: MAIN_HOME_SKY }}
    >
      <div
        className="relative aspect-[393/852] w-full max-w-[540px] self-center overflow-hidden"
        style={{ background: MAIN_HOME_SKY }}
      >
        {/* 고정 하늘 — 스크롤/드래그 없음 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[1]"
          style={{
            height: `${(SKY_FIXED_H / FRAME_H) * 100}%`,
            background: MAIN_HOME_SKY,
          }}
        />

        <div
          ref={scrollRef}
          className="absolute inset-x-0 overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            top: `${(SKY_FIXED_H / FRAME_H) * 100}%`,
            bottom: `${(NAV_H / FRAME_H) * 100}%`,
            background: MAIN_HOME_GRASS,
          }}
        >
          {/* 풀맵 배경 유지 — 드래그만 부여 성 상한으로 클램프 */}
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: `393 / ${MAP_SCROLL_H}`,
              background: MAIN_HOME_GRASS,
            }}
          >
            {/* LONG 상단 하늘 크롭 — 풀이 스크롤 맨 위 */}
            <div
              role="img"
              aria-label="과제 성 전체 지도"
              className="pointer-events-none absolute inset-x-0"
              style={{
                top: `${(-MAP_SKY_CROP / MAP_SCROLL_H) * 100}%`,
                height: `${(MAP_CONTENT_H / MAP_SCROLL_H) * 100}%`,
                backgroundImage: `url(${MAIN_HOME_ASSETS.map})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'left top',
                backgroundRepeat: 'no-repeat',
              }}
            />

            <StartFlag />

            {currentCastleIndex === null ? (
              <StartLocationMascot />
            ) : (
              <CastleCompleteMascot
                castle={visibleSlots[currentCastleIndex]!}
                showCurrentLocation
              />
            )}

            {/* 완료 성 — 별표 / 재도전 중엔 별표 숨기고 「재도전 중!」 */}
            {useServerAssignments
              ? serverList.slice(0, visibleSlots.length).map((assignment, index) => {
                  if (assignment.status !== 'completed') return null
                  const marker = castleCompleteMarkerCenter(index)
                  const isRetrying = retryingAssignmentId === assignment.assignmentId
                  return isRetrying ? (
                    <CastleRetryingPill
                      key={`retry-${assignment.assignmentId}`}
                      style={castleRetryingPillStyle(marker.cx, marker.cy)}
                    />
                  ) : (
                    <MissionCheckBadge
                      key={`done-${assignment.assignmentId}`}
                      color={getCastleAccentColor(index)}
                      style={fullMapMarkerStyle(marker.cx, marker.cy)}
                      alt={`${assignment.title} 완료`}
                    />
                  )
                })
              : (
                  <>
                    {star1Completed ? (
                      retryingDemoIndex === 0 ? (
                        <CastleRetryingPill
                          style={castleRetryingPillStyle(
                            castleCompleteMarkerCenter(0).cx,
                            castleCompleteMarkerCenter(0).cy,
                          )}
                        />
                      ) : (
                        <MissionCheckBadge
                          color={getCastleAccentColor(0)}
                          style={fullMapMarkerStyle(
                            castleCompleteMarkerCenter(0).cx,
                            castleCompleteMarkerCenter(0).cy,
                          )}
                        />
                      )
                    ) : null}
                    {star2Completed ? (
                      retryingDemoIndex === 1 ? (
                        <CastleRetryingPill
                          style={castleRetryingPillStyle(
                            castleCompleteMarkerCenter(1).cx,
                            castleCompleteMarkerCenter(1).cy,
                          )}
                        />
                      ) : (
                        <MissionCheckBadge
                          color={getCastleAccentColor(1)}
                          style={fullMapMarkerStyle(
                            castleCompleteMarkerCenter(1).cx,
                            castleCompleteMarkerCenter(1).cy,
                          )}
                        />
                      )
                    ) : null}
                  </>
                )}

            {useServerAssignments
              ? serverList.slice(0, visibleSlots.length).map((assignment, index) => {
                  const castle = visibleSlots[index]!
                  const isCompleted = assignment.status === 'completed'
                  return (
                    <CastleHit
                      key={assignment.assignmentId}
                      castle={castle}
                      ariaLabel={
                        retryingAssignmentId === assignment.assignmentId
                          ? `${assignment.title} 재도전 이어서 풀기`
                          : isCompleted
                            ? `${assignment.title} 재도전`
                            : `${assignment.title} 시작`
                      }
                      onClick={() => openAssignmentOrConfirmRetry(assignment)}
                    />
                  )
                })
              : visibleSlots.map((castle, index) => (
                  <CastleHit
                    key={castle.id}
                    castle={castle}
                    ariaLabel={
                      index === 0 && star1Completed
                        ? '1회차 성 재도전'
                        : index === 1 && star2Completed
                          ? '2회차 성 재도전'
                          : `${index + 1}회차 성`
                    }
                    onClick={
                      index === 0
                        ? () => openDemoCastleOrConfirmRetry(0)
                        : index === 1
                          ? () => openDemoCastleOrConfirmRetry(1)
                          : undefined
                    }
                  />
                ))}
          </div>
        </div>

        <SessionRoundDropdown
          className={className}
          assignments={useServerAssignments ? serverList : undefined}
        />

        {isRetryingAny ? <RetryingStatusBanner /> : null}

        <div className="pointer-events-none absolute inset-0 z-10">
          <TodayMissionCard
            assignments={serverList}
            onOpen={(assignment) => openAssignmentOrConfirmRetry(assignment)}
          />
        </div>

        <PraiseCalendarButton
          style={figmaRectStyle(PRAISE_CALENDAR_FIXED_RECT)}
          onClick={onOpenPraiseCalendar}
        />

        {!settingsOpen ? (
          <MainHomeBottomNav activeId="home" onSelect={handleNavSelect} />
        ) : null}

        {settingsOpen && onCloseSettings ? (
          <SettingsWindow
            onClose={onCloseSettings}
            onSelectNav={(id) => handleNavSelect(id)}
          />
        ) : null}

      </div>
    </div>
  )
}
