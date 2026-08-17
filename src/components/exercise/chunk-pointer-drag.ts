/** 본문 A/B 청크 — 포인터로 꾹 잡아 따라다니며 사이 삽입 */

export const CHUNK_DRAG_MOVE_PX = 8
export const CHUNK_LONG_PRESS_MS = 160

export type ChunkDragGhost = {
  label: string
  width: number
  height: number
  x: number
  y: number
}

export type ChunkDropHint = {
  slot: number
  x: number
  y: number
  width: number
  height: number
}

function sortedChunkNodes(
  container: HTMLElement,
  excludeIndex: number | null,
): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-chunk-index]')]
    .filter((el) => {
      if (excludeIndex === null) return true
      return Number(el.dataset.chunkIndex) !== excludeIndex
    })
    .sort((a, b) => {
      const ra = a.getBoundingClientRect()
      const rb = b.getBoundingClientRect()
      if (Math.abs(ra.top - rb.top) > 10) return ra.top - rb.top
      return ra.left - rb.left
    })
}

/** flex-wrap 컨테이너에서 드래그 제외 후 삽입 슬롯 (0…remainingCount) */
export function resolveInsertAmongRemaining(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  excludeIndex: number | null,
): number {
  const nodes = sortedChunkNodes(container, excludeIndex)

  if (nodes.length === 0) return 0

  for (let i = 0; i < nodes.length; i += 1) {
    const rect = nodes[i]!.getBoundingClientRect()
    if (clientY < rect.top - 12) return i
    if (clientY > rect.bottom + 12) continue
    if (clientX < rect.left + rect.width / 2) return i
  }

  return nodes.length
}

/**
 * 은행 타일 드래그용 — 문장 박스 위에 띄울 드롭 힌트 사각형(뷰포트 좌표).
 * 행 안 레이아웃은 ChunkOrderRow가 in-flow 플레이스홀더로 담당.
 */
export function resolveDropHintRect(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  excludeIndex: number | null,
  width: number,
  height: number,
): ChunkDropHint {
  const slot = resolveInsertAmongRemaining(
    container,
    clientX,
    clientY,
    excludeIndex,
  )
  const nodes = sortedChunkNodes(container, excludeIndex)
  const gap = 6

  if (nodes.length === 0) {
    const box = container.getBoundingClientRect()
    return {
      slot: 0,
      x: box.left + (box.width - width) / 2,
      y: box.top + (box.height - height) / 2,
      width,
      height,
    }
  }

  if (slot < nodes.length) {
    const rect = nodes[slot]!.getBoundingClientRect()
    const box = container.getBoundingClientRect()
    const rawX = rect.left - width - gap
    return {
      slot,
      x: Math.max(box.left + 4, rawX),
      y: rect.top + (rect.height - height) / 2,
      width,
      height,
    }
  }

  const last = nodes[nodes.length - 1]!.getBoundingClientRect()
  return {
    slot,
    x: last.right + gap,
    y: last.top + (last.height - height) / 2,
    width,
    height,
  }
}
