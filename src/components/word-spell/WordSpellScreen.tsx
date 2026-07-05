import { useMemo, useState } from 'react'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  buildWordFromSlots,
  figmaRectStyle,
  getWordSpellTile,
  WORD_SPELL_ANSWER,
  WORD_SPELL_ASSETS,
  WORD_SPELL_SLOTS,
  WORD_SPELL_SLOT_COUNT,
  WORD_SPELL_SUBMIT_BTN,
  WORD_SPELL_TILES,
  type WordSpellTile,
} from './word-spell'

type WordSpellScreenProps = {
  onComplete?: () => void
}

function trayTileClass() {
  return 'box-border rounded-[14px] border-[3px] border-transparent bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
}

function filledSlotClass() {
  return 'box-border rounded-2xl border-[3px] border-[#3C86FF] bg-white'
}

function trayLabelClass() {
  return 'text-[22px] font-semibold leading-none text-[#1E1E1E]'
}

function slotLabelClass() {
  return 'text-[20px] font-semibold leading-none text-[#1E1E1E]'
}

export function WordSpellScreen({ onComplete }: WordSpellScreenProps) {
  const [slots, setSlots] = useState<(string | null)[]>(() =>
    Array.from({ length: WORD_SPELL_SLOT_COUNT }, () => null),
  )
  const [isCorrect, setIsCorrect] = useState(false)

  const tilesInTray = useMemo(() => {
    const usedIds = new Set(slots.filter((tileId): tileId is string => tileId !== null))
    return WORD_SPELL_TILES.filter((tile) => !usedIds.has(tile.id))
  }, [slots])

  const allFilled = slots.every((tileId) => tileId !== null)

  const assetSrc = isCorrect ? WORD_SPELL_ASSETS.correct : WORD_SPELL_ASSETS.base

  const handleTrayTileClick = (tile: WordSpellTile) => {
    if (isCorrect) return

    const firstEmptyIndex = slots.findIndex((tileId) => tileId === null)
    if (firstEmptyIndex === -1) return

    setSlots((prev) => {
      const next = [...prev]
      next[firstEmptyIndex] = tile.id
      return next
    })
  }

  const handleSlotClick = (slotIndex: number) => {
    if (isCorrect || slots[slotIndex] === null) return

    setSlots((prev) => {
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
  }

  const handleSubmit = () => {
    if (isCorrect || !allFilled) return

    if (buildWordFromSlots(slots) === WORD_SPELL_ANSWER) {
      setIsCorrect(true)
    }
  }

  return (
    <FigmaAssetFrame src={assetSrc} alt="단어 스펠링" bgClassName="bg-white">
      {!isCorrect && (
        <div className="absolute inset-0 z-10">
          {WORD_SPELL_SLOTS.map((layout, slotIndex) => {
            const tileId = slots[slotIndex]
            if (!tileId) return null

            const tile = getWordSpellTile(tileId)
            if (!tile) return null

            return (
              <button
                key={`slot-${slotIndex}`}
                type="button"
                aria-label={`${slotIndex + 1}번째 칸 ${tile.letter}`}
                className={`absolute z-[1] flex cursor-pointer items-center justify-center ${filledSlotClass()}`}
                style={figmaRectStyle(layout)}
                onClick={() => handleSlotClick(slotIndex)}
              >
                <span className={slotLabelClass()}>{tile.letter}</span>
              </button>
            )
          })}

          {WORD_SPELL_TILES.map((tile) => (
            <div
              key={`mask-${tile.id}`}
              aria-hidden
              className="pointer-events-none absolute rounded-[14px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
              style={figmaRectStyle(tile)}
            />
          ))}

          {tilesInTray.map((tile) => (
            <button
              key={tile.id}
              type="button"
              aria-label={tile.letter}
              className={`absolute z-[2] flex cursor-pointer items-center justify-center ${trayTileClass()}`}
              style={figmaRectStyle(tile)}
              onClick={() => handleTrayTileClick(tile)}
            >
              <span className={trayLabelClass()}>{tile.letter}</span>
            </button>
          ))}

          <button
            type="button"
            aria-label="제출하기"
            disabled={!allFilled}
            className={`absolute bg-transparent ${allFilled ? 'cursor-pointer' : 'cursor-default'}`}
            style={figmaRectStyle(WORD_SPELL_SUBMIT_BTN)}
            onClick={handleSubmit}
          />
        </div>
      )}

      {isCorrect && onComplete && (
        <button
          type="button"
          aria-label="계속하기"
          className="absolute z-10 cursor-pointer bg-transparent"
          style={figmaRectStyle({ x: 42, y: 767, w: 333, h: 44 })}
          onClick={onComplete}
        />
      )}
    </FigmaAssetFrame>
  )
}
