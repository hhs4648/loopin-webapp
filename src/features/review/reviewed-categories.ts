/**
 * 복습에서 **100점**으로 끝낸 분류를 잠시 목록에서 뺀다.
 *
 * 서버 `review_sessions`가 생기기 전이라 localStorage에 둔다.
 * `summarizeReviewTypes(..., reviewedAt)`가 이 시각 이후로 과제에서 새로 틀린 게
 * 없으면 해당 분류를 감춘다 — 다시 틀리면 목록에 되살아난다.
 */

const STORAGE_KEY = 'loopin-review-cleared-at'

/** classId → (categoryKey → ISO 완료 시각) */
type ReviewedStore = Record<string, Record<string, string>>

function readStore(): ReviewedStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: ReviewedStore = {}
    for (const [classId, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue
      const bucket: Record<string, string> = {}
      for (const [key, at] of Object.entries(value as Record<string, unknown>)) {
        if (typeof at === 'string' && at.length > 0) bucket[key] = at
      }
      out[classId] = bucket
    }
    return out
  } catch {
    return {}
  }
}

function writeStore(store: ReviewedStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // quota 등은 조용히 무시 — 목록이 안 줄어들 뿐
  }
}

/** 해당 반에서 100점으로 클리어한 분류 → 완료 시각 */
export function loadReviewedAt(classId: string): Record<string, string> {
  if (!classId) return {}
  return { ...(readStore()[classId] ?? {}) }
}

/**
 * 복습 세션을 만점으로 끝냈을 때 호출.
 * 같은 분류를 다시 만점 내면 시각만 갱신한다.
 */
export function markReviewCategoryCleared(
  classId: string,
  categoryKey: string,
): void {
  if (!classId || !categoryKey) return
  const store = readStore()
  const bucket = { ...(store[classId] ?? {}) }
  bucket[categoryKey] = new Date().toISOString()
  store[classId] = bucket
  writeStore(store)
}

/** 복습에서 다시 틀렸을 때 — 만점 감추기를 풀어 목록에 되돌린다 */
export function clearReviewCategoryCleared(
  classId: string,
  categoryKey: string,
): void {
  if (!classId || !categoryKey) return
  const store = readStore()
  const bucket = store[classId]
  if (!bucket || !(categoryKey in bucket)) return
  const next = { ...bucket }
  delete next[categoryKey]
  if (Object.keys(next).length === 0) delete store[classId]
  else store[classId] = next
  writeStore(store)
}
