import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  CHUNK_DRAG_MOVE_PX,
  CHUNK_LONG_PRESS_MS,
  resolveDropHintRect,
  resolveInsertAmongRemaining,
  type ChunkDragGhost,
  type ChunkDropHint,
} from './chunk-pointer-drag'

type ChunkBankTileProps = {
  label: string
  ariaLabel: string
  disabled?: boolean
  className?: string
  labelClassName?: string
  children?: ReactNode
  /** 짧은 탭 — 기존처럼 맨 뒤에 추가 */
  onTap: () => void
  /**
   * 문장 박스 루트. 그 안 `[data-chunk-order-row]`에 사이 삽입.
   * 행이 없으면(빈 박스) 0번 삽입.
   */
  dropRootRef: RefObject<HTMLElement | null>
  onDropAt: (insertIndex: number) => void
}

type DragSession = {
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

/** 하단 청크 — 꾹 끌어 문장 박스 사이/빈 칸에 꽂기 */
export function ChunkBankTile({
  label,
  ariaLabel,
  disabled = false,
  className,
  labelClassName,
  children,
  onTap,
  dropRootRef,
  onDropAt,
}: ChunkBankTileProps) {
  const dragRef = useRef<DragSession | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const onTapRef = useRef(onTap)
  const onDropAtRef = useRef(onDropAt)
  onTapRef.current = onTap
  onDropAtRef.current = onDropAt

  const [ghost, setGhost] = useState<ChunkDragGhost | null>(null)
  const [dropHint, setDropHint] = useState<ChunkDropHint | null>(null)
  const [lifting, setLifting] = useState(false)

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const endDrag = () => {
    clearLongPress()
    dragRef.current?.cleanupListeners?.()
    dragRef.current = null
    setGhost(null)
    setDropHint(null)
    setLifting(false)
  }

  useEffect(() => () => {
    clearLongPress()
    dragRef.current?.cleanupListeners?.()
  }, [])

  const updateDropHint = (
    session: DragSession,
    clientX: number,
    clientY: number,
  ) => {
    const root = dropRootRef.current
    if (!root) {
      setDropHint(null)
      return
    }
    const box = root.getBoundingClientRect()
    const inside =
      clientX >= box.left &&
      clientX <= box.right &&
      clientY >= box.top &&
      clientY <= box.bottom
    if (!inside) {
      setDropHint(null)
      return
    }

    const row = root.querySelector<HTMLElement>('[data-chunk-order-row]')
    if (!row) {
      setDropHint({
        slot: 0,
        x: box.left + (box.width - session.width) / 2,
        y: box.top + (box.height - session.height) / 2,
        width: session.width,
        height: session.height,
      })
      return
    }

    setDropHint(
      resolveDropHintRect(
        row,
        clientX,
        clientY,
        null,
        session.width,
        session.height,
      ),
    )
  }

  const beginDragVisual = (session: DragSession, clientX: number, clientY: number) => {
    if (session.started) return
    session.started = true
    setLifting(true)
    setGhost({
      label: session.label,
      width: session.width,
      height: session.height,
      x: clientX - session.offsetX,
      y: clientY - session.offsetY,
    })
    updateDropHint(session, clientX, clientY)
  }

  const finishPointer = (clientX: number, clientY: number, pointerId: number) => {
    const session = dragRef.current
    if (!session || session.pointerId !== pointerId) return

    const wasDragging = session.started
    endDrag()

    if (!wasDragging) {
      onTapRef.current()
      return
    }

    const root = dropRootRef.current
    if (!root) return
    const box = root.getBoundingClientRect()
    const inside =
      clientX >= box.left &&
      clientX <= box.right &&
      clientY >= box.top &&
      clientY <= box.bottom
    if (!inside) return

    const row = root.querySelector<HTMLElement>('[data-chunk-order-row]')
    const slot = row
      ? resolveInsertAmongRemaining(row, clientX, clientY, null)
      : 0
    onDropAtRef.current(slot)
  }

  const attachWindowListeners = (session: DragSession) => {
    session.cleanupListeners?.()

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== session.pointerId) return
      event.preventDefault()

      if (!session.started) {
        const dx = event.clientX - session.originX
        const dy = event.clientY - session.originY
        if (dx * dx + dy * dy < CHUNK_DRAG_MOVE_PX * CHUNK_DRAG_MOVE_PX) return
        clearLongPress()
        beginDragVisual(session, event.clientX, event.clientY)
      }

      setGhost({
        label: session.label,
        width: session.width,
        height: session.height,
        x: event.clientX - session.offsetX,
        y: event.clientY - session.offsetY,
      })
      if (session.started) {
        updateDropHint(session, event.clientX, event.clientY)
      }
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

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled || event.button !== 0) return

    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const session: DragSession = {
      label,
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
      /* ignore */
    }

    clearLongPress()
    longPressTimer.current = window.setTimeout(() => {
      const current = dragRef.current
      if (!current || current.pointerId !== session.pointerId) return
      beginDragVisual(current, current.originX, current.originY)
    }, CHUNK_LONG_PRESS_MS)
  }

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        className={`${className ?? ''} ${lifting ? 'opacity-35' : ''} touch-none select-none`}
        onPointerDown={handlePointerDown}
      >
        {children ?? <span className={labelClassName}>{label}</span>}
      </button>

      {dropHint ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[190] rounded-lg border-2 border-dashed border-[#3C86FF] bg-[#3C86FF]/20 shadow-[0_0_0_4px_rgba(60,134,255,0.14)]"
          style={{
            left: dropHint.x,
            top: dropHint.y,
            width: dropHint.width,
            height: dropHint.height,
            boxSizing: 'border-box',
          }}
        />
      ) : null}

      {ghost ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[200] origin-center whitespace-nowrap rounded-[12px] border-2 border-[#3C86FF] bg-white px-3 py-2 shadow-[0_12px_28px_rgba(60,134,255,0.38)]"
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
