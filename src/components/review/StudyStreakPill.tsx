import type { CSSProperties } from 'react'

import {
  MIN_STREAK_DAYS_TO_SHOW,
  type StudyStreak,
} from '../../features/review/review-streak'
import { REVIEW_COLORS } from './review-main'

/**
 * 「🔥 N일 연속 학습 중」 알약. 두 메인 화면과 복습하기가 같이 쓴다.
 *
 * **「연속 복습」이 아니라 「연속 학습」이다** — 복습 세션이 2단계라 「복습한 날」 기록이 아직
 * 없고, 지금 세는 건 과제를 푼 날이다. 자세한 이유는 `features/review/review-streak.ts` 주석.
 * 시안의 「5일 챌린지」는 별개 요소이고 아직 범위 밖이다.
 *
 * 2일 미만이면 아무것도 렌더하지 않는다(`MIN_STREAK_DAYS_TO_SHOW`) — 데이터가 도착하기 전에도
 * 마찬가지라, 호출 측은 **absolute로 배치**해서 늦게 나타날 때 레이아웃이 밀리지 않게 해야 한다.
 */
export function StudyStreakPill({
  streak,
  className = '',
  style,
}: {
  streak: StudyStreak
  className?: string
  style?: CSSProperties
}) {
  if (streak.days < MIN_STREAK_DAYS_TO_SHOW) return null

  return (
    <p
      className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] leading-none font-semibold whitespace-nowrap shadow-[0_2px_8px_rgba(33,38,51,0.10)] ${className}`}
      style={{ color: REVIEW_COLORS.toneHighText, ...style }}
    >
      <span aria-hidden>🔥</span>
      {streak.days}일 연속 학습 중
      {streak.includesToday ? null : (
        <span style={{ color: REVIEW_COLORS.textMuted }}>· 오늘도 이어가요</span>
      )}
    </p>
  )
}
