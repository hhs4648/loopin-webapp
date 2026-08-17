/**
 * 「N일 연속 학습 중」을 학원/학교 메인·복습하기가 공유하는 훅.
 *
 * 화면마다 따로 계산하면 같은 학생에게 서로 다른 숫자가 보인다 — 반 스코프나 조회 범위가
 * 조금만 달라도 갈린다. 출처를 한 곳(`fetchStudyTimestamps`)으로 묶어 둔다.
 */

import { useEffect, useState } from 'react'

import { fetchStudyTimestamps } from '../../lib/sync/review-api'
import {
  buildStreakWeek,
  computeStudyStreak,
  EMPTY_STUDY_STREAK,
  type StreakWeekCell,
  type StudyStreak,
} from './review-streak'

/** 연속 일수 + 이번 주(월~일) 요일별 학습 여부 */
export type StudyStreakWithWeek = StudyStreak & { week: StreakWeekCell[] }

/**
 * 첫 페인트를 막지 않는다 — 스트릭은 늦게 도착해도 되는 정보라,
 * 도착하기 전에는 `days: 0`이라 알약이 아예 렌더되지 않는다.
 * 그래서 알약은 반드시 **absolute 배치**여야 한다. 흐름에 넣으면 늦게 나타나면서 화면이 밀린다.
 */
export function useStudyStreak(): StudyStreakWithWeek {
  const [streak, setStreak] = useState<StudyStreakWithWeek>(() => ({
    ...EMPTY_STUDY_STREAK,
    week: buildStreakWeek([]),
  }))

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const timestamps = await fetchStudyTimestamps()
      if (cancelled) return
      // 주간 동그라미는 **연속 일수에서 역산하지 않는다** — 같은 원본(시각 목록)에서
      // 직접 뽑아야 「3일 연속인데 이번 주엔 2칸」 같은 실제 상황이 맞게 찍힌다.
      setStreak({
        ...computeStudyStreak(timestamps),
        week: buildStreakWeek(timestamps),
      })
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return streak
}
