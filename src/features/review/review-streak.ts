/**
 * 「N일 연속 학습 중」 스트릭.
 *
 * **복습 스트릭이 아니라 학습 스트릭이다.** 복습 세션(2단계)이 아직 없어서 「복습한 날」이라는
 * 기록 자체가 존재하지 않는다. 지금 셀 수 있는 건 학생이 과제를 푼 날뿐이다.
 * 그래서 화면 문구도 「연속 복습」이 아니라 **「연속 학습」**으로 쓴다. 복습을 한 번도 안 한
 * 학생에게 "5일 연속 복습 중"을 띄우면 거짓말이 된다.
 *
 * `review_sessions`가 생기면 여기에 복습 기록 시각을 같이 넘겨 진짜 복습 스트릭으로 승격시킨다.
 */

/**
 * 날짜 경계는 **기기 시간대가 아니라 KST 고정**이다.
 * 서버 시각은 UTC라 밤 11시에 푼 것을 UTC 날짜로 묶으면 전날로 밀려 스트릭이 하루씩 어긋난다.
 * 기기 시간대를 쓰면 시계가 틀어진 기기에서 스트릭이 흔들리므로 한국 기준으로 못박는다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 조회 범위(일). 연속 일수는 최근 며칠만 보면 되므로 전체 기록을 긁을 이유가 없다 —
 * 메인 화면은 앱을 켜면 바로 뜨는 화면이라 조회 비용이 곧 체감 속도다.
 * 60일이면 현실적인 스트릭 길이를 다 담는다.
 */
export const STREAK_LOOKBACK_DAYS = 60

/** 「1일 연속」은 어색해서 2일부터 보여준다 */
export const MIN_STREAK_DAYS_TO_SHOW = 2

export type StudyStreak = {
  /** 연속 일수. 0이면 끊긴 상태 */
  days: number
  /** 오늘(KST) 학습 기록이 있는지 — 없으면 "오늘도 이어가요"를 붙인다 */
  includesToday: boolean
}

export const EMPTY_STUDY_STREAK: StudyStreak = { days: 0, includesToday: false }

/** KST 자정 기준 일련번호. 연속 판정이 뺄셈 한 번이 되도록 문자열이 아니라 정수로 다룬다. */
export function kstDayNumber(time: number): number {
  return Math.floor((time + KST_OFFSET_MS) / DAY_MS)
}

/**
 * 일련번호 → 월요일 시작 요일 인덱스(월 0 … 일 6).
 * 일련번호 0 = 1970-01-01 KST = **목요일**이라 +3을 더해 맞춘다.
 */
function mondayIndex(dayNumber: number): number {
  return (((dayNumber % 7) + 7) % 7 + 3) % 7
}

export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const

export type StreakWeekCell = {
  label: string
  /** 그날 학습 기록이 있는지 */
  studied: boolean
  isToday: boolean
  /** 아직 오지 않은 날 — 「안 함」이 아니라 「모름」이라 다르게 그린다 */
  isFuture: boolean
}

/**
 * 이번 주(월~일) 학습 현황. 축하 화면의 7칸 띠에 쓴다.
 *
 * 연속 일수와 **다른 것을 본다** — 연속은 주 경계를 넘어 이어지지만 이 띠는 이번 주만 보여준다.
 * 그래서 「3일 연속」인데 이번 주엔 2칸만 찍혀 있을 수 있다(월요일에 걸친 경우). 버그가 아니다.
 */
export function buildStreakWeek(
  timestamps: string[],
  now: Date = new Date(),
): StreakWeekCell[] {
  const studiedDays = new Set<number>()
  for (const timestamp of timestamps) {
    const time = Date.parse(timestamp)
    if (Number.isNaN(time)) continue
    studiedDays.add(kstDayNumber(time))
  }

  const today = kstDayNumber(now.getTime())
  const weekStart = today - mondayIndex(today)

  return WEEKDAY_LABELS.map((label, index) => {
    const day = weekStart + index
    return {
      label,
      studied: studiedDays.has(day),
      isToday: day === today,
      isFuture: day > today,
    }
  })
}

/**
 * 연속 학습 일수를 센다.
 *
 * 오늘 아직 안 풀었어도 **어제까지 이어졌으면 살아 있는 것으로 본다** — 하루가 시작되자마자
 * 스트릭이 0으로 떨어지면 "오늘도 이어가요"라고 말할 대상이 사라진다. 이틀이 비면 끊긴다.
 *
 * @param timestamps 학습한 시각들(ISO 8601). 같은 날이 여러 번 들어와도 된다.
 */
export function computeStudyStreak(
  timestamps: string[],
  now: Date = new Date(),
): StudyStreak {
  const studiedDays = new Set<number>()
  for (const timestamp of timestamps) {
    const time = Date.parse(timestamp)
    if (Number.isNaN(time)) continue
    studiedDays.add(kstDayNumber(time))
  }

  const today = kstDayNumber(now.getTime())
  const includesToday = studiedDays.has(today)

  let cursor: number
  if (includesToday) cursor = today
  else if (studiedDays.has(today - 1)) cursor = today - 1
  else return EMPTY_STUDY_STREAK

  let days = 0
  while (studiedDays.has(cursor)) {
    days += 1
    cursor -= 1
  }

  return { days, includesToday }
}
