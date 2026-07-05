import { useEffect, useRef, useState } from 'react'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  FEEDBACK_MS,
  figmaRectStyle,
  isMatchingPair,
  WORD_MATCH_ASSETS,
  WORD_MATCH_COMPLETE_SHEET,
  WORD_PAIR_COUNT,
  WORD_TILES,
  type WordTile,
} from './word-match'

type WordMatchScreenProps = {
  onComplete?: () => void
}

type TileVisualState = 'idle' | 'selected' | 'correct' | 'wrong' | 'disabled'

function tileFrameClass(state: TileVisualState) {
  const base = 'box-border border-[3px]'

  switch (state) {
    case 'selected':
      return `${base} rounded-2xl border-[#4177FF] bg-[#EFF4FF]`
    case 'correct':
      return `${base} rounded-2xl border-[#22C55E] bg-[#F0FDF4]`
    case 'wrong':
      return `${base} rounded-2xl border-[#EF4444] bg-[#FEF2F2]`
    case 'disabled':
      return `${base} rounded-2xl border-transparent bg-[#EBEBEB]`
    default:
      return `${base} rounded-2xl border-transparent bg-[#FEFEFE]`
  }
}

function tileLabelClass(state: TileVisualState, side: WordTile['side']) {
  const sizeClass =
    side === 'en'
      ? 'text-[15px] leading-5 tracking-[-0.01em]'
      : 'text-[15px] leading-[1.35] tracking-[-0.02em]'

  switch (state) {
    case 'selected':
      return `${sizeClass} font-semibold text-[#4177FF]`
    case 'correct':
      return `${sizeClass} font-semibold text-[#22C55E]`
    case 'wrong':
      return `${sizeClass} font-semibold text-[#EF4444]`
    case 'disabled':
      return `${sizeClass} font-semibold text-[#9E9FA7]`
    default:
      return `${sizeClass} font-semibold text-[#1E1E1E]`
  }
}

function WordMatchCompleteSheet({ onContinue }: { onContinue?: () => void }) {
  return (
    <div className="absolute z-20" style={figmaRectStyle(WORD_MATCH_COMPLETE_SHEET)}>
      <div className="flex h-full flex-col rounded-t-[24px] border-t border-[#E4E7EA] bg-white px-[30px] pb-[41px] pt-[30px] shadow-[0_-10px_24px_rgba(0,0,0,0.06)]">
        <p className="text-center text-[22px] font-bold leading-none text-[#22C55E]">맞았어요!</p>
        {onContinue && (
          <button
            type="button"
            aria-label="계속하기"
            className="mt-auto flex h-[60px] w-full cursor-pointer items-center justify-center rounded-2xl border border-white bg-[#22C55E] text-[17px] font-bold text-white"
            onClick={onContinue}
          >
            계속하기
          </button>
        )}
      </div>
    </div>
  )
}

export function WordMatchScreen({ onComplete }: WordMatchScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(() => new Set())
  const [completed, setCompleted] = useState(false)
  const [feedback, setFeedback] = useState<{
    kind: 'correct' | 'wrong'
    tileIds: string[]
  } | null>(null)
  const [locked, setLocked] = useState(false)
  const feedbackTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  const getTileState = (tile: WordTile): TileVisualState => {
    if (matchedPairIds.has(tile.pairId)) return 'disabled'
    if (feedback?.tileIds.includes(tile.id)) return feedback.kind
    if (selectedIds.includes(tile.id)) return 'selected'
    return 'idle'
  }

  const handleTileClick = (tile: WordTile) => {
    if (completed || locked || matchedPairIds.has(tile.pairId)) return

    if (selectedIds.includes(tile.id)) {
      setSelectedIds((ids) => ids.filter((id) => id !== tile.id))
      return
    }

    if (selectedIds.length === 0) {
      setSelectedIds([tile.id])
      return
    }

    const first = WORD_TILES.find((entry) => entry.id === selectedIds[0])
    if (!first) {
      setSelectedIds([tile.id])
      return
    }

    if (isMatchingPair(first, tile)) {
      setLocked(true)
      setFeedback({ kind: 'correct', tileIds: [first.id, tile.id] })
      setSelectedIds([])

      feedbackTimerRef.current = window.setTimeout(() => {
        setMatchedPairIds((prev) => {
          const nextMatched = new Set(prev).add(tile.pairId)
          if (nextMatched.size >= WORD_PAIR_COUNT) {
            setCompleted(true)
          }
          return nextMatched
        })
        setFeedback(null)
        setLocked(false)
      }, FEEDBACK_MS)
      return
    }

    setLocked(true)
    setFeedback({ kind: 'wrong', tileIds: [first.id, tile.id] })
    setSelectedIds([])

    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null)
      setLocked(false)
    }, FEEDBACK_MS)
  }

  return (
    <FigmaAssetFrame src={WORD_MATCH_ASSETS.base} alt="단어 매칭" bgClassName="bg-white">
      <div className="absolute inset-0 z-10">
        {WORD_TILES.map((tile) => {
          const state = getTileState(tile)

          return (
            <button
              key={tile.id}
              type="button"
              aria-label={tile.label}
              disabled={completed}
              className={`absolute flex items-center justify-center px-3 text-center ${tileFrameClass(state)} ${completed ? 'cursor-default' : 'cursor-pointer'}`}
              style={figmaRectStyle(tile)}
              onClick={() => handleTileClick(tile)}
            >
              <span className={tileLabelClass(state, tile.side)}>{tile.label}</span>
            </button>
          )
        })}
      </div>
      {completed && <WordMatchCompleteSheet onContinue={onComplete} />}
    </FigmaAssetFrame>
  )
}
