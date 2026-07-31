import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CurriculumBottomNav } from '../components/curriculum-main/CurriculumBottomNav'
import { CurriculumDayNodes } from '../components/curriculum-main/CurriculumDayNodes'
import { CurriculumDinosaurDecor } from '../components/curriculum-main/CurriculumDinosaurDecor'
import { CurriculumSkyHeader } from '../components/curriculum-main/CurriculumSkyHeader'
import { CurriculumTreeDecor } from '../components/curriculum-main/CurriculumTreeDecor'
import {
  clearCompletedDays,
  clearCourseSelection,
  CURRICULUM_MAP_BG_ASSET,
  type CurriculumCourseSelection,
  type CurriculumDayId,
  curriculumProgressPercent,
  FRAME_H,
  FRAME_W,
  loadCompletedDays,
  loadCourseSelection,
  LONG_CONTENT_H,
  longMapRectStyle,
  MAP_GRASS_FILL,
  MAP_GRASS_SEAM_RECT,
  MAP_SCROLL_CONTENT_H,
  NAV_H,
  saveCompletedDays,
  SKY_H,
  type CurriculumNavTabId,
} from '../components/curriculum-main/curriculum-main'
import { SettingsWindow } from '../components/settings/SettingsWindow'
import { useBackNavigation } from '../components/navigation/BackNavigationProvider'
import { getStoredAuth } from '../lib/auth'

type LocationState = {
  courseSelection?: CurriculumCourseSelection
}

/**
 * 혼자 공부 학생이 「특별 내신 코스 생성하기」 후 진입하는 메인 맵.
 *
 * - 하늘: 선택한 학년·교재·단원 칩 + 진도 미션 카드 (React 고정)
 * - 맵 배경: `메인화면LONG` — 길면 세로 드래그/스크롤
 * - Day 1~9: 주 단위 순차 해금(1–3 → 4–6 → 7–9)
 * - 하단 내비: `커리큘럼 시작` 하단 고정 + 투명 히트 영역
 */
export function CurriculumMainScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [completedDays, setCompletedDays] = useState<Set<number>>(
    () => loadCompletedDays(),
  )

  const courseSelection = useMemo(() => {
    const fromState = (location.state as LocationState | null)?.courseSelection
    return fromState ?? loadCourseSelection()
  }, [location.state])

  const progressPercent = curriculumProgressPercent(completedDays)

  useEffect(() => {
    const user = getStoredAuth()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!courseSelection) {
      navigate('/student/curriculum', { replace: true })
    }
  }, [navigate, courseSelection])

  useBackNavigation(() => {
    if (settingsOpen) {
      setSettingsOpen(false)
      return
    }
    navigate('/student/curriculum', { replace: true })
  })

  /** 홈 → 혼자 공부 커리큘럼 메인 · 전체 → 설정 창 */
  const goToCurriculumMain = () => {
    setSettingsOpen(false)
    navigate('/student/curriculum/main', { replace: true })
  }

  const handleNavSelect = (id: CurriculumNavTabId) => {
    if (id === 'home') {
      goToCurriculumMain()
      return
    }
    if (id === 'menu') {
      setSettingsOpen(true)
    }
  }

  const handleCompleteDay = (day: CurriculumDayId) => {
    setCompletedDays((prev) => {
      if (prev.has(day)) return prev
      const next = new Set(prev)
      next.add(day)
      saveCompletedDays(next)
      return next
    })
  }

  /** 하늘·하단 네비를 뺀 스크롤 영역 높이 */
  const mapScrollH = MAP_SCROLL_CONTENT_H - SKY_H
  const scrollAreaBottomPct = (NAV_H / FRAME_H) * 100
  const skyPct = (SKY_H / FRAME_H) * 100

  if (!courseSelection) return null

  return (
    <div className="flex min-h-dvh w-full justify-center bg-[#CFF2FF]">
      <div
        className="relative w-full max-w-[540px] self-center overflow-hidden bg-[#CFF2FF]"
        style={{ aspectRatio: `${FRAME_W} / ${FRAME_H}` }}
      >
        <div
          className="absolute inset-x-0 overflow-y-auto overscroll-y-contain touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            top: `${skyPct}%`,
            bottom: `${scrollAreaBottomPct}%`,
            background: MAP_GRASS_FILL,
          }}
        >
          <div
            className="relative w-full"
            style={{ aspectRatio: `${FRAME_W} / ${mapScrollH}` }}
          >
            <div
              className="absolute left-0 w-full max-w-none"
              style={{
                top: `${(-SKY_H / mapScrollH) * 100}%`,
                height: `${(LONG_CONTENT_H / mapScrollH) * 100}%`,
              }}
            >
              <img
                src={CURRICULUM_MAP_BG_ASSET}
                alt=""
                aria-hidden
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full max-w-none select-none"
              />
              {/* 하늘은 하늘색 유지 · 맵 레이어에서만 풀 복도(캐릭터 통과 구간) 보정 */}
              <div
                aria-hidden
                className="pointer-events-none absolute z-0"
                style={{
                  ...longMapRectStyle(MAP_GRASS_SEAM_RECT),
                  background: MAP_GRASS_FILL,
                }}
              />
              <CurriculumDinosaurDecor />
              <CurriculumTreeDecor />
              <CurriculumDayNodes
                completedDays={completedDays}
                onCompleteDay={handleCompleteDay}
              />
            </div>
            <span className="sr-only">내신 코스 메인 맵</span>
          </div>
        </div>

        <CurriculumSkyHeader
          selection={courseSelection}
          progressPercent={progressPercent}
          onAddCourse={() => navigate('/student/curriculum', { replace: true })}
          onDeleteCourse={() => {
            clearCourseSelection()
            clearCompletedDays()
            navigate('/student/curriculum', { replace: true })
          }}
        />

        {!settingsOpen ? (
          <CurriculumBottomNav activeId="home" onSelect={handleNavSelect} />
        ) : null}

        {settingsOpen ? (
          <SettingsWindow
            onClose={() => setSettingsOpen(false)}
            onSelectNav={handleNavSelect}
          />
        ) : null}
      </div>
    </div>
  )
}
