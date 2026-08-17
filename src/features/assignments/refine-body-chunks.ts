/**
 * 본문 A/B 청크가 너무 적을 때 세분화.
 * 한글은 공백마다 자르지 않고, 조사·보조용언은 붙인 채 긴 조각만 자연스럽게 나눈다.
 */

/** 이 개수 이하이면 세분화 시도 */
export const BODY_CHUNK_SPARSE_MAX = 5

export type RefineChunkLang = 'ko' | 'en'

/** 어절 끝 조사 — 여기까지를 한 덩어리로 두고 뒤를 나누는 후보 */
const PARTICLE_TAIL =
  /(은|는|이|가|을|를|의|에|에서|에게|한테|께|으로|로|와|과|랑|도|만|부터|까지|처럼|만큼|보다|마다)$/u

/** 앞 어절과 붙여 둘 보조용언·서술 덩어리 */
function isBoundVerbComplex(left: string, right: string): boolean {
  const l = left.replace(/[.,!?…]+$/u, '')
  const r = right.replace(/[.,!?…]+$/u, '')

  // ~아/어/여 + 보다/주다/하다 …
  if (/[아어여애에]$/u.test(l) && /^(보|봐|본|봤|주|줘|준|줬|드|하|해|했|있|없)/u.test(r)) {
    return true
  }
  // ~고 싶다 / ~고 있다 …
  if (/고$/u.test(l) && /^(싶|있|없|나|말)/u.test(r)) return true
  // ~게 되다/하다
  if (/게$/u.test(l) && /^(되|돼|됐|하|해|했)/u.test(r)) return true
  // 명사+도/만 + 하다 (공부도 했습니다)
  if (/(도|만)$/u.test(l) && /^(하|해|했|합|해요)/u.test(r)) return true
  // 싶다 계열 전체가 이어지는 경우 (싶어서 / 싶어서는)
  if (/고$/u.test(l) && /^싶어/u.test(r)) return true
  return false
}

function eojeols(seg: string): string[] {
  return seg.split(/\s+/u).map((p) => p.trim()).filter(Boolean)
}

/**
 * 한 조각을 두 덩어리로. 보조용언 경계는 피하고,
 * 조사 뒤·문장 중앙에 가까운 공백을 고른다.
 */
function splitKoreanSegmentNaturally(seg: string): [string, string] | null {
  const parts = eojeols(seg)
  if (parts.length < 2) return null

  // 목적어(을/를) + 서술어 2어절은 한 의미 덩어리로 유지
  if (
    parts.length === 2 &&
    /(을|를)$/u.test(parts[0]!.replace(/[.,!?…]+$/u, '')) &&
    !/(은|는|이|가|을|를)$/u.test(parts[1]!.replace(/[.,!?…]+$/u, ''))
  ) {
    return null
  }

  type Candidate = { at: number; score: number }
  const candidates: Candidate[] = []
  const mid = parts.length / 2

  for (let i = 0; i < parts.length - 1; i += 1) {
    if (isBoundVerbComplex(parts[i]!, parts[i + 1]!)) continue

    const left = parts[i]!
    // 조사로 끝나는 어절 뒤를 선호
    const particleBonus = PARTICLE_TAIL.test(left) ? 3 : 0
    // 가운데에 가까울수록 가산
    const centerBonus = 2 - Math.min(2, Math.abs(i + 1 - mid))
    // 양쪽이 너무 짧지 않게
    const leftLen = parts.slice(0, i + 1).join('').length
    const rightLen = parts.slice(i + 1).join('').length
    if (leftLen < 2 || rightLen < 2) continue

    candidates.push({
      at: i + 1,
      score: particleBonus + centerBonus + Math.min(leftLen, rightLen) * 0.05,
    })
  }

  if (candidates.length === 0) return null

  candidates.sort((a, b) => b.score - a.score)
  const at = candidates[0]!.at
  return [parts.slice(0, at).join(' '), parts.slice(at).join(' ')]
}

/** 한글: 긴 조각만 반복해서 자연 분할 (≤5일 때) */
function refineKoreanSparseChunks(segments: string[]): string[] {
  let current = [...segments]
  const maxIters = 10

  for (let iter = 0; iter < maxIters && current.length <= BODY_CHUNK_SPARSE_MAX; iter += 1) {
    let bestIdx = -1
    let bestScore = -1
    let bestSplit: [string, string] | null = null

    for (let i = 0; i < current.length; i += 1) {
      const parts = eojeols(current[i]!)
      if (parts.length < 2) continue
      const split = splitKoreanSegmentNaturally(current[i]!)
      if (!split) continue
      // 어절 수·길이가 큰 조각 우선
      const score = parts.length * 100 + current[i]!.length
      if (score > bestScore) {
        bestScore = score
        bestIdx = i
        bestSplit = split
      }
    }

    if (bestIdx < 0 || !bestSplit) break

    current = [
      ...current.slice(0, bestIdx),
      bestSplit[0],
      bestSplit[1],
      ...current.slice(bestIdx + 1),
    ]
  }

  return current
}

/** 영어: 공백 단어 단위로 한 번에 펼침 (기존) */
function refineEnglishSparseChunks(segments: string[]): string[] {
  const finer = segments.flatMap((seg) => eojeols(seg))
  return finer.length >= 2 ? finer : segments
}

export function refineSparseChunks(
  segments: string[],
  options?: { lang?: RefineChunkLang },
): string[] {
  const cleaned = segments.map((part) => part.trim()).filter(Boolean)
  if (cleaned.length === 0 || cleaned.length > BODY_CHUNK_SPARSE_MAX) {
    return cleaned
  }

  const lang = options?.lang ?? 'ko'
  if (lang === 'en') return refineEnglishSparseChunks(cleaned)
  return refineKoreanSparseChunks(cleaned)
}
