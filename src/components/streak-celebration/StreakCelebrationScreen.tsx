import { useEffect, useRef, useState } from 'react'

import { MAIN_HOME_SKY_GRADIENT } from '../main-home/assignment-home'
import { STREAK_BADGE_HOME_CENTER } from '../review/StudyStreakBadge'
import {
  isStreakDay1,
  streakBadgeBoxForShapeWidth,
  StudyStreakBadgeArt,
} from '../review/StudyStreakBadgeArt'
import {
  STREAK_BADGE_LAND_MS,
  STREAK_NUMBER_CHANGE_MS,
  STREAK_TAP_BLOCK_MS,
  type StreakCelebration,
} from './streak-celebration'

/**
 * 「N일 연속 학습」 축하 화면 — 과제를 끝내고 **스트릭을 늘린 그 한 번**에만 뜬다.
 * 발동 규칙은 `streak-celebration.ts`, 스트릭 계산은 `features/review/review-streak.ts`.
 *
 * 연출: **메인 화면의 별 배지가 날아와 앉은 뒤, 별 안 숫자가 어제 값에서 오늘 값으로 바뀐다.**
 * 새 그림을 만들지 않고 `StudyStreakBadgeArt`(메인 맵의 그 배지)를 그대로 크게 쓴다 —
 * 같은 물건이 커져서 날아온 것으로 읽혀야 「내 스트릭이 자랐다」가 전달된다.
 *
 * 숫자를 0부터 세지 않고 **N-1 → N**으로 바꾸는 게 핵심이다. 0부터 세면 오늘 처음
 * 시작한 것처럼 보인다. 1일차는 에셋이 웃는 얼굴이라 바꿀 숫자가 없어 그냥 날아오기만 한다.
 *
 * 화면 전체가 버튼이다. 다만 **`STREAK_TAP_BLOCK_MS` 동안은 안 먹는다** — 완료 화면
 * CTA를 연타하던 손가락이 그대로 축하 화면을 지워 버리는 걸 막는다.
 */

/** 배지 도형 폭(프레임 393 기준). 별 안 숫자가 읽히려면 이 정도는 돼야 한다 */
const BADGE_SHAPE_W = 250
const BADGE_BOX = streakBadgeBoxForShapeWidth(BADGE_SHAPE_W)

/** 색종이 — 위치·색·시간을 고정 배열로(랜덤이면 리마운트 때마다 달라져 튄다) */
const CONFETTI = [
  { left: 8, delay: 0, duration: 2600, color: '#4F91EB', w: 7, h: 11 },
  { left: 18, delay: 320, duration: 3000, color: '#FFC92D', w: 6, h: 10 },
  { left: 29, delay: 120, duration: 2400, color: '#FF7A59', w: 8, h: 8 },
  { left: 41, delay: 520, duration: 2900, color: '#39B548', w: 6, h: 12 },
  { left: 53, delay: 60, duration: 2700, color: '#4F91EB', w: 7, h: 9 },
  { left: 64, delay: 420, duration: 3100, color: '#FFC92D', w: 8, h: 11 },
  { left: 74, delay: 200, duration: 2500, color: '#981AF2', w: 6, h: 9 },
  { left: 86, delay: 600, duration: 2800, color: '#FF7A59', w: 7, h: 10 },
  { left: 94, delay: 260, duration: 3000, color: '#39B548', w: 6, h: 11 },
] as const

function WeekStrip({ week }: { week: StreakCelebration['week'] }) {
  return (
    <div className="flex items-start justify-center gap-2.5">
      {week.map((cell, index) => (
        <div key={cell.label} className="flex w-9 flex-col items-center gap-1.5">
          <span
            className={`text-[12px] leading-none font-semibold ${
              cell.isToday ? 'text-[#E58A00]' : 'text-[#7C8698]'
            }`}
          >
            {cell.label}
          </span>
          <span
            className={`streak-anim grid h-9 w-9 place-items-center rounded-full ${
              cell.studied
                ? 'bg-gradient-to-b from-[#FFD24D] to-[#F5A524] shadow-[0_2px_6px_rgba(245,165,36,0.38)]'
                : cell.isFuture
                  ? 'border border-dashed border-[#CBD5E4] bg-white/50'
                  : 'border border-[#E2E8F2] bg-white/70'
            }`}
            style={
              // 오늘 칸은 숫자가 바뀌는 순간에 맞춰 톡 찍힌다
              cell.isToday && cell.studied
                ? {
                    animation: `streak-today-pop 520ms cubic-bezier(0.34,1.56,0.64,1) ${STREAK_NUMBER_CHANGE_MS}ms both`,
                  }
                : {
                    animation: `streak-rise-in 320ms ease-out ${
                      STREAK_BADGE_LAND_MS + index * 45
                    }ms both`,
                  }
            }
          >
            {cell.studied ? (
              <svg
                aria-hidden
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.8 10 17.5 19 7" />
              </svg>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  )
}

export function StreakCelebrationScreen({
  celebration,
  onDone,
}: {
  celebration: StreakCelebration
  onDone: () => void
}) {
  const day1 = isStreakDay1(celebration.days)

  /**
   * 배지에 그릴 숫자. 착지 전에는 **어제 값**을 들고 있다가 바뀐다.
   * 1일차는 바꿀 숫자가 없으니 처음부터 그대로 둔다.
   */
  const [shownDays, setShownDays] = useState(() =>
    day1 ? celebration.days : Math.max(1, celebration.days - 1),
  )
  const [tappable, setTappable] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    if (day1) return
    const timer = window.setTimeout(
      () => setShownDays(celebration.days),
      STREAK_NUMBER_CHANGE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [celebration.days, day1])

  useEffect(() => {
    const timer = window.setTimeout(() => setTappable(true), STREAK_TAP_BLOCK_MS)
    return () => window.clearTimeout(timer)
  }, [])

  /** 탭이 두 번 먹어 완료 화면까지 넘어가는 것을 막는다 */
  const finish = () => {
    if (!tappable || doneRef.current) return
    doneRef.current = true
    onDone()
  }

  const studiedThisWeek = celebration.week.filter((cell) => cell.studied).length
  const numberChanged = !day1 && shownDays === celebration.days

  /**
   * 날아오는 출발점 — 메인 맵에서 배지가 앉아 있던 자리(좌상단) 방향.
   * 착지 지점은 화면 가운데 위쪽이므로 그 차이만큼 왼쪽·위에서 들어온다.
   */
  const fromX = STREAK_BADGE_HOME_CENTER.cx - 393 / 2
  const fromY = STREAK_BADGE_HOME_CENTER.cy - 852 * 0.3

  return (
    <div
      className="flex min-h-full w-full justify-center"
      style={{ background: MAIN_HOME_SKY_GRADIENT }}
    >
      <button
        type="button"
        onClick={finish}
        aria-label={
          day1
            ? '학습 시작 · 1일째 · 눌러서 계속하기'
            : `${celebration.days}일 연속 학습 · 눌러서 계속하기`
        }
        className="relative aspect-[393/852] w-full max-w-[540px] cursor-pointer self-center overflow-hidden border-0 p-0 text-left"
        style={{ background: MAIN_HOME_SKY_GRADIENT }}
      >
        {/* 색종이 — 장식이라 스크린리더에서 숨긴다 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {CONFETTI.map((piece, index) => (
            <span
              key={index}
              className="streak-anim absolute top-0 block rounded-[2px]"
              style={{
                left: `${piece.left}%`,
                width: piece.w,
                height: piece.h,
                background: piece.color,
                opacity: 0,
                animation: `streak-confetti-fall ${piece.duration}ms ease-in ${
                  piece.delay + STREAK_BADGE_LAND_MS
                }ms both`,
              }}
            />
          ))}
        </div>

        <div className="absolute inset-x-0 top-[22%] flex flex-col items-center px-6">
          <div
            className="relative flex items-center justify-center"
            style={{
              width: `${(BADGE_BOX.w / 393) * 100}%`,
              aspectRatio: `${BADGE_BOX.w} / ${BADGE_BOX.h}`,
            }}
          >
            {/* 뒤 글로우 */}
            <span
              aria-hidden
              className="streak-anim absolute inset-[-18%] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,201,45,0.40) 0%, rgba(255,201,45,0) 68%)',
                animation: `streak-glow-pulse 2200ms ease-in-out ${STREAK_BADGE_LAND_MS}ms infinite`,
              }}
            />
            {/* 착지 링 — 별이 앉는 순간 한 번 퍼진다 */}
            <span
              aria-hidden
              className="streak-anim absolute inset-[-6%] rounded-full border-2 border-[#FFC92D]"
              style={{
                opacity: 0,
                animation: `streak-land-ring 620ms ease-out ${
                  STREAK_BADGE_LAND_MS - 180
                }ms both`,
              }}
            />

            {/* 날아와 앉기 → 앉은 뒤 아주 작게 숨쉬기 */}
            <div
              className="streak-anim absolute inset-0"
              style={{
                ['--streak-from-x' as string]: `${fromX}px`,
                ['--streak-from-y' as string]: `${fromY}px`,
                animation: `streak-badge-fly-in ${STREAK_BADGE_LAND_MS}ms cubic-bezier(0.22,1,0.36,1) both`,
              }}
            >
              <div
                className="streak-anim h-full w-full"
                style={{
                  animation: `streak-badge-settle 2600ms ease-in-out ${STREAK_BADGE_LAND_MS}ms infinite`,
                }}
              >
                <StudyStreakBadgeArt
                  days={shownDays}
                  className="h-full w-full"
                  numberStyle={
                    numberChanged
                      ? { animation: 'streak-number-pop 460ms cubic-bezier(0.34,1.56,0.64,1) both' }
                      : undefined
                  }
                />
              </div>
            </div>
          </div>

          <p
            className="streak-anim mt-6 text-[14px] leading-none font-medium text-[#6B7382]"
            style={{
              animation: `streak-rise-in 320ms ease-out ${STREAK_BADGE_LAND_MS + 140}ms both`,
            }}
          >
            이번 주 {studiedThisWeek}일 공부했어요
          </p>

          <div
            className="streak-anim mt-5 w-full rounded-[18px] bg-white/75 px-4 py-4 shadow-[0_2px_14px_rgba(46,90,130,0.10)] backdrop-blur-[2px]"
            style={{
              animation: `streak-rise-in 340ms ease-out ${STREAK_BADGE_LAND_MS + 100}ms both`,
            }}
          >
            <WeekStrip week={celebration.week} />
          </div>
        </div>

        <p
          className="streak-anim absolute inset-x-0 bottom-[9%] text-center text-[14px] font-medium text-[#7C8698]"
          style={{
            animation: `streak-rise-in 300ms ease-out ${STREAK_TAP_BLOCK_MS}ms both`,
          }}
        >
          화면을 탭하세요
        </p>
      </button>
    </div>
  )
}
