import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { TodayMissionCard } from './TodayMissionCard'
import { figmaRectStyle } from './today-mission'
import {
  PRAISE_CALENDAR_FIXED_RECT,
  PraiseCalendarButton,
} from './PraiseCalendarButton'
import { MainHomeBottomNav } from './MainHomeBottomNav'
import { MapCharacter } from './MapCharacter'
import { CastleCompleteMascot } from './CastleCompleteMascot'
import { CastleAssignedFlag } from './CastleAssignedFlag'
import { MissionCheckBadge } from './MissionCheckBadge'
import { CastleRetryingPill, CastleStatusPill } from './CastleRetryingPill'
import { MainHomeMapCanvas } from './MainHomeMapCanvas'
import { MainHomeMapDecor } from './MainHomeMapDecor'
import { MapCastleSprite } from './MapCastleSprite'
import { ReviewMainWindow } from '../review/ReviewMainWindow'
import { GymScreen } from '../gym/GymScreen'
import { GymNewBadge } from '../gym/GymNewBadge'
import { NavNoticeToast, VOCAB_COMING_SOON } from './NavNoticeToast'
import {
  castleAssignments,
  pendingWrongReissues,
} from '../../features/assignments/wrong-reissue'
import { StudyStreakBadge } from '../review/StudyStreakBadge'
import type { ReviewSession } from '../../features/review/build-review-session'
import { useStudyStreak } from '../../features/review/use-study-streak'
import { SettingsWindow } from '../settings/SettingsWindow'
import { playTapSfx } from '../exercise/answer-sfx'
import {
  CastlePartMenu,
  castlePartMenuHeight,
  CASTLE_PART_MENU_WIDTH,
  resolveDeadlineNote,
  type CastlePartMenuItem,
} from './CastlePartMenu'
import {
  isPartCompleted,
  listAssignmentParts,
} from '../../features/assignments/assignment-parts'
import { fetchAnsweredQuestionIds } from '../../lib/sync/student-api'
import type { PartCompleteKind } from '../part-complete/part-complete'
import {
  FREE_MAP_CASTLE_COUNT,
  castleBodyRect,
  castleCompleteMarkerCenter,
  FRAME_H,
  FRAME_W,
  MAIN_HOME_SKY,
  MAIN_HOME_SKY_GRADIENT,
  castleRetryingPillStyle,
  castleWrongOnlyPillStyle,
  fullMapLockBadgeStyle,
  fullMapMarkerStyle,
  fullMapRectStyle,
  getCastleAccentColor,
  MAIN_HOME_ASSETS,
  MAIN_HOME_GRASS,
  MAP_CASTLE_SLOTS,
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

type CurrentCastleFocus = {
  index: number | null
}

/**
 * 맵 캐릭터 위치.
 * 1) 재도전 중(`retryingAssignmentId`) → 그 성 (시작 깃발로 돌아가면 안 됨)
 * 2) `in_progress`(이미 풀기 시작한 성) → 그 성
 * 3) 그 외 → 완료된 성 중 가장 먼 곳
 * 4) 없으면 null → 시작 깃발
 */
function resolveCurrentCastleFocus(
  assignments: StudentAssignment[],
  slotCount: number,
  retryingAssignmentId?: string | null,
): CurrentCastleFocus {
  const limit = Math.min(assignments.length, slotCount)

  if (retryingAssignmentId) {
    const retryIndex = assignments
      .slice(0, limit)
      .findIndex((a) => a.assignmentId === retryingAssignmentId)
    if (retryIndex >= 0) return { index: retryIndex }
  }

  let inProgressIndex: number | null = null
  let inProgressOrder = Infinity
  let completedIndex: number | null = null
  let completedOrder = -Infinity

  for (let i = 0; i < limit; i++) {
    const a = assignments[i]!
    if (a.status === 'in_progress') {
      if (a.order < inProgressOrder) {
        inProgressOrder = a.order
        inProgressIndex = i
      }
      continue
    }
    if (a.status === 'completed' && a.order >= completedOrder) {
      completedOrder = a.order
      completedIndex = i
    }
  }

  if (inProgressIndex != null) {
    return { index: inProgressIndex }
  }
  return { index: completedIndex }
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

/**
 * 자물쇠 — 아직 과제가 안 나간 성에 붙는다.
 *
 * 예전에는 맵 이미지에 구워져 있어서 이 컴포넌트가 반대로 **자물쇠를 잔디색으로 덮는** 역할이었다.
 * 배경이 벡터가 된 뒤로는 구워진 자물쇠가 없으므로 필요한 자리에 직접 그린다.
 *
 * 중심은 **반드시 `castleCompleteMarkerCenter`** — 별표·깃발·재도전 필과 같은 소스다.
 * 예전 베이크 좌표(`bakedLockMarkerCenter`)를 쓰면 성마다 위치가 제각각이 된다:
 * 1성은 18px 위로 뜨고 나머지는 3주기 패턴대로 1~4px씩 흔들렸다(2026-08-09 수정).
 */
function CastleLockBadge({ index }: { index: number }) {
  const marker = castleCompleteMarkerCenter(index)
  return (
    <img
      src={MAIN_HOME_ASSETS.mapLockBadge}
      alt=""
      aria-hidden
      draggable={false}
      className="pointer-events-none absolute z-[2] select-none"
      style={fullMapLockBadgeStyle(marker.cx, marker.cy)}
    />
  )
}

/** 부여된 성 뒤로 몇 개까지 미리 그려 둘지 — 앞으로 갈 길이 보여야 지도처럼 읽힌다 */
const CASTLE_LOOKAHEAD = 6
/** 과제가 하나도 없어도 이만큼은 그린다 — 성은 지형이라 사라지면 안 된다 */
const MIN_DRAWN_CASTLES = 9

type OpenAssignmentOptions = {
  isRetry?: boolean
  /** 틀린문제만 이어풀기 — 오답 문항만 다시 연다 */
  isWrongOnly?: boolean
  /** 맵의 「파트별 입장하기」로 들어갈 때 — 러너가 이 파트부터 시작한다 */
  part?: PartCompleteKind
}

type AssignmentReceivedScreenProps = {
  assignments?: StudentAssignment[]
  /** @deprecated demo fallback */
  star1Completed?: boolean
  /** @deprecated demo fallback */
  star2Completed?: boolean
  /** 재도전 중인 서버 과제 id — 해당 성 별표 위 「재도전 중!」 */
  retryingAssignmentId?: string | null
  /** 틀린문제만 푸는 중인 과제 — 「재도전 중」과 구분해서 표시·진입한다 */
  wrongOnlyAssignmentId?: string | null
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
  /** 하단 내비 → 헬스장 */
  gymOpen?: boolean
  onCloseGym?: () => void
  onOpenGym?: () => void
  /** 하단 내비 → 복습하기 */
  reviewOpen?: boolean
  onCloseReview?: () => void
  onOpenReview?: () => void
  /** 홈 → 학원/학교 메인 · 전체 → 설정 창 */
  onGoMain?: () => void
  onOpenSettings?: () => void
  /** 복습 탭에서 분류 세션 시작 */
  onStartReview?: (session: ReviewSession) => void
}

export function AssignmentReceivedScreen({
  assignments,
  star1Completed = false,
  star2Completed = false,
  retryingAssignmentId = null,
  wrongOnlyAssignmentId = null,
  retryingDemoIndex = null,
  onOpenAssignment,
  onOpenCompletedCastle,
  onOpenWordMatch,
  onOpenCastleLearning,
  onOpenPraiseCalendar,
  settingsOpen = false,
  onCloseSettings,
  gymOpen = false,
  onCloseGym,
  onOpenGym,
  reviewOpen = false,
  onCloseReview,
  onOpenReview,
  onGoMain,
  onOpenSettings,
  onStartReview,
}: AssignmentReceivedScreenProps) {
  const useServerAssignments = Array.isArray(assignments)
  const allServerAssignments = assignments ?? []
  /**
   * 성 맵·오늘의 미션 — 반 전체 과제만.
   * 「오답만 다시 출제」개인 과제(`target_student_id`)는 헬스장에서만 푼다.
   * 성은 `MIN_DRAWN_CASTLES`로 항상 그려지므로 재출제만 있어도 맵이 비지 않는다.
   */
  const serverList = useMemo(
    () => castleAssignments(allServerAssignments),
    [allServerAssignments],
  )
  /** 헬스장에서 풀 오답 과제 — 안 끝낸 것만, 오래된 순 */
  const gymAssignments = useMemo(
    () => pendingWrongReissues(allServerAssignments),
    [allServerAssignments],
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  /** 성 위에 띄운 파트 선택 카드 — 어떤 과제의 몇 번째 성인지 */
  const [partMenu, setPartMenu] = useState<{
    assignment: StudentAssignment
    castleIndex: number
  } | null>(null)
  /** 그 과제에서 이미 답한 문항 id — 파트 완료 표시용 (카드를 열 때만 조회) */
  const [answeredIds, setAnsweredIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  /**
   * 맵 스크롤 위치를 **프레임(393) 단위**로 환산한 값.
   *
   * 파트 카드는 하늘 위까지 넘어가야 해서 맵 컨테이너(`overflow-hidden`) 밖,
   * 프레임 레벨에 그린다. 그러면 카드가 맵을 따라 움직이도록 스크롤을 직접 알아야 한다.
   * 실제 렌더 폭이 393~540로 달라지므로 CSS px를 프레임 단위로 나눠서 쓴다.
   */
  const [mapScrollFrame, setMapScrollFrame] = useState(0)
  /** 아직 화면이 없는 탭을 눌렀을 때의 안내 */
  const [navNotice, setNavNotice] = useState<string | null>(null)
  const studyStreak = useStudyStreak()

  /**
   * 카드를 열 때만 답안을 조회한다 — 성마다 미리 불러오면 맵 진입이 그만큼 느려진다.
   * 조회에 실패하면 빈 집합이라 모든 파트가 「입장하기」로 보인다(막지 않는 쪽으로 실패).
   */
  useEffect(() => {
    const attemptId = partMenu?.assignment.latestAttemptId
    if (!attemptId) {
      setAnsweredIds(new Set())
      return
    }
    let cancelled = false
    void (async () => {
      const ids = await fetchAnsweredQuestionIds(attemptId)
      if (!cancelled) setAnsweredIds(new Set(ids))
    })()
    return () => {
      cancelled = true
    }
    // `answeredCount`도 본다 — 같은 attempt 안에서 파트를 하나 더 끝내고 왔을 때,
    // attempt id는 그대로라 이것까지 안 보면 카드가 옛 상태로 남는다.
  }, [partMenu?.assignment.latestAttemptId, partMenu?.assignment.answeredCount])

  /**
   * 열려 있는 카드를 **최신 과제 객체로 맞춘다.** (교사가 지웠으면 닫는다)
   *
   * `partMenu.assignment`는 카드를 열 때 붙잡은 스냅샷이라, 목록이 갱신돼도 그대로였다.
   * 그래서 파트를 다 풀고 나온 직후가 특히 문제였다 — 처음 들어갈 때는 attempt가 없어
   * `latestAttemptId`가 비어 있고, 카드는 그 빈 값을 그대로 들고 있었다. 답안 조회는
   * attempt id가 없으면 빈 집합으로 떨어지니 **모든 파트가 「입장하기」로** 보였다.
   * 여기서 갈아끼우면 `latestAttemptId`가 채워지며 아래 조회 effect가 다시 돈다.
   */
  useEffect(() => {
    if (!partMenu) return
    const latest = serverList.find(
      (item) => item.assignmentId === partMenu.assignment.assignmentId,
    )
    if (!latest) {
      setPartMenu(null)
      return
    }
    if (latest !== partMenu.assignment) {
      setPartMenu({ ...partMenu, assignment: latest })
    }
  }, [serverList, partMenu])

  const partMenuItems: CastlePartMenuItem[] = useMemo(() => {
    if (!partMenu) return []
    return listAssignmentParts(partMenu.assignment.contentSnapshot).map(
      (summary) => ({
        summary,
        completed: isPartCompleted(summary, answeredIds),
      }),
    )
  }, [partMenu, answeredIds])

  const handleNavSelect = (id: MainHomeNavTabId) => {
    if (id === 'home') {
      onCloseReview?.()
      onCloseGym?.()
      onGoMain?.()
      return
    }
    if (id === 'review') {
      onCloseSettings?.()
      onCloseGym?.()
      onOpenReview?.()
      return
    }
    if (id === 'gym') {
      onCloseSettings?.()
      onCloseReview?.()
      onOpenGym?.()
      return
    }
    if (id === 'menu') {
      onCloseReview?.()
      onCloseGym?.()
      onOpenSettings?.()
      return
    }
    if (id === 'vocab') {
      // 갈 화면이 아직 없다. 무동작이면 눌리지 않는 버튼으로 보이니 이유를 알려 준다.
      setNavNotice(VOCAB_COMING_SOON)
    }
  }

  /**
   * 성을 탭하면 **바로 들어가지 않고** 성 위에 파트 선택 카드를 띄운다.
   * 재도전 이어풀기 중일 때만 예전처럼 곧장 들어간다 — 그때는 고를 게 없다.
   */
  const openAssignmentOrConfirmRetry = (
    assignment: StudentAssignment,
    castleIndex: number,
  ) => {
    playTapSfx()
    /*
      틀린문제만은 **연습을 이어서** 연다. 예전엔 `retryingAssignmentId`를 같이 써서
      이 분기로 들어왔고, 그러면 오답 필터 없이 전체 과제가 다시 열려 **처음부터
      전부** 풀어야 했다.
    */
    if (wrongOnlyAssignmentId === assignment.assignmentId) {
      onOpenAssignment?.(assignment, { isWrongOnly: true })
      return
    }
    if (retryingAssignmentId === assignment.assignmentId) {
      onOpenAssignment?.(assignment, { isRetry: true })
      return
    }
    setPartMenu({ assignment, castleIndex })
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

  /*
    그리는 성 = 부여분 + 앞으로 갈 길(`CASTLE_LOOKAHEAD`), **최소 `MIN_DRAWN_CASTLES`개.**

    **성은 과제 유무와 무관하게 항상 그린다**(2026-08-11). 예전엔 「부여분 + 1」이라
    과제가 없으면 성이 딱 하나만 남아 맵이 텅 빈 것처럼 보였다. 성은 지도의 지형이고,
    과제가 부여되면 그 성이 **눌리게** 되는 것이지 그때 생기는 게 아니다.
    클릭(`CastleHit`)은 여전히 부여된 성에만 붙고, 나머지는 자물쇠다.
  */
  const drawnSlots = MAP_CASTLE_SLOTS.slice(
    0,
    useServerAssignments
      ? Math.min(
          Math.max(
            visibleSlots.length + CASTLE_LOOKAHEAD,
            MIN_DRAWN_CASTLES,
          ),
          MAP_CASTLE_SLOTS.length,
        )
      : FREE_MAP_CASTLE_COUNT,
  )

  const currentFocus = useServerAssignments
    ? resolveCurrentCastleFocus(
        serverList,
        visibleSlots.length,
        retryingAssignmentId ?? wrongOnlyAssignmentId,
      )
    : {
        index:
          retryingDemoIndex === 0 || retryingDemoIndex === 1
            ? retryingDemoIndex
            : star2Completed
              ? 1
              : star1Completed
                ? 0
                : null,
      }
  const currentCastleIndex = currentFocus.index

  /**
   * 「다음에 풀 성」 — 아직 손도 안 댄 첫 성. 이 하나만 깃발을 튀어오르게 한다.
   * 부여된 성이 여러 개여도 학생이 봐야 할 건 다음 하나뿐이라, 나머지는 조용히 둔다.
   */
  const nextCastleIndex = useServerAssignments
    ? serverList
        .slice(0, visibleSlots.length)
        .findIndex(
          (assignment) =>
            assignment.status !== 'completed' &&
            assignment.status !== 'in_progress',
        )
    : -1

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
      className="flex min-h-full w-full justify-center"
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
            background: MAIN_HOME_SKY_GRADIENT,
          }}
        />

        {/* 복습·설정과 동일 — 왼쪽 18:00 · 오른쪽 신호/와이파이/배터리 */}

        <div
          ref={scrollRef}
          onScroll={(event) => {
            const el = event.currentTarget
            // 렌더 폭이 393이 아닐 수 있다(최대 540) — 프레임 단위로 환산
            const scale = el.clientWidth > 0 ? el.clientWidth / FRAME_W : 1
            setMapScrollFrame(el.scrollTop / scale)
          }}
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
            {/* 풀밭 + 길 (벡터). 성·자물쇠·장식은 더 이상 배경에 구워져 있지 않고 아래에서 그린다 */}
            <MainHomeMapCanvas />
            <MainHomeMapDecor />

            {/*
              성 — 예전에는 맵 이미지에 구워져 있었다. 배경이 벡터로 바뀌면서 여기서 그린다.

              **아직 과제가 안 나간 성도 미리 다 그린다.** 앞으로 갈 길이 보여야 지도처럼 읽힌다.
              대신 자물쇠를 얹고 클릭(`CastleHit`)은 부여된 성에만 붙인다.
              색은 성마다 다르다 (`getCastleAccentColor` → `MapCastleSprite`).
            */}
            {drawnSlots.map((castle, index) => (
              <MapCastleSprite
                key={`castle-${castle.id}`}
                color={getCastleAccentColor(index)}
                className="pointer-events-none absolute z-[1] select-none"
                style={fullMapRectStyle(castle.x, castle.y, castle.w, castle.h)}
              />
            ))}

            {/* 아직 안 준 성 — 자물쇠 */}
            {drawnSlots.slice(visibleSlots.length).map((castle, offset) => (
              <CastleLockBadge
                key={`lock-${castle.id}`}
                index={visibleSlots.length + offset}
              />
            ))}

            <StartFlag />

            {currentCastleIndex === null ? (
              <StartLocationMascot />
            ) : (
              <CastleCompleteMascot
                castle={visibleSlots[currentCastleIndex]!}
                showCurrentLocation
              />
            )}

            {/*
              완료=별표 / 재도전·진행중=코랄 필 / 부여·미시작=깃발.
              마커는 성 꼭대기 기준 통일 자리(`castleCompleteMarkerCenter`).
              베이크 자물쇠가 어긋난 성(특히 1성)은 잔디 덮개로만 가린다.
              자물쇠는 **아직 안 준 성**에만 남는다.
            */}
            {useServerAssignments
              ? serverList.slice(0, visibleSlots.length).map((assignment, index) => {
                  const marker = castleCompleteMarkerCenter(index)
                  if (wrongOnlyAssignmentId === assignment.assignmentId) {
                    return (
                      <Fragment key={`wrong-${assignment.assignmentId}`}>
                        <CastleStatusPill
                          style={castleWrongOnlyPillStyle(marker.cx, marker.cy)}
                          label="틀린문제 푸는중!"
                          tone="coral"
                          bounce
                        />
                      </Fragment>
                    )
                  }
                  const isRetrying = retryingAssignmentId === assignment.assignmentId
                  if (isRetrying) {
                    return (
                      <Fragment key={`retry-${assignment.assignmentId}`}>
                        <CastleRetryingPill
                          style={castleRetryingPillStyle(marker.cx, marker.cy)}
                        />
                      </Fragment>
                    )
                  }
                  if (assignment.status === 'completed') {
                    return (
                      <Fragment key={`done-${assignment.assignmentId}`}>
                        <MissionCheckBadge
                          color={getCastleAccentColor(index)}
                          style={fullMapMarkerStyle(marker.cx, marker.cy)}
                          alt={`${assignment.title} 완료`}
                        />
                      </Fragment>
                    )
                  }
                  if (assignment.status === 'in_progress') {
                    return (
                      <Fragment key={`progress-${assignment.assignmentId}`}>
                        <CastleRetryingPill
                          label="진행중"
                          style={castleRetryingPillStyle(marker.cx, marker.cy)}
                        />
                      </Fragment>
                    )
                  }
                  return (
                    <Fragment key={`assigned-${assignment.assignmentId}`}>
                      <CastleAssignedFlag
                        color={getCastleAccentColor(index)}
                        style={fullMapMarkerStyle(marker.cx, marker.cy)}
                        next={index === nextCastleIndex}
                        alt={`${assignment.title} 과제 부여됨${
                          index === nextCastleIndex ? ' · 다음에 풀 성' : ''
                        }`}
                      />
                    </Fragment>
                  )
                })
              : (
                  <>
                    {star1Completed || retryingDemoIndex === 0 ? (
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
                    ) : (
                      <CastleAssignedFlag
                        color={getCastleAccentColor(0)}
                        style={fullMapMarkerStyle(
                          castleCompleteMarkerCenter(0).cx,
                          castleCompleteMarkerCenter(0).cy,
                        )}
                        next
                      />
                    )}
                    {star2Completed || retryingDemoIndex === 1 ? (
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
                    ) : (
                      <CastleAssignedFlag
                        color={getCastleAccentColor(1)}
                        style={fullMapMarkerStyle(
                          castleCompleteMarkerCenter(1).cx,
                          castleCompleteMarkerCenter(1).cy,
                        )}
                        next={star1Completed}
                      />
                    )}
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
                        wrongOnlyAssignmentId === assignment.assignmentId
                          ? `${assignment.title} 틀린문제 이어서 풀기`
                          : retryingAssignmentId === assignment.assignmentId
                            ? `${assignment.title} 재도전 이어서 풀기`
                          : isCompleted
                            ? `${assignment.title} 재도전`
                            : `${assignment.title} 시작`
                      }
                      onClick={() => openAssignmentOrConfirmRetry(assignment, index)}
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

        <div className="pointer-events-none absolute inset-0 z-10">
          {/*
            오늘의 미션 카드(y 70~186) 위 빈 밴드. 고정 헤더 안이라 맵을 스크롤해도 따라다닌다.
            absolute라 스트릭이 늦게 도착해도 카드가 밀리지 않는다.
          */}
          {/* 연속 학습 배지 — Figma 기준 (12, 65). 좌표는 `StudyStreakBadge`의 BADGE 상수 */}
          <StudyStreakBadge streak={studyStreak} />
          <TodayMissionCard
            assignments={serverList}
            retryingAssignmentId={retryingAssignmentId}
            onOpen={(assignment) => {
              // 카드는 고정 헤더에 있어 팝오버를 붙일 성이 없다 — 처음부터 바로 진입
              playTapSfx()
              onOpenAssignment?.(assignment, {
                isRetry: retryingAssignmentId === assignment.assignmentId,
              })
            }}
          />
        </div>

        {/*
          파트 선택 카드 — **맵이 아니라 프레임 레벨**에 그린다.

          맵 컨테이너는 `overflow-hidden`이고 위쪽이 `MAP_SKY_CROP`에서 잘려서, 안에 두면
          1성 카드가 성을 덮거나 잘렸다. 여기로 빼면 **하늘 위까지 자유롭게 넘어간다**
          (사용자 지정 2026-08-10 — 성을 덮느니 하늘로 넘어가는 쪽).

          대신 맵을 따라 움직이도록 스크롤을 직접 빼야 한다:
            프레임 y = SKY_FIXED_H + (맵 y − MAP_SKY_CROP) − 스크롤(프레임 단위)
        */}
        {partMenu && visibleSlots[partMenu.castleIndex] ? (
          <>
            <button
              type="button"
              aria-label="파트 선택 닫기"
              onClick={() => setPartMenu(null)}
              className="absolute inset-0 z-[45] cursor-default bg-transparent"
            />
            {(() => {
              const castle = visibleSlots[partMenu.castleIndex]!
              const allDone =
                partMenuItems.length > 0 &&
                partMenuItems.every((item) => item.completed)
              const height = castlePartMenuHeight(partMenuItems.length, allDone)
              const centerX = castle.x + castle.w / 2
              const left = Math.min(
                Math.max(centerX - CASTLE_PART_MENU_WIDTH / 2, 8),
                FRAME_W - CASTLE_PART_MENU_WIDTH - 8,
              )
              // 성마다 **같은 규칙** — 몸통 꼭대기 위 8px. 클램프하지 않는다.
              const mapTop = castleBodyRect(castle).y - height - 8
              const frameTop =
                SKY_FIXED_H + (mapTop - MAP_SKY_CROP) - mapScrollFrame
              return (
                <CastlePartMenu
                  deadlineNote={resolveDeadlineNote(partMenu.assignment)}
                  assignmentTitle={partMenu.assignment.title}
                  items={partMenuItems}
                  showScoreRow={allDone}
                  style={figmaRectStyle({
                    x: left,
                    y: frameTop,
                    w: CASTLE_PART_MENU_WIDTH,
                    h: height,
                  })}
                  onEnterPart={(part) => {
                    const target = partMenu.assignment
                    setPartMenu(null)
                    onOpenAssignment?.(target, { isRetry: false, part })
                  }}
                  onOpenScore={() => {
                    const target = partMenu.assignment
                    setPartMenu(null)
                    onOpenCompletedCastle?.({
                      kind: 'assignment',
                      assignment: target,
                    })
                  }}
                />
              )
            })()}
          </>
        ) : null}

        <PraiseCalendarButton
          style={figmaRectStyle(PRAISE_CALENDAR_FIXED_RECT)}
          onClick={onOpenPraiseCalendar}
        />

        {!settingsOpen && !reviewOpen && !gymOpen ? (
          <>
            <MainHomeBottomNav activeId="home" onSelect={handleNavSelect} />
            {/* 오답이 내려왔는데 성 맵엔 안 뜨니, 내비 위에 알려 준다 */}
            <GymNewBadge count={gymAssignments.length} />
          </>
        ) : null}

        {gymOpen ? (
          <GymScreen
            assignments={gymAssignments}
            onSelectNav={handleNavSelect}
            onStart={(assignment) => {
              onCloseGym?.()
              onOpenAssignment?.(assignment, { isRetry: false })
            }}
          />
        ) : null}

        {reviewOpen ? (
          <ReviewMainWindow
            onSelectNav={(id) => handleNavSelect(id)}
            onStartReview={onStartReview}
          />
        ) : null}

        {settingsOpen && onCloseSettings ? (
          <SettingsWindow
            onClose={onCloseSettings}
            onSelectNav={(id) => handleNavSelect(id)}
          />
        ) : null}

      </div>

      <NavNoticeToast message={navNotice} onHide={() => setNavNotice(null)} />
    </div>
  )
}


