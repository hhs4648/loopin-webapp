export const FRAME_W = 393
export const FRAME_H = 852

export const WORD_MATCH_ASSETS = {
  base: '/assets/word-a-start.svg?v=2',
} as const

export const FEEDBACK_MS = 500

/** Figma — 1회차 빨간 성 (assigned star 1) */
export const STAR_1_CASTLE_HIT = { x: 155, y: 275, w: 100, h: 125 }

export type WordPairId = string

export type WordMatchPair = {
  id: WordPairId
  english: string
  korean: string
}

export type WordTile = {
  id: string
  pairId: WordPairId
  label: string
  side: 'en' | 'ko'
  x: number
  y: number
  w: number
  h: number
}

const TILE_W = 168
const TILE_H = 98
const EN_X = 21
const KO_X = 205
const ROW_Y = [214, 328, 442, 556] as const

export const PAGE_SIZE = 4

/** `fillMatchPage`가 붙인 채움 짝 id (`{base}:fill:{pageKey}:{n}`) */
export function isFillPairId(id: string): boolean {
  return id.includes(':fill:')
}

/** SVG에 구워진 데모 타일을 가리기 위한 8칸 커버 좌표 */
export const WORD_MATCH_TILE_COVERS = ROW_Y.flatMap((y, row) => [
  { id: `cover-en-${row}`, x: EN_X, y, w: TILE_W, h: TILE_H },
  { id: `cover-ko-${row}`, x: KO_X, y, w: TILE_W, h: TILE_H },
])

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j]!, next[i]!]
  }
  return next
}

/**
 * Build EN (left) + KO (right) tiles for up to 4 pairs.
 * 양쪽 열을 각각 독립적으로 섞어, 페이지/재풀이마다 배열이 달라진다.
 */
export function buildTilesFromPairs(pairs: WordMatchPair[]): WordTile[] {
  const limited = pairs.slice(0, ROW_Y.length)
  const english = shuffle(limited).map((pair, index) => ({
    id: `${pair.id}:en`,
    pairId: pair.id,
    label: pair.english,
    side: 'en' as const,
    x: EN_X,
    y: ROW_Y[index]!,
    w: TILE_W,
    h: TILE_H,
  }))

  const korean = shuffle(limited).map((pair, index) => ({
    id: `${pair.id}:ko`,
    pairId: pair.id,
    label: pair.korean,
    side: 'ko' as const,
    x: KO_X,
    y: ROW_Y[index]!,
    w: TILE_W,
    h: TILE_H,
  }))

  return [...english, ...korean]
}

/**
 * 페이지가 4짝보다 적으면 `fillPool`(출제된 단어)에서 랜덤으로 채운다.
 * 이미 페이지에 있는 id는 우선 피하고, 풀이 4개 미만이면 중복 허용(fill 전용 id).
 * 데모(wave/latest/various/run errands) 단어는 쓰지 않는다.
 */
export function fillMatchPage(
  page: WordMatchPair[],
  fillPool: WordMatchPair[],
  pageKey: string | number,
  excludeIds?: Set<string>,
): WordMatchPair[] {
  if (page.length >= PAGE_SIZE || fillPool.length === 0) return page.slice(0, PAGE_SIZE)

  const usedIds = new Set(page.map((pair) => pair.id))
  const filled = [...page]
  let fillCount = 0

  const baseId = (id: string) => id.replace(/:fill:.*$/, '')

  while (filled.length < PAGE_SIZE) {
    const unusedPool = fillPool.filter((pair) => {
      if (usedIds.has(pair.id)) return false
      if (excludeIds?.has(pair.id)) return false
      if (excludeIds?.has(baseId(pair.id))) return false
      return true
    })
    const pool =
      unusedPool.length > 0
        ? unusedPool
        : fillPool.filter(
            (pair) => !excludeIds?.has(pair.id) && !excludeIds?.has(baseId(pair.id)),
          )
    const fallback = pool.length > 0 ? pool : fillPool
    const pick = fallback[Math.floor(Math.random() * fallback.length)]!
    const fillId = `${baseId(pick.id)}:fill:${pageKey}:${fillCount}`
    filled.push({ ...pick, id: fillId })
    usedIds.add(pick.id)
    usedIds.add(fillId)
    fillCount += 1
  }

  return filled
}

/**
 * 다음 4쌍 페이지를 뽑는다.
 * 1) 틀렸던 짝(wrongPairIds)을 우선 채우고
 * 2) 부족하면 아직 정답 처리 안 된 짝(remaining) 중 랜덤으로 채운다.
 * 3) 한 페이지 안에서 중복 없음.
 * 4) 그래도 4짝 미만이면 fillPool(기본=allPairs)에서 출제 단어로 채운다.
 */
export function pickNextPage(
  allPairs: WordMatchPair[],
  completedPairIds: Set<string>,
  wrongPairIds: Set<string>,
  fillPool: WordMatchPair[] = allPairs,
  pageKey: string | number = 0,
): WordMatchPair[] {
  const wrongPool = allPairs.filter(
    (p) => wrongPairIds.has(p.id) && !completedPairIds.has(p.id),
  )
  const normalPool = allPairs.filter(
    (p) => !wrongPairIds.has(p.id) && !completedPairIds.has(p.id),
  )

  const page: WordMatchPair[] = []
  const usedIds = new Set<string>()

  for (const p of shuffle(wrongPool)) {
    if (page.length >= PAGE_SIZE) break
    if (!usedIds.has(p.id)) {
      page.push(p)
      usedIds.add(p.id)
    }
  }

  for (const p of shuffle(normalPool)) {
    if (page.length >= PAGE_SIZE) break
    if (!usedIds.has(p.id)) {
      page.push(p)
      usedIds.add(p.id)
    }
  }

  if (page.length === 0) return []

  return fillMatchPage(page, fillPool, pageKey, completedPairIds)
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

export function isMatchingPair(a: WordTile, b: WordTile) {
  return a.pairId === b.pairId && a.side !== b.side
}
