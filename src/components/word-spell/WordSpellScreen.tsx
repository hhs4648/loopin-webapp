import { useMemo, useState } from 'react'
import {
  COLOR_CORRECT_BG,
  COLOR_WRONG_BG,
  EXERCISE_CTA_CLASS,
  EXERCISE_FEEDBACK_HINT_CLASS,
  EXERCISE_OPTION_EN_CLASS,
  EXERCISE_PASSAGE_EN_CLASS,
  EXERCISE_PASSAGE_KO_MUTED_CLASS,
  exerciseFeedbackTitleClass,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  buildQuestionTiles,
  buildWordFromSlots,
  figmaRectStyle,
  getSlotLayouts,
  getSpaceAfterSlotIndices,
  getSpellingLength,
  getWordSpellTile,
  matchesSpellAnswer,
  WORD_SPELL_ASSETS,
  WORD_SPELL_FEEDBACK_SHEET,
  WORD_SPELL_KOREAN_PROMPT,
  WORD_SPELL_PROMPT,
  WORD_SPELL_QUESTIONS,
  WORD_SPELL_SLOTS_MASK,
  WORD_SPELL_SUBMIT_BTN,
  WORD_SPELL_TRAY_MASK,
  type WordSpellQuestion,
  type WordSpellTile,
} from './word-spell'
import { sessionWordSpellId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import { useEnterToContinue } from '../exercise/use-enter-to-continue'
import type { RetryWrongExerciseProps } from '../exercise/retry-wrong-ui'

type WordSpellScreenProps = {
  sessionOffset: number
  questions?: WordSpellQuestion[]
  onAnswer?: (stepId: string, isCorrect: boolean) => void
  onComplete?: () => void
} & RetryWrongExerciseProps

type SpellResult = 'playing' | 'correct' | 'wrong'

function trayTileClass() {
  return 'box-border rounded-[14px] border-[3px] border-transparent bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
}

function trayLabelClass() {
  return EXERCISE_OPTION_EN_CLASS
}

function emptySlotClass() {
  return 'box-border rounded-2xl border border-[#E2E8F2] bg-[#F4F7FB]'
}

function filledSlotClass() {
  return 'box-border rounded-2xl border-[3px] border-[#3C86FF] bg-white'
}

function slotLabelClass() {
  return EXERCISE_OPTION_EN_CLASS
}

function WordSpellFeedbackSheet({
  kind,
  answerHint,
  onContinue,
}: {
  kind: 'correct' | 'wrong'
  answerHint?: string
  onContinue?: () => void
}) {
  const isCorrect = kind === 'correct'

  const handleContinue = () => {
    playTapSfx()
    onContinue?.()
  }

  useEnterToContinue(onContinue ? handleContinue : undefined)

  return (
    <div className="absolute z-20" style={figmaRectStyle(WORD_SPELL_FEEDBACK_SHEET)}>
      <div className="flex h-full flex-col rounded-t-[24px] border-t border-[#E4E7EA] bg-white px-[30px] pb-[41px] pt-[30px] shadow-[0_-10px_24px_rgba(0,0,0,0.06)]">
        <p className={exerciseFeedbackTitleClass(isCorrect)}>
          {isCorrect ? '정답입니다.' : '오답입니다.'}
        </p>
        {answerHint && (
          <p className={EXERCISE_FEEDBACK_HINT_CLASS}>
            정답은 {answerHint}에요
          </p>
        )}
        {onContinue && (
          <button
            type="button"
            aria-label="계속하기"
            className={`mt-auto flex h-[60px] w-full cursor-pointer items-center justify-center rounded-2xl border border-white ${EXERCISE_CTA_CLASS} text-white ${
              isCorrect ? COLOR_CORRECT_BG : COLOR_WRONG_BG
            }`}
            onClick={handleContinue}
          >
            계속하기
          </button>
        )}
      </div>
    </div>
  )
}

function InlineAnswerLine({
  slotCount,
  slots,
  tiles,
  spaceAfterSlotIndices,
  disabled,
  onSlotClick,
}: {
  slotCount: number
  slots: (string | null)[]
  tiles: WordSpellTile[]
  spaceAfterSlotIndices: number[]
  disabled: boolean
  onSlotClick: (slotIndex: number) => void
}) {
  const slotWidthClass =
    slotCount >= 10 ? 'min-w-[10px]' : slotCount >= 8 ? 'min-w-[11px]' : 'min-w-[13px]'

  return (
    <span className="inline-flex items-baseline border-b-2 border-[#1E1E1E] pb-[1px]">
      {Array.from({ length: slotCount }, (_, slotIndex) => {
        const tileId = slots[slotIndex]
        const letter = tileId ? getWordSpellTile(tiles, tileId)?.letter : null
        const isFilled = Boolean(letter)

        return (
          <span key={`inline-${slotIndex}`} className="inline-flex items-baseline">
            {slotIndex > 0 && spaceAfterSlotIndices.includes(slotIndex - 1) && (
              <span aria-hidden className="min-w-[4px] px-[1px]">
                {' '}
              </span>
            )}
            <button
              type="button"
              disabled={disabled || !isFilled}
              aria-label={
                isFilled
                  ? `${slotIndex + 1}번째 글자 ${letter}`
                  : `${slotIndex + 1}번째 빈칸`
              }
              className={`${slotWidthClass} px-[1px] text-center ${EXERCISE_OPTION_EN_CLASS} leading-none ${
                isFilled ? 'cursor-pointer' : 'cursor-default text-[#9CA3AF]'
              }`}
              onClick={() => {
                if (isFilled) onSlotClick(slotIndex)
              }}
            >
              {isFilled ? letter : '_'}
            </button>
          </span>
        )
      })}
    </span>
  )
}

function createEmptySlots(count: number) {
  return Array.from({ length: count }, () => null)
}

export function WordSpellScreen({
  sessionOffset,
  questions,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  onRetryFlowHome,
}: WordSpellScreenProps) {
  const activeQuestions = questions ?? WORD_SPELL_QUESTIONS
  const [questionIndex, setQuestionIndex] = useState(0)
  const question = activeQuestions[questionIndex]
  const isLastQuestion = questionIndex + 1 >= activeQuestions.length

  const spellingLength = getSpellingLength(question.answer)
  const spaceAfterSlotIndices = getSpaceAfterSlotIndices(question.answer)

  const [tiles, setTiles] = useState(() => buildQuestionTiles(question))
  const [slots, setSlots] = useState<(string | null)[]>(() => createEmptySlots(spellingLength))
  const [result, setResult] = useState<SpellResult>('playing')

  const slotLayouts = useMemo(() => getSlotLayouts(spellingLength), [spellingLength])

  const tilesInTray = useMemo(() => {
    const usedIds = new Set(slots.filter((tileId): tileId is string => tileId !== null))
    return tiles.filter((tile) => !usedIds.has(tile.id))
  }, [slots, tiles])

  const allFilled = slots.every((tileId) => tileId !== null)
  const isPlaying = result === 'playing'
  const showFeedback = result === 'correct' || result === 'wrong'
  const completedInSection = questionIndex + (showFeedback ? 1 : 0)

  const resetQuestionState = (nextQuestion: WordSpellQuestion) => {
    setTiles(buildQuestionTiles(nextQuestion))
    setSlots(createEmptySlots(getSpellingLength(nextQuestion.answer)))
    setResult('playing')
  }

  const handleTrayTileClick = (tile: WordSpellTile) => {
    if (!isPlaying) return

    playTapSfx()

    const firstEmptyIndex = slots.findIndex((tileId) => tileId === null)
    if (firstEmptyIndex === -1) return

    setSlots((prev) => {
      const next = [...prev]
      next[firstEmptyIndex] = tile.id
      return next
    })
  }

  const handleSlotClick = (slotIndex: number) => {
    if (!isPlaying || slots[slotIndex] === null) return

    playTapSfx()

    setSlots((prev) => {
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
  }

  const handleSubmit = () => {
    if (!isPlaying || !allFilled) return

    playTapSfx()

    if (matchesSpellAnswer(buildWordFromSlots(slots, tiles), question.answer)) {
      onAnswer?.(sessionWordSpellId(question.id), true)
      playAnswerSfx(true)
      setResult('correct')
      return
    }

    onAnswer?.(sessionWordSpellId(question.id), false)
    playAnswerSfx(false)
    setResult('wrong')
  }

  const handleFeedbackContinue = () => {
    playTapSfx()
    if (isLastQuestion) {
      if (!isFinalRetrySection) {
        onComplete?.()
      }
      return
    }

    const nextIndex = questionIndex + 1
    setQuestionIndex(nextIndex)
    resetQuestionState(activeQuestions[nextIndex])
  }

  const showRetryComplete = showFeedback && isLastQuestion && isFinalRetrySection

  return (
    <FigmaAssetFrame src={WORD_SPELL_ASSETS.base} alt="단어 스펠링" bgClassName="bg-white">
      <div className={`absolute inset-0 z-10 ${showFeedback ? 'pointer-events-none' : ''}`}>
        {hideProgressBar ? (
          <BakedProgressBarMask />
        ) : (
          <ExerciseProgressBar
            sessionOffset={sessionOffset}
            completedInSection={completedInSection}
          />
        )}

        <div
          className="pointer-events-none absolute bg-[#F7FAFF]"
          style={figmaRectStyle(WORD_SPELL_KOREAN_PROMPT)}
        />
        <div className="absolute z-[1]" style={figmaRectStyle(WORD_SPELL_KOREAN_PROMPT)}>
          <p className={EXERCISE_PASSAGE_KO_MUTED_CLASS}>
            {question.korean}
          </p>
        </div>

        <div
          className="pointer-events-none absolute bg-[#F7FAFF]"
          style={figmaRectStyle(WORD_SPELL_PROMPT)}
        />
        <div className="absolute z-[1]" style={figmaRectStyle(WORD_SPELL_PROMPT)}>
          <p className={EXERCISE_PASSAGE_EN_CLASS}>
            {question.englishBefore}
            <InlineAnswerLine
              slotCount={spellingLength}
              slots={slots}
              tiles={tiles}
              spaceAfterSlotIndices={spaceAfterSlotIndices}
              disabled={!isPlaying}
              onSlotClick={handleSlotClick}
            />
            {question.englishAfter}
          </p>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bg-white"
          style={figmaRectStyle(WORD_SPELL_SLOTS_MASK)}
        />

        {slotLayouts.map((layout, slotIndex) => {
          const tileId = slots[slotIndex]
          const tile = tileId ? getWordSpellTile(tiles, tileId) : null

          if (!tile) {
            return (
              <div
                key={`slot-empty-${question.id}-${slotIndex}`}
                aria-hidden
                className={`absolute z-[2] ${emptySlotClass()}`}
                style={figmaRectStyle(layout)}
              />
            )
          }

          return (
            <button
              key={`slot-${question.id}-${slotIndex}`}
              type="button"
              aria-label={`${slotIndex + 1}번째 칸 ${tile.letter}`}
              className={`absolute z-[2] flex cursor-pointer items-center justify-center ${filledSlotClass()}`}
              style={figmaRectStyle(layout)}
              onClick={() => handleSlotClick(slotIndex)}
            >
              <span className={slotLabelClass()}>{tile.letter}</span>
            </button>
          )
        })}

        <div
          aria-hidden
          className="pointer-events-none absolute bg-white"
          style={figmaRectStyle(WORD_SPELL_TRAY_MASK)}
        />

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
          className={`absolute flex items-center justify-center rounded-2xl ${EXERCISE_CTA_CLASS} text-white ${
            allFilled
              ? 'cursor-pointer border border-white bg-[#3C86FF]'
              : 'cursor-default bg-transparent'
          }`}
          style={figmaRectStyle(WORD_SPELL_SUBMIT_BTN)}
          onClick={handleSubmit}
        >
          {allFilled && '제출하기'}
        </button>
      </div>

      {showRetryComplete && <RetryWrongCompleteSheet onHome={onRetryFlowHome} />}
      {showFeedback && !showRetryComplete && (
        <WordSpellFeedbackSheet
          kind={result === 'correct' ? 'correct' : 'wrong'}
          answerHint={question.answerHint}
          onContinue={handleFeedbackContinue}
        />
      )}
    </FigmaAssetFrame>
  )
}
