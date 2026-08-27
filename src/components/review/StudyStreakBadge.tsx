import type { StudyStreak } from '../../features/review/review-streak'
import {
  isStreakDay1,
  STREAK_BADGE_SHAPE_IN_SVG,
  STREAK_BADGE_SVG_BOX,
  StudyStreakBadgeArt,
} from './StudyStreakBadgeArt'

/**
 * 「연속 학습」 별·구름 배지. 학원/학교 메인 맵 위에 얹는다.
 *
 * 그림 자체는 `StudyStreakBadgeArt`가 그린다 — 축하 화면
 * (`streak-celebration/StreakCelebrationScreen`)이 같은 그림을 크게 쓰기 때문에
 * 안쪽 글자 좌표를 한 곳에 모아 뒀다. 여기는 **프레임 위 자리 잡기**만 한다.
 *
 * 탭하면 연속 학습 캘린더(`StreakCalendarScreen`)를 연다. 부모 맵 레이어가
 * `pointer-events-none`이라 버튼에 `pointer-events-auto`가 필요하다.
 */

/**
 * Figma 프레임(393×852) 기준 **그림(도형) 자리** — 사용자 지정 (2026-08-08).
 * Figma의 X/Y/W/H는 그림자 같은 효과를 뺀 도형 경계라서, 여기 값도 도형 기준이다.
 */
const SHAPE = { x: 12, y: 65, w: 110.61, h: 54 } as const

/**
 * 그림자 여백까지 포함한 `<img>` 박스 — 도형이 `SHAPE` 자리에 정확히 오도록 역산한다.
 * 왼쪽/위로 여백만큼 넘칠 수 있으나(투명) 화면에는 영향이 없다.
 */
const scaleX = SHAPE.w / STREAK_BADGE_SHAPE_IN_SVG.w
const scaleY = SHAPE.h / STREAK_BADGE_SHAPE_IN_SVG.h
const BADGE = {
  x: SHAPE.x - STREAK_BADGE_SHAPE_IN_SVG.x * scaleX,
  y: SHAPE.y - STREAK_BADGE_SHAPE_IN_SVG.y * scaleY,
  w: STREAK_BADGE_SVG_BOX.w * scaleX,
  h: STREAK_BADGE_SVG_BOX.h * scaleY,
} as const

/** 축하 화면의 「배지가 날아오는」 출발점 계산용 — 메인에서 배지가 앉는 도형 중심(프레임 좌표) */
export const STREAK_BADGE_HOME_CENTER = {
  cx: SHAPE.x + SHAPE.w / 2,
  cy: SHAPE.y + SHAPE.h / 2,
} as const

function streakBadgeAriaLabel(streak: StudyStreak): string {
  const status = isStreakDay1(streak.days)
    ? '학습 시작 · 1일째'
    : `${streak.days}일 연속 학습 중${streak.includesToday ? '' : ' · 오늘 학습 전'}`
  return `연속 학습 캘린더 열기 · ${status}`
}

export function StudyStreakBadge({
  streak,
  onClick,
}: {
  streak: StudyStreak
  onClick?: () => void
}) {
  if (streak.days < 1) return null

  const positionStyle = {
    left: `${(BADGE.x / 393) * 100}%`,
    top: `${(BADGE.y / 852) * 100}%`,
    width: `${(BADGE.w / 393) * 100}%`,
    aspectRatio: `${BADGE.w} / ${BADGE.h}`,
  }

  const art = (
    <StudyStreakBadgeArt
      days={streak.days}
      className={
        onClick
          ? 'h-full w-full select-none'
          : 'pointer-events-none absolute z-[3] select-none'
      }
      style={onClick ? undefined : positionStyle}
      ariaLabel={onClick ? undefined : streakBadgeAriaLabel(streak)}
    />
  )

  if (!onClick) return art

  return (
    <button
      type="button"
      aria-label={streakBadgeAriaLabel(streak)}
      className="pointer-events-auto absolute z-[3] cursor-pointer bg-transparent"
      style={positionStyle}
      onClick={onClick}
    >
      {art}
    </button>
  )
}
