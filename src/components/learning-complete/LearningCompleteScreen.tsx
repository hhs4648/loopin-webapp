import { useState } from 'react'
import {
  EXERCISE_META_CLASS,
  EXERCISE_REVIEW_EXAMPLE_CLASS,
  EXERCISE_REVIEW_KO_CLASS,
  EXERCISE_REVIEW_SUB_CLASS,
  EXERCISE_REVIEW_WORD_CLASS,
} from '../exercise/exercise-typography'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  figmaRectStyle,
  LEARNING_COMPLETE_ASSET,
  LEARNING_COMPLETE_DETAIL_CARD,
  LEARNING_COMPLETE_PRIMARY_BTN,
  LEARNING_COMPLETE_WORD_LIST_MASK,
  LEARNING_COMPLETE_WORDS,
  type LearningCompleteWord,
  type LearningCompleteWordId,
} from './learning-complete'

type LearningCompleteScreenProps = {
  onContinue?: () => void
}

function WordBox({
  word,
  selected,
  onSelect,
}: {
  word: LearningCompleteWord
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${word.english} ${word.meaningKo}`}
      className={`absolute z-[3] flex cursor-pointer items-stretch overflow-hidden rounded-[11px] border bg-[#FEFEFE] text-left transition-shadow ${
        selected
          ? 'border-[#EAEBEF] shadow-[0_0_12px_rgba(36,160,255,1)]'
          : 'border-[#EAEBEF] shadow-none'
      }`}
      style={figmaRectStyle(word.box)}
      onClick={onSelect}
    >
      {selected && (
        <span
          aria-hidden
          className="absolute bottom-[7px] left-[3px] top-[7px] w-[3px] rounded-[1.5px] bg-[#24A0FF]/65"
        />
      )}
      <span className="flex min-w-0 flex-1 flex-col justify-center pl-4 pr-8">
        <span className={`truncate ${EXERCISE_REVIEW_KO_CLASS}`}>
          {word.english}
        </span>
        <span
          className={`truncate ${EXERCISE_REVIEW_SUB_CLASS} ${
            selected ? 'text-[#24A0FF]' : 'text-[#8E9296]'
          }`}
        >          {word.meaningKo}
        </span>
      </span>
      <span
        aria-hidden
        className={`absolute right-3 top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full ${
          selected ? 'bg-[#24A0FF]' : 'bg-[#CEDAEE]'
        }`}
      />
    </button>
  )
}

function DetailCard({ word }: { word: LearningCompleteWord | null }) {
  return (
    <div
      aria-hidden={!word}
      className="absolute z-[3] overflow-hidden rounded-[16.7px] border border-[#E2E7F0] bg-white"
      style={figmaRectStyle(LEARNING_COMPLETE_DETAIL_CARD)}
    >
      {word ? (
        <div className="flex h-full">
          <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
            <p className={EXERCISE_META_CLASS}>{word.partOfSpeech}</p>
            <p className={`truncate ${EXERCISE_REVIEW_WORD_CLASS}`}>
              {word.english}
            </p>
            <p className={`truncate ${EXERCISE_REVIEW_SUB_CLASS}`}>{word.partOfSpeechKo}</p>          </div>
          <div aria-hidden className="my-3 w-px shrink-0 bg-[#CCD6E6]/60" />
          <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
            <p className={`line-clamp-2 ${EXERCISE_REVIEW_EXAMPLE_CLASS}`}>
              {word.exampleEn}
            </p>
            <p className={`mt-1 line-clamp-2 ${EXERCISE_META_CLASS} leading-snug`}>              {word.exampleKo}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function LearningCompleteScreen({ onContinue }: LearningCompleteScreenProps) {
  const [selectedWordId, setSelectedWordId] = useState<LearningCompleteWordId | null>(null)

  const selectedWord =
    LEARNING_COMPLETE_WORDS.find((word) => word.id === selectedWordId) ?? null

  const handleWordSelect = (wordId: LearningCompleteWordId) => {
    setSelectedWordId(wordId)
  }

  return (
    <FigmaAssetFrame src={LEARNING_COMPLETE_ASSET} alt="학습 완료" bgClassName="bg-white">
      <div
        aria-hidden
        className="absolute z-[2] bg-white"
        style={figmaRectStyle(LEARNING_COMPLETE_WORD_LIST_MASK)}
      />
      <div
        aria-hidden
        className="absolute z-[2] bg-white"
        style={figmaRectStyle(LEARNING_COMPLETE_DETAIL_CARD)}
      />

      <DetailCard word={selectedWord} />

      {LEARNING_COMPLETE_WORDS.map((word) => (
        <WordBox
          key={word.id}
          word={word}
          selected={selectedWordId === word.id}
          onSelect={() => handleWordSelect(word.id)}
        />
      ))}

      {onContinue && (
        <button
          type="button"
          aria-label="학습 완료 확인"
          className="absolute z-10 cursor-pointer bg-transparent"
          style={figmaRectStyle(LEARNING_COMPLETE_PRIMARY_BTN)}
          onClick={onContinue}
        />
      )}
    </FigmaAssetFrame>
  )
}
