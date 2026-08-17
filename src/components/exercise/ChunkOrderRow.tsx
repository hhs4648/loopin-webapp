import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import {
  CHUNK_DRAG_MOVE_PX,
  CHUNK_LONG_PRESS_MS,
  resolveInsertAmongRemaining,
  type ChunkDragGhost,
} from './chunk-pointer-drag'

export type ChunkOrderItem = {
  id: string
  label: string
  markedWrong?: boolean
}

type ChunkOrderRowProps = {
  items: ChunkOrderItem[]
  disabled?: boolean
  /** 짧은 탭(드래그 아님) — 기존처럼 해당 인덱스까지 제거 등 */
  onTap?: (index: number) => void
  /** from 제거 후 insertAmongRemaining 위치에 삽입 */
  onReorder: (fromIndex: number, insertAmongRemaining: number) => void
  renderLabel?: (item: ChunkOrderItem) => ReactNode
  chipClassName?: (item: ChunkOrderItem, state: { dragging: boolean }) => string
  labelClassName?: string
}

type DragSession = {
  fromIndex: number
  label: string
  width: number
  height: number
  offsetX: number
  offsetY: number
  pointerId: number
  started: boolean
  originX: number
  originY: number
  cleanupListeners: (() => void) | null
}

/**
 * 문장 박스 안 청크 줄 — 꾹 누르면 고스트가 포인터를 따라가고,
 * 칩 크기 자리에 파란 임팩트가 보이며 그 사이로 삽입된다.
 */
export function ChunkOrderRow({
  items,
  disabled = false,
  onTap,
  onReorder,
  renderLabel,
  chipClassName,
  labelClassName,
}: ChunkOrderRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragSession | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const onReorderRef = useRef(onReorder)
  const onTapRef = useRef(onTap)
  onReorderRef.current = onReorder
  onTapRef.current = onTap

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [insertSlot, setInsertSlot] = useState<number | null>(null)
  const [ghost, setGhost] = useState<ChunkDragGhost | null>(null)

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const endDrag = () => {
    clearLongPress()
    const session = dragRef.current
    session?.cleanupListeners?.()
    dragRef.current = null
    setDraggingIndex(null)
    setInsertSlot(null)
    setGhost(null)
  }

  useEffect(() => () => {
    clearLongPress()
    dragRef.current?.cleanupListeners?.()
  }, [])

  const beginDragVisual = (session: DragSession, clientX: number, clientY: number) => {
    if (session.started) return
    session.started = true
    setDraggingIndex(session.fromIndex)
    setGhost({
      label: session.label,
      width: session.width,
      height: session.height,
      x: clientX - session.offsetX,
      y: clientY - session.offsetY,
    })
    if (rowRef.current) {
      setInsertSlot(
        resolveInsertAmongRemaining(
          rowRef.current,
          clientX,
          clientY,
          session.fromIndex,
        ),
      )
    }
  }

  const updateDrag = (clientX: number, clientY: number) => {
    const session = dragRef.current
    if (!session) return

    if (!session.started) {
      const dx = clientX - session.originX
      const dy = clientY - session.originY
      if (dx * dx + dy * dy >= CHUNK_DRAG_MOVE_PX * CHUNK_DRAG_MOVE_PX) {
        clearLongPress()
        beginDragVisual(session, clientX, clientY)
      } else {
        return
      }
    }

    setGhost({
      label: session.label,
      width: session.width,
      height: session.height,
      x: clientX - session.offsetX,
      y: clientY - session.offsetY,
    })

    if (rowRef.current) {
      setInsertSlot(
        resolveInsertAmongRemaining(
          rowRef.current,
          clientX,
          clientY,
          session.fromIndex,
        ),
      )
    }
  }

  const finishPointer = (clientX: number, clientY: number, pointerId: number) => {
    const session = dragRef.current
    if (!session || session.pointerId !== pointerId) return

    const wasDragging = session.started
    const fromIndex = session.fromIndex

    if (wasDragging && rowRef.current) {
      const slot = resolveInsertAmongRemaining(
        rowRef.current,
        clientX,
        clientY,
        fromIndex,
      )
      onReorderRef.current(fromIndex, slot)
    }

    endDrag()

    if (!wasDragging) {
      onTapRef.current?.(fromIndex)
    }
  }

  const attachWindowListeners = (session: DragSession) => {
    session.cleanupListeners?.()

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== session.pointerId) return
      event.preventDefault()
      updateDrag(event.clientX, event.clientY)
    }

    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== session.pointerId) return
      finishPointer(event.clientX, event.clientY, event.pointerId)
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    session.cleanupListeners = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      session.cleanupListeners = null
    }
  }

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
    item: ChunkOrderItem,
  ) => {
    if (disabled || event.button !== 0) return

    const target = event.currentTarget
    const rect = target.getBoundingClientRect()

    const session: DragSession = {
      fromIndex: index,
      label: item.label,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
      started: false,
      originX: event.clientX,
      originY: event.clientY,
      cleanupListeners: null,
    }
    dragRef.current = session
    attachWindowListeners(session)

    try {
      target.setPointerCapture(event.pointerId)
    } catch {
      /* ignore — window listeners가 대체 */
    }

    clearLongPress()
    longPressTimer.current = window.setTimeout(() => {
      const current = dragRef.current
      if (!current || current.pointerId !== session.pointerId) return
      beginDragVisual(current, current.originX, current.originY)
    }, CHUNK_LONG_PRESS_MS)
  }

  const defaultChipClass = (item: ChunkOrderItem, dragging: boolean) => {
    const border = item.markedWrong ? 'border-[#FF8AC8]' : 'border-[#3C86FF]'
    return `touch-none select-none whitespace-nowrap rounded-lg border bg-white px-2 py-1 shadow-[0_1px_4px_rgba(60,134,255,0.1)] ${
      dragging ? `cursor-grabbing ${border}` : `cursor-grab ${border}`
    }`
  }

  /**
   * 드래그 중: 원본 칩은 빼고, insertSlot에 칩 크기 플레이스홀더.
   * (원본을 DOM에서 제거해도 window 리스너로 포인터 유지)
   */
  const visualSlots: Array<
    | { kind: 'item'; item: ChunkOrderItem; index: number }
    | { kind: 'gap'; width: number; height: number }
  > = []

  if (draggingIndex === null || insertSlot === null || !ghost) {
    items.forEach((item, index) => {
      visualSlots.push({ kind: 'item', item, index })
    })
  } else {
    const remaining = items
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.index !== draggingIndex)
    remaining.forEach((entry, i) => {
      if (i === insertSlot) {
        visualSlots.push({
          kind: 'gap',
          width: ghost.width,
          height: ghost.height,
        })
      }
      visualSlots.push({ kind: 'item', item: entry.item, index: entry.index })
    })
    if (insertSlot >= remaining.length) {
      visualSlots.push({
        kind: 'gap',
        width: ghost.width,
        height: ghost.height,
      })
    }
  }

  return (
    <>
      <div
        ref={rowRef}
        data-chunk-order-row
        className="flex w-full flex-wrap items-center justify-center gap-1.5"
      >
        {visualSlots.map((slot, visualIndex) => {
          if (slot.kind === 'gap') {
            return (
              <div
                key={`gap-${visualIndex}`}
                aria-hidden
                className="shrink-0 rounded-lg border-2 border-dashed border-[#3C86FF] bg-[#3C86FF]/18 shadow-[0_0_0_4px_rgba(60,134,255,0.12)] transition-[width,height,background] duration-100"
                style={{
                  width: slot.width,
                  height: slot.height,
                  boxSizing: 'border-box',
                }}
              />
            )
          }

          const { item, index } = slot
          const dragging = draggingIndex === index
          return (
            <button
              key={`placed-${item.id}`}
              type="button"
              data-chunk-index={index}
              aria-label={`${index + 1}번째 조각 ${item.label}`}
              className={
                chipClassName?.(item, { dragging }) ??
                defaultChipClass(item, dragging)
              }
              onPointerDown={(event) => handlePointerDown(event, index, item)}
            >
              {renderLabel ? (
                renderLabel(item)
              ) : (
                <span className={labelClassName}>{item.label}</span>
              )}
            </button>
          )
        })}
      </div>

      {ghost ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[200] origin-center whitespace-nowrap rounded-lg border-2 border-[#3C86FF] bg-white px-2 py-1 shadow-[0_12px_28px_rgba(60,134,255,0.38)]"
          style={{
            left: ghost.x,
            top: ghost.y,
            width: ghost.width,
            minHeight: ghost.height,
            boxSizing: 'border-box',
            transform: 'scale(1.06) rotate(-1.5deg)',
          }}
        >
          <span className={labelClassName}>{ghost.label}</span>
        </div>
      ) : null}
    </>
  )
}
