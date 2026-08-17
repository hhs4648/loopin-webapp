import { MIN_STREAK_DAYS_TO_SHOW } from '../../features/review/review-streak'
import type { StudyStreakWithWeek } from '../../features/review/use-study-streak'
import { REVIEW_STREAK_CARD_ASSET } from './review-main'

/**
 * 복습하기 「오늘의 맞춤 복습」 카드 **아래 연속 학습 배너**.
 *
 * 시안 `복습 화면 추가.svg`에서 **글자 두 줄과 동그라미를 떼어낸** 것이
 * `review-streak-card.svg`다(카드·일러스트만 남김). 숫자·문구가 매일 바뀌고 동그라미도
 * 요일별로 달라져서 구운 그림으로는 안 된다 — `streak-badge`와 같은 방식.
 *
 * 시안 실측 (377×120 · 카드 353×96 @12,12):
 * - 일러스트 69.5×71 @ (17, 24)
 * - 1행 글자 x101 y~43 · 2행 x105 y~54 · 색 `#618CD1`
 * - 동그라미 cy 82 · r 6 · 20 간격 · 채움 `#24A0FF`
 *   시안엔 5개였는데 **월~일 7개로 늘렸다**(사용자 지정 2026-08-11).
 */

const BOX = { w: 377, h: 120 } as const
/** 동그라미 — 시안 간격 그대로, 개수만 7로 */
const DOT = { firstCx: 102, gap: 20, cy: 82, r: 6 } as const
const DOT_ON = '#24A0FF'
const TEXT_COLOR = '#618CD1'

/**
 * 아래 문구 — 상황에 맞춰 바뀐다.
 *
 * 「내일도 하면 N일 연속」은 **오늘 이미 한 경우에만** 맞는 말이다. 오늘 아직 안 했으면
 * 내일이 아니라 오늘이 이어갈 기회이고, 기록이 없으면 「이어간다」가 성립하지 않는다.
 */
export function resolveStreakMessage(streak: StudyStreakWithWeek): string {
  if (streak.days <= 0) return '오늘 시작하면 1일 연속이에요!'
  if (streak.includesToday) {
    return `내일도 하면 ${streak.days + 1}일 연속 달성이에요!`
  }
  return `오늘 하면 ${streak.days + 1}일 연속 달성이에요!`
}

/**
 * 윗줄 — **「연속 복습」이 아니라 「연속 학습」**이다.
 * 지금 세는 건 과제를 푼 날이고, 복습 세션은 연습 모드라 기록이 남지 않는다
 * (`features/review/review-streak.ts` 주석). 복습을 한 번도 안 한 학생에게
 * 「3일 연속 복습 중」을 띄우면 거짓말이 된다.
 */
function resolveStreakTitle(streak: StudyStreakWithWeek): string {
  if (streak.days < MIN_STREAK_DAYS_TO_SHOW) return '오늘부터 이어가 볼까요?'
  return `${streak.days}일 연속 학습 중`
}

export function ReviewStreakCard({ streak }: { streak: StudyStreakWithWeek }) {
  /*
    동그라미는 **실제 요일별 기록**(`streak.week`)이다 — 연속 일수에서 역산하지 않는다.
    연속은 주 경계를 넘어 이어지므로 「3일 연속인데 이번 주엔 2칸」이 정상이다.
  */
  const week = streak.week

  return (
    <div
      className="relative -mx-3 mt-1 w-[calc(100%+1.5rem)] select-none"
      style={{ aspectRatio: `${BOX.w} / ${BOX.h}` }}
      role="img"
      aria-label={`${resolveStreakTitle(streak)}. ${resolveStreakMessage(streak)}`}
    >
      <img
        src={REVIEW_STREAK_CARD_ASSET}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full max-w-none"
      />

      {/* 글자·동그라미는 같은 viewBox 안에 그려야 카드가 커져도 같은 비율로 따라간다 */}
      <svg
        aria-hidden
        viewBox={`0 0 ${BOX.w} ${BOX.h}`}
        className="absolute inset-0 h-full w-full"
      >
        <text
          x={101}
          y={43}
          fontSize={13}
          fontWeight="700"
          fill={TEXT_COLOR}
          dominantBaseline="hanging"
        >
          {resolveStreakTitle(streak)}
        </text>
        <text
          x={101}
          y={58}
          fontSize={11}
          fontWeight="500"
          fill={TEXT_COLOR}
          dominantBaseline="hanging"
        >
          {resolveStreakMessage(streak)}
        </text>

        {week.map((cell, index) => {
          const cx = DOT.firstCx + DOT.gap * index
          const on = cell.studied
          return (
            <g key={cell.label}>
              <circle
                cx={cx}
                cy={DOT.cy}
                r={on ? DOT.r : DOT.r - 0.75}
                fill={on ? DOT_ON : 'white'}
                stroke={on ? undefined : DOT_ON}
                strokeWidth={on ? undefined : 1.5}
              />
              {/* 오늘 칸은 링을 하나 더 둘러 어디까지 왔는지 보이게 */}
              {cell.isToday ? (
                <circle
                  cx={cx}
                  cy={DOT.cy}
                  r={DOT.r + 2.5}
                  fill="none"
                  stroke={DOT_ON}
                  strokeWidth={1}
                  opacity={0.45}
                />
              ) : null}
              <text
                x={cx}
                y={DOT.cy + DOT.r + 3}
                fontSize={7}
                fontWeight="600"
                fill={TEXT_COLOR}
                textAnchor="middle"
                dominantBaseline="hanging"
              >
                {cell.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
