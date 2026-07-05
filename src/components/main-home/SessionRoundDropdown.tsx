import { useEffect, useRef, useState } from 'react'
import { ClassRoundPillLabel } from './ClassRoundPillLabel'
import {
  CHEVRON,
  dialogPanelStyle,
  figmaRectStyle,
  SESSION_ROUNDS,
  type SessionRound,
} from './session-round-dropdown'

const SCROLL_LIST_CLASS =
  'min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

function SessionDropdownPanel({
  selectedId,
  onSelect,
}: {
  selectedId: number
  onSelect: (round: SessionRound) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const selectedEl = listRef.current?.querySelector<HTMLElement>(
      `[data-round-id="${selectedId}"]`,
    )
    selectedEl?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  return (
    <div
      className="absolute z-30 flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)]"
      style={dialogPanelStyle()}
      role="presentation"
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 -translate-y-full border-x-[7px] border-b-[7px] border-x-transparent border-b-white"
      />

      <div
        ref={listRef}
        role="listbox"
        aria-label="회차 선택"
        className={`${SCROLL_LIST_CLASS} px-2 pb-2 pt-2`}
      >
        {SESSION_ROUNDS.map((round) => {
          const isSelected = round.id === selectedId

          return (
            <button
              key={round.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              data-round-id={round.id}
              className={`w-full rounded-xl px-2 py-2 text-left ${
                isSelected ? 'bg-[#EFF6FF]' : 'bg-transparent'
              }`}
              onClick={() => onSelect(round)}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`font-['Pretendard',sans-serif] text-[14px] font-semibold leading-5 ${
                    isSelected ? 'text-[#155DFC]' : 'text-[#0A0A0A]'
                  }`}
                >
                  {round.label}
                </span>
                {round.isCurrent && (
                  <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 font-['Pretendard',sans-serif] text-[11px] font-medium leading-4 text-[#008236]">
                    현재회차
                  </span>
                )}
              </div>
              <p className="font-['Pretendard',sans-serif] text-[12px] leading-4 text-[#9AA3B0]">
                {round.date}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SessionRoundDropdown() {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected =
    SESSION_ROUNDS.find((round) => round.id === selectedId) ?? SESSION_ROUNDS[0]

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const selectRound = (round: SessionRound) => {
    setSelectedId(round.id)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="contents">
      <ClassRoundPillLabel roundLabel={selected.label} />

      <button
        type="button"
        aria-label="회차 선택"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="absolute z-20 cursor-pointer bg-transparent"
        style={figmaRectStyle(CHEVRON)}
        onClick={() => setOpen((value) => !value)}
      />

      {open && (
        <SessionDropdownPanel selectedId={selectedId} onSelect={selectRound} />
      )}
    </div>
  )
}
