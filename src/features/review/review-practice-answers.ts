/**
 * 복습 연습 세션 답안 — 서버 `review_answers`가 생기기 전 localStorage 우회.
 *
 * 복습은 practiceOnly라 서버 `answers`에 안 남는다. 그래도 카드를 최신 오답률로
 * 다시 배치하려면 연습 결과를 집계에 합쳐야 한다. `summarizeReviewTypes`는
 * 문항별 **가장 최근** 답안만 쓰므로, 여기 시각이 과제 답안보다 새면 복습 결과가 이긴다.
 */

import type { ContentSnapshot } from '../../lib/sync/types'
import type { ReviewAnswerInput } from './review-stats'
import { resolveReviewCategory } from './review-types'

const STORAGE_KEY = 'haksup-review-practice-answers'

type PracticeEntry = {
  isCorrect: boolean
  createdAt: string
}

/** classId → (questionId → 최근 연습 결과) */
type PracticeStore = Record<string, Record<string, PracticeEntry>>

function readStore(): PracticeStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: PracticeStore = {}
    for (const [classId, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue
      const bucket: Record<string, PracticeEntry> = {}
      for (const [questionId, entry] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
        const row = entry as Partial<PracticeEntry>
        if (typeof row.isCorrect !== 'boolean') continue
        if (typeof row.createdAt !== 'string' || !row.createdAt) continue
        bucket[questionId] = {
          isCorrect: row.isCorrect,
          createdAt: row.createdAt,
        }
      }
      out[classId] = bucket
    }
    return out
  } catch {
    return {}
  }
}

function writeStore(store: PracticeStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // quota 등은 조용히 무시
  }
}

/**
 * 한 복습 세션의 결과를 문항별로 덮어쓴다.
 * `wrongQuestionIds`에 없는 문항은 이번 세션에서 맞힌 것으로 본다.
 */
export function recordReviewPracticeSession(
  classId: string,
  answeredQuestionIds: readonly string[],
  wrongQuestionIds: readonly string[],
): void {
  if (!classId || answeredQuestionIds.length === 0) return
  const wrong = new Set(wrongQuestionIds)
  const now = new Date().toISOString()
  const store = readStore()
  const bucket = { ...(store[classId] ?? {}) }
  for (const questionId of answeredQuestionIds) {
    if (!questionId) continue
    bucket[questionId] = {
      isCorrect: !wrong.has(questionId),
      createdAt: now,
    }
  }
  store[classId] = bucket
  writeStore(store)
}

function findSnapshotForQuestion(
  questionId: string,
  snapshots: ContentSnapshot[],
): ContentSnapshot | null {
  for (const snapshot of snapshots) {
    if (resolveReviewCategory(questionId, snapshot)) return snapshot
  }
  return null
}

/**
 * 저장된 연습 답안을 `summarizeReviewTypes`에 넘길 형태로 만든다.
 * 스냅샷에서 분류를 못 찾는 문항은 뺀다.
 */
export function loadReviewPracticeAnswers(
  classId: string,
  snapshots: ContentSnapshot[],
): ReviewAnswerInput[] {
  if (!classId) return []
  const bucket = readStore()[classId]
  if (!bucket) return []

  const out: ReviewAnswerInput[] = []
  for (const [questionId, entry] of Object.entries(bucket)) {
    const snapshot = findSnapshotForQuestion(questionId, snapshots)
    if (!snapshot) continue
    out.push({
      questionId,
      isCorrect: entry.isCorrect,
      createdAt: entry.createdAt,
      snapshot,
    })
  }
  return out
}
