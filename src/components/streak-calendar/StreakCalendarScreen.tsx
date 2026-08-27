import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { useStudyStreak } from '../../features/review/use-study-streak'
import { MainHomeBottomNav } from '../main-home/MainHomeBottomNav'
import type { MainHomeNavTabId } from '../main-home/assignment-home'
import { figmaRectStyle } from '../main-home/assignment-home'
import { BACK_MASK_WHITE_HEADER } from '../navigation/figma-navigation'
import {
  STREAK_CALENDAR_ASSET,
  STREAK_CALENDAR_BAKED_NAV_COVER,
  STREAK_CALENDAR_HOME_INDICATOR_COVER,
  STREAK_HERO_COVER,
  STREAK_HERO_STAR,
  STREAK_HERO_TEXT,
  streakStarAssetFor,
} from './streak-calendar'

/**
 * 메인 맵 연속 학습 배지 → 연속 학습 캘린더.
 *
 * 시안에 **뒤로가기 `<`·하단 내비·연속 일수가 전부 그림으로 구워져** 있었다. 눌리지도
 * 않고, 학생이 며칠을 이었든 늘 「15일」이 보였다. 그래서 구운 것은 덮고 앱 공통 부품과
 * 실데이터로 갈아 끼운다.
 *
 * - 뒤로가기: 공통 `<` (`BACK_MASK_WHITE_HEADER`로 구운 것 지움)
 * - 하단 내비: `MainHomeBottomNav` — 실제로 눌린다
 * - 연속 일수: `useStudyStreak()` — 맵·복습 배지와 **같은 출처**라 숫자가 갈리지 않는다
 *
 * 달력 격자는 아직 시안 그대로다(구워진 8월 달력). 그건 격자·강조 원까지 다시 그려야
 * 해서 별도 작업이다 — `HANDOFF`에 남겨 두었다.
 */
export function StreakCalendarScreen({
  onSelectNav,
}: {
  onSelectNav?: (id: MainHomeNavTabId) => void
}) {
  const streak = useStudyStreak()
  const days = streak.days
  const starAsset = streakStarAssetFor(days)

  return (
    <FigmaAssetFrame
      src={STREAK_CALENDAR_ASSET}
      alt="연속 학습 캘린더"
      bgClassName="bg-white"
      backButton="labeled"
      backButtonMask={BACK_MASK_WHITE_HEADER}
    >
      {/* 구운 별·문구를 지우고 실데이터로 다시 그린다 */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[3] bg-white"
        style={figmaRectStyle(STREAK_HERO_COVER)}
      />

      <div
        className="pointer-events-none absolute z-[4] flex items-center justify-center"
        style={figmaRectStyle(STREAK_HERO_STAR)}
      >
        {starAsset ? (
          <img
            src={starAsset}
            alt=""
            aria-hidden
            draggable={false}
            className="h-full w-full select-none object-contain"
          />
        ) : (
          /*
            아직 첫 목표(7일)를 못 넘겼다 — 얼굴 없이 **숫자만** 보여 준다.
            얼굴은 목표를 넘겼을 때의 보상이라, 처음부터 웃고 있으면 넘긴 티가 안 난다.
          */
          <span
            className="font-sans text-[26px] font-extrabold leading-none text-[#F5A623]"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {days}
          </span>
        )}
      </div>

      <div
        className="pointer-events-none absolute z-[4] flex items-center justify-center"
        style={figmaRectStyle(STREAK_HERO_TEXT)}
      >
        <p className="font-sans text-[20px] font-extrabold leading-none text-[#C98A2E]">
          {days > 0 ? `${days}일 연속 학습 중!` : '오늘부터 시작해요!'}
        </p>
      </div>

      {/*
        구워진 하단 내비를 덮는다. `MainHomeBottomNav`가 그 위에 올라가지만 시안 쪽이
        조금 더 높아 위아래로 삐져나온다 — 흰 덮개로 먼저 지운다.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[50] bg-white"
        style={figmaRectStyle(STREAK_CALENDAR_BAKED_NAV_COVER)}
      />
      {/*
        구운 홈 인디케이터(검은 막대). 실제 내비(z-60)보다 **아래**에 둬야 한다 —
        위에 두면 내비 아래쪽을 흰색으로 지워 버린다.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[2] bg-white"
        style={figmaRectStyle(STREAK_CALENDAR_HOME_INDICATOR_COVER)}
      />
      <MainHomeBottomNav activeId="home" onSelect={onSelectNav} />
    </FigmaAssetFrame>
  )
}
