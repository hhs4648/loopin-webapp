/**
 * 분류별 정답률 집계 — 복습 탭의 「오늘의 맞춤 복습」과 아래 목록을 만든다.
 *
 * 집계 기준:
 * - 기간 제한 없이 **전체 기록**을 본다.
 * - 같은 문항을 여러 번 풀었으면 **가장 최근 답안만** 센다. 다시 맞히면 오답 풀에서 빠진다.
 * - 표본이 **3문항 미만**인 분류는 목록에 올리지 않는다 (1문제 틀리고 오답률 100%가 되는 것 방지).
 * - 오답이 하나도 없는 분류는 올리지 않는다.
 * - 단원별·문법 목록은 각각 **오답률 높은 순 최대 2개**.
 *
 * **복습 세션은 오답만 다시 푸는 게 아니라 그 분류의 문제를 전부 푼다.** 그래서 카드의
 * 「복습 문제」·「예상 시간」은 오답 수가 아니라 분류 전체 문항 수(`questionTotal`)로 낸다.
 * 오답 수는 얼마나 약한지를 보여주는 지표(`wrongPercent`)로만 쓴다.
 */

import {
  buildAssignmentSections,
  listSectionQuestionIds,
} from '../assignments/build-session-sections'
import type { ContentSnapshot } from '../../lib/sync/types'
import {
  buildReviewLabels,
  parseQuestionId,
  resolveReviewCategory,
  reviewCategoryKey,
  type QuestionTypeSuffix,
  type ReviewCategory,
} from './review-types'

/** 분류가 목록에 오르기 위한 최소 응시 문항 수 */
export const MIN_ANSWERED_FOR_REVIEW = 3

/** 단원별·문법 구역에 올릴 최대 개수 (오답률 상위) */
export const MAX_UNIT_REVIEW_TYPES = 2
export const MAX_GRAMMAR_REVIEW_TYPES = 2

/** 시안의 「목표 정확도」 — 아직 학생별로 정할 근거가 없어 고정값이다 */
export const TARGET_ACCURACY_PERCENT = 80

/**
 * 문항 형식별 예상 소요 시간(초).
 *
 * **측정값이 아니라 추정치다** — 실제 응답 시간을 저장하고 있지 않다.
 * 그래도 형식 무관 고정값보다는 낫다: 짝맞추기 50문항과 영작 50문항을 같은 시간으로 표시하면
 * 몇 배씩 틀린다. 응답 시간을 기록하게 되면 이 표를 실측으로 갈아끼운다.
 */
const SECONDS_BY_SUFFIX: Record<QuestionTypeSuffix, number> = {
  ':match': 8,
  ':choice': 8,
  ':listen': 10,
  ':spell': 20,
  ':chunk': 20,
  ':translate': 25,
  ':write': 40,
  ':ox': 10,
  ':ox:fix': 20,
}

/** 접미사를 못 읽은 문항 — 집계에선 빠지지만 방어적으로 둔다 */
const DEFAULT_QUESTION_SECONDS = 20

/**
 * 추천 카드를 고를 때 분모에 더하는 상수.
 *
 * 단순 오답률로 고르면 8문항짜리 문법 개념이 3개만 틀려도 37%가 나와서 50문항짜리 단원(42%)을
 * 이겨버린다. 분모를 부풀려 표본이 작은 분류를 0쪽으로 끌어당긴다.
 * 10은 실측 근거가 있는 값이 아니라 조정값이다.
 */
const RECOMMEND_PRIOR = 10

/** 복습 집계에 들어가는 답안 한 건. 과제 스냅샷과 짝지어 넘긴다. */
export type ReviewAnswerInput = {
  questionId: string
  isCorrect: boolean | null
  /** ISO 8601. 같은 문항의 최신 답안을 고르는 데 쓴다 */
  createdAt: string
  snapshot: ContentSnapshot
}

export type ReviewTypeStat = {
  /** `reviewCategoryKey`가 만든 집계 키 */
  key: string
  category: ReviewCategory
  /** 화면 표시용. 같은 라벨이 둘 이상일 때만 교재명이 붙는다 */
  label: string
  /** 이 분류에서 푼 문항 수 (문항 단위, 응시 횟수 아님) */
  answeredCount: number
  wrongCount: number
  /** 0–100 정수 */
  accuracyPercent: number
  /** 0–100 정수. `100 - accuracyPercent` */
  wrongPercent: number
  /** 복습 세션에서 풀게 될 문항 수 — 오답만이 아니라 이 분류 전체 */
  questionTotal: number
  /** 복습해야 할 문항 id — 가장 최근 답안이 오답인 것들. 우선순위·통계용 */
  wrongQuestionIds: string[]
  /** `questionTotal` 기준 예상 소요 시간(분). 최소 1분 */
  estimatedMinutes: number
}

export type ReviewSummary = {
  /** 「오늘의 맞춤 복습」 카드 — 표본 크기를 감안해 고른 1개. 아래 목록에도 그대로 남는다 */
  recommended: ReviewTypeStat | null
  /** 단원별 — 단원 번호 순, 같은 단원은 단어 → 문장 */
  unitStats: ReviewTypeStat[]
  /** 문법 개념별 — 오답률 높은 순 */
  grammarStats: ReviewTypeStat[]
}

type LatestAnswer = {
  category: ReviewCategory
  isCorrect: boolean
  createdAt: string
}

type Pool = { questionTotal: number; seconds: number }

function questionSeconds(questionId: string): number {
  const { suffix } = parseQuestionId(questionId)
  return suffix ? SECONDS_BY_SUFFIX[suffix] : DEFAULT_QUESTION_SECONDS
}

/**
 * 분류별 **전체 문항 수와 예상 시간**을 낸다.
 *
 * 답안이 아니라 스냅샷에서 센다 — 복습은 틀린 문항만이 아니라 분류 전체를 풀기 때문에,
 * 아직 한 번도 안 푼 문항도 세야 한다. 스냅샷은 답안이 물고 온 것들(= 학생이 받은 과제)만 본다.
 *
 * 같은 문항 id가 여러 과제에 겹쳐 나오면 한 번만 센다 — 답안 쪽도 id로 합치기 때문에
 * (`latestByQuestion`) 그래야 `answeredCount ≤ questionTotal`이 유지된다.
 */
function collectPools(
  answers: ReviewAnswerInput[],
  classSnapshots: ContentSnapshot[] = [],
): Map<string, Pool> {
  const snapshots = new Set<ContentSnapshot>()
  for (const snapshot of classSnapshots) snapshots.add(snapshot)
  for (const answer of answers) snapshots.add(answer.snapshot)

  const pools = new Map<string, Pool>()
  const counted = new Set<string>()

  for (const snapshot of snapshots) {
    const questionIds = listSectionQuestionIds(buildAssignmentSections(snapshot))
    for (const questionId of questionIds) {
      if (counted.has(questionId)) continue
      const category = resolveReviewCategory(questionId, snapshot)
      if (!category) continue
      counted.add(questionId)

      const key = reviewCategoryKey(category)
      const pool = pools.get(key) ?? { questionTotal: 0, seconds: 0 }
      pool.questionTotal += 1
      pool.seconds += questionSeconds(questionId)
      pools.set(key, pool)
    }
  }

  return pools
}

/**
 * 분류별 통계를 「오늘의 추천 + 단원 목록 + 문법 목록」으로 돌려준다.
 *
 * @param answers 학생이 푼 모든 답안 (과제 스냅샷 포함)
 * @param reviewedAt 분류별 마지막 **만점** 복습 완료 시각.
 *   그 시각 이후로 과제에서 새로 틀린 게 없으면 목록에서 뺀다
 *   (`reviewed-categories.ts` · localStorage).
 */
export function summarizeReviewTypes(
  answers: ReviewAnswerInput[],
  reviewedAt: Record<string, string> = {},
  /** 반 전체 과제 스냅샷 — 있으면 문항 수·예상 시간에 반영 (아직 안 푼 문항 포함) */
  classSnapshots: ContentSnapshot[] = [],
): ReviewSummary {
  // 문항 id → 가장 최근 답안. 같은 문항을 여러 과제에서 풀었어도 하나로 본다.
  const latestByQuestion = new Map<string, LatestAnswer>()

  for (const answer of answers) {
    // is_correct가 null인 건 채점되지 않은 답안이다. 정답으로도 오답으로도 세지 않는다.
    if (answer.isCorrect == null) continue

    const category = resolveReviewCategory(answer.questionId, answer.snapshot)
    if (!category) continue

    const previous = latestByQuestion.get(answer.questionId)
    if (previous && previous.createdAt >= answer.createdAt) continue

    latestByQuestion.set(answer.questionId, {
      category,
      isCorrect: answer.isCorrect,
      createdAt: answer.createdAt,
    })
  }

  type Bucket = {
    category: ReviewCategory
    answeredCount: number
    wrongCount: number
    wrongQuestionIds: string[]
    /** 마지막으로 틀린 시각 — 복습 완료 이후 다시 틀렸는지 판정용 */
    lastWrongAt: string | null
  }
  const buckets = new Map<string, Bucket>()

  for (const [questionId, answer] of latestByQuestion) {
    const key = reviewCategoryKey(answer.category)
    const bucket = buckets.get(key) ?? {
      category: answer.category,
      answeredCount: 0,
      wrongCount: 0,
      wrongQuestionIds: [],
      lastWrongAt: null,
    }
    bucket.answeredCount += 1
    if (!answer.isCorrect) {
      bucket.wrongCount += 1
      bucket.wrongQuestionIds.push(questionId)
      if (!bucket.lastWrongAt || answer.createdAt > bucket.lastWrongAt) {
        bucket.lastWrongAt = answer.createdAt
      }
    }
    buckets.set(key, bucket)
  }

  const pools = collectPools(answers, classSnapshots)
  const kept: Bucket[] = []

  for (const [key, bucket] of buckets) {
    if (bucket.answeredCount < MIN_ANSWERED_FOR_REVIEW) continue
    if (bucket.wrongCount === 0) continue

    // 복습을 끝낸 뒤로 다시 틀린 적이 없으면 목록에서 뺀다.
    const reviewed = reviewedAt[key]
    if (reviewed && (!bucket.lastWrongAt || bucket.lastWrongAt <= reviewed)) {
      continue
    }

    kept.push(bucket)
  }

  const labels = buildReviewLabels(kept.map((bucket) => bucket.category))

  const stats: ReviewTypeStat[] = kept.map((bucket) => {
    const key = reviewCategoryKey(bucket.category)
    // 스냅샷에서 분류를 못 찾는 일은 없어야 하지만, 없으면 푼 문항만으로라도 센다.
    const pool = pools.get(key) ?? {
      questionTotal: bucket.answeredCount,
      seconds: bucket.answeredCount * DEFAULT_QUESTION_SECONDS,
    }
    const accuracyPercent = Math.round(
      ((bucket.answeredCount - bucket.wrongCount) / bucket.answeredCount) * 100,
    )

    return {
      key,
      category: bucket.category,
      label: labels.get(key) ?? key,
      answeredCount: bucket.answeredCount,
      wrongCount: bucket.wrongCount,
      accuracyPercent,
      wrongPercent: 100 - accuracyPercent,
      questionTotal: pool.questionTotal,
      wrongQuestionIds: bucket.wrongQuestionIds,
      estimatedMinutes: Math.max(1, Math.round(pool.seconds / 60)),
    }
  })

  const unitStats = stats
    .filter((stat) => stat.category.section === 'unit')
    .sort(compareByWrongRate)
    .slice(0, MAX_UNIT_REVIEW_TYPES)

  const grammarStats = stats
    .filter((stat) => stat.category.section === 'grammar')
    .sort(compareByWrongRate)
    .slice(0, MAX_GRAMMAR_REVIEW_TYPES)

  // 추천은 화면에 보이는 목록 안에서 고른다 — 목록에 없는 분류를 추천하면 어긋난다
  return {
    recommended: pickRecommended([...unitStats, ...grammarStats]),
    unitStats,
    grammarStats,
  }
}

/** 오답률 ↓ · 오답 수 ↓ · 라벨 */
function compareByWrongRate(a: ReviewTypeStat, b: ReviewTypeStat): number {
  return (
    b.wrongPercent - a.wrongPercent ||
    b.wrongCount - a.wrongCount ||
    a.label.localeCompare(b.label, 'ko')
  )
}

/**
 * 추천 1개를 고른다 — 오답률만 보면 표본이 작은 분류가 이기므로 분모를 부풀려 비교한다
 * (`RECOMMEND_PRIOR`). 동점이면 오답이 많은 쪽, 그다음 라벨 순.
 */
function pickRecommended(stats: ReviewTypeStat[]): ReviewTypeStat | null {
  let best: ReviewTypeStat | null = null
  let bestScore = -1

  for (const stat of stats) {
    const score = stat.wrongCount / (stat.answeredCount + RECOMMEND_PRIOR)
    if (
      score > bestScore ||
      (score === bestScore &&
        best != null &&
        (stat.wrongCount > best.wrongCount ||
          (stat.wrongCount === best.wrongCount &&
            stat.label.localeCompare(best.label, 'ko') < 0)))
    ) {
      best = stat
      bestScore = score
    }
  }

  return best
}

/** 오답률 구간별 막대·강조 색. 시안의 주황(높음)/초록(낮음) 두 단계를 따른다. */
export function wrongRateTone(wrongPercent: number): 'high' | 'medium' | 'low' {
  if (wrongPercent >= 50) return 'high'
  if (wrongPercent >= 25) return 'medium'
  return 'low'
}
