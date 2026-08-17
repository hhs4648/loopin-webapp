/**
 * 「N일 연속 학습」 축하 화면의 데이터·발동 규칙.
 *
 * 듀오링고와 같은 규칙이다 — **스트릭을 늘린 그 한 번에만** 축하하고, 같은 날 두 번째
 * 과제부터는 조용히 넘어간다. 과제 3개 푼 날 세 번 뜨면 축하가 아니라 방해가 된다.
 */

import { fetchStudyTimestamps } from '../../lib/sync/review-api'
import { isSyncEnabled } from '../../lib/sync/supabase-client'
import {
  buildStreakWeek,
  computeStudyStreak,
  kstDayNumber,
  type StreakWeekCell,
} from '../../features/review/review-streak'

export type StreakCelebration = {
  /** 오늘까지 이어진 연속 일수 */
  days: number
  /** 이번 주(월~일) 현황 — 7칸 */
  week: StreakWeekCell[]
}

/**
 * 마지막으로 축하를 띄운 KST 날짜.
 *
 * **메모리가 아니라 localStorage여야 한다** — 완료 화면에서 새로고침하고 다시 과제를 풀면
 * 같은 날 또 뜬다. 서버에 둘 만한 값은 아니다(기기별로 한 번 보여주면 충분하고,
 * 이것 때문에 컬럼을 추가할 이유가 없다).
 */
const LAST_CELEBRATED_KEY = 'loopin-streak-celebrated-day'

function loadLastCelebratedDay(): number | null {
  try {
    const raw = window.localStorage.getItem(LAST_CELEBRATED_KEY)
    if (!raw) return null
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    // 사파리 프라이빗 등 storage 차단 — 축하를 막을 이유는 아니다
    return null
  }
}

function saveLastCelebratedDay(day: number): void {
  try {
    window.localStorage.setItem(LAST_CELEBRATED_KEY, String(day))
  } catch {
    /* 저장 실패해도 이번 축하는 그대로 진행한다 */
  }
}

/**
 * 지금 축하를 띄워야 하는지 판단하고, 띄운다면 화면에 필요한 값을 만들어 준다.
 * 띄우기로 한 순간 「오늘 띄움」을 기록하므로 **호출 즉시 화면을 띄울 때만 부른다.**
 *
 * 1일차부터 축하한다 — 상단 알약은 어색해서 2일부터 보여주지만
 * (`MIN_STREAK_DAYS_TO_SHOW`), 스트릭이 **시작되는** 순간이 이어가게 만드는 순간이다.
 */
export async function resolveStreakCelebration(): Promise<StreakCelebration | null> {
  if (!isSyncEnabled()) return null

  const today = kstDayNumber(Date.now())
  if (loadLastCelebratedDay() === today) return null

  const timestamps = await fetchStudyTimestamps()
  const streak = computeStudyStreak(timestamps)
  // 오늘 기록이 없으면 축하할 게 없다 (조회 실패로 빈 배열이 와도 여기서 걸린다)
  if (!streak.includesToday || streak.days < 1) return null

  saveLastCelebratedDay(today)
  return { days: streak.days, week: buildStreakWeek(timestamps) }
}

/**
 * 별 배지가 날아와 앉기까지(ms). `index.css`의 `streak-badge-fly-in` 길이와 같아야 한다.
 * 뒤따르는 연출(글로우·주간 띠·색종이)이 전부 이 시각을 기준으로 줄 서 있다.
 */
export const STREAK_BADGE_LAND_MS = 900

/** 별 안 숫자가 어제 값 → 오늘 값으로 바뀌는 시각(ms). 착지하고 한 박자 뒤. */
export const STREAK_NUMBER_CHANGE_MS = STREAK_BADGE_LAND_MS + 260

/**
 * 이 시간 전에는 탭이 안 먹는다(ms) — 숫자가 바뀌는 것까지는 보고 넘어가게.
 * 완료 화면 CTA 연타가 관통해 축하가 즉시 사라지는 것도 같이 막는다.
 */
export const STREAK_TAP_BLOCK_MS = STREAK_NUMBER_CHANGE_MS + 500
