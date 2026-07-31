import { useEffect, useMemo, useState } from 'react'
import { shuffleArray } from '../../lib/shuffle'
import {
  EXERCISE_CTA_CLASS,
  EXERCISE_OPTION_EN_CLASS,
  EXERCISE_PASSAGE_EN_CLASS,
  EXERCISE_PASSAGE_KO_MUTED_CLASS,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { ExerciseContinueButton } from '../exercise/ExerciseContinueButton'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  buildQuestionState,
  buildWordFromSlots,
  figmaRectStyle,
  getAnswerWordGroups,
  getSpaceAfterSlotIndices,
  getSpellingLength,
  getWordSpellTile,
  isPrefilledSlotIndex,
  isPrefilledTileId,
  matchesSpellAnswer,
  WORD_SPELL_ASSETS,
  WORD_SPELL_CARD,
  WORD_SPELL_CARD_TEXT,
  WORD_SPELL_CONTENT_BAKE_MASK,
  WORD_SPELL_QUESTIONS,
  WORD_SPELL_SLOTS_MASK,
  WORD_SPELL_SUBMIT_BTN,
  WORD_SPELL_TRAY_MASK,
  type WordSpellQuestion,
  type WordSpellTile,
} from './word-spell'
import { sessionWordSpellId } from '../exercise/session-results'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import { speakEnglishWord, stopEnglishWordAudio } from '../word-quiz/word-quiz'
import { RetryWrongCompleteSheet } from '../exercise/RetryWrongCompleteSheet'
import {
  useAdvanceWhenNoQuestions,
  type RetryWrongExerciseProps,
} from '../exercise/retry-wrong-ui'

type WordSpellScreenProps = {
  sessionOffset: number
  questions?: WordSpellQuestion[]
  answerIdForQuestion?: (questionId: string) => string
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
    slotCount >= 12
      ? 'min-w-[9px]'
      : slotCount >= 9
        ? 'min-w-[10px]'
        : 'min-w-[12px]'

  const wordGroups = getAnswerWordGroups(slotCount, spaceAfterSlotIndices)

  return (
    <span className="inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-[0.85em] gap-y-1.5 align-baseline">
      {wordGroups.map((group, groupIndex) => (
        <span
          key={`blank-word-${groupIndex}`}
          className="inline-flex shrink items-baseline border-b-2 border-[#1E1E1E] pb-0.5"
        >
          {group.map((slotIndex) => {
            const tileId = slots[slotIndex]
            const letter = tileId ? getWordSpellTile(tiles, tileId)?.letter : null
            const isFilled = Boolean(letter)
            const isPrefilled = isPrefilledSlotIndex(slotIndex, slots)

            return (
              <button
                key={`inline-${slotIndex}`}
                type="button"
                disabled={disabled || !isFilled || isPrefilled}
                aria-label={
                  isFilled
                    ? `${slotIndex + 1}번째 글자 ${letter}${isPrefilled ? ' (힌트)' : ''}`
                    : `${slotIndex + 1}번째 빈칸`
                }
                className={`${slotWidthClass} px-px text-center ${EXERCISE_OPTION_EN_CLASS} leading-none ${
                  isPrefilled
                    ? 'cursor-default text-[#64748B]'
                    : isFilled
                      ? 'cursor-pointer'
                      : 'cursor-default text-[#9CA3AF]'
                }`}
                onClick={() => {
                  if (isFilled && !isPrefilled) onSlotClick(slotIndex)
                }}
              >
                {isFilled ? letter : '_'}
              </button>
            )
          })}
        </span>
      ))}
    </span>
  )
}

function resetSpellState(question: WordSpellQuestion) {
  return buildQuestionState(question)
}

export function WordSpellScreen({
  sessionOffset,
  questions,
  answerIdForQuestion = sessionWordSpellId,
  onAnswer,
  onComplete,
  hideProgressBar = false,
  isFinalRetrySection = false,
  sessionTotalSteps,
  onRetryFlowHome,
}: WordSpellScreenProps) {
  // questions === undefined → 전체 은행 / [] → 오답 없음(스킵)
  const [activeQuestions] = useState(() =>
    shuffleArray([...(questions ?? WORD_SPELL_QUESTIONS)]),
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const question = activeQuestions[questionIndex]
  const isLastQuestion = questionIndex + 1 >= activeQuestions.length

  useAdvanceWhenNoQuestions(activeQuestions.length, () => {
    onComplete?.()
  })

  const spellingLength = question ? getSpellingLength(question.answer) : 0
  const spaceAfterSlotIndices = question
    ? getSpaceAfterSlotIndices(question.answer)
    : []

  const [{ tiles, slots }, setSpellState] = useState(() => {
    const first = activeQuestions[0]
    return first
      ? buildQuestionState(first)
      : { tiles: [], slots: [] as (string | null)[] }
  })
  const [result, setResult] = useState<SpellResult>('playing')

  useEffect(() => {
    if (!question) return
    setSpellState(buildQuestionState(question))
    setResult('playing')
  }, [question])

  const tilesInTray = useMemo(() => {
    const usedIds = new Set(slots.filter((tileId): tileId is string => tileId !== null))
    return tiles.filter(
      (tile) => !usedIds.has(tile.id) && !isPrefilledTileId(tile.id),
    )
  }, [slots, tiles])

  const allFilled = slots.every((tileId) => tileId !== null)
  const isPlaying = result === 'playing'
  const showFeedback = result === 'correct' || result === 'wrong'
  const completedInSection = questionIndex + (showFeedback ? 1 : 0)

  const resetQuestionState = (nextQuestion: WordSpellQuestion) => {
    setSpellState(resetSpellState(nextQuestion))
    setResult('playing')
  }

  const handleTrayTileClick = (tile: WordSpellTile) => {
    if (!isPlaying) return

    playTapSfx()

    const firstEmptyIndex = slots.findIndex((tileId) => tileId === null)
    if (firstEmptyIndex === -1) return

    setSpellState((prev) => ({
      ...prev,
      slots: (() => {
        const next = [...prev.slots]
        next[firstEmptyIndex] = tile.id
        return next
      })(),
    }))
  }

  const handleSlotClick = (slotIndex: number) => {
    if (!isPlaying || slots[slotIndex] === null || isPrefilledSlotIndex(slotIndex, slots)) {
      return
    }

    playTapSfx()

    setSpellState((prev) => ({
      ...prev,
      slots: (() => {
        const next = [...prev.slots]
        next[slotIndex] = null
        return next
      })(),
    }))
  }

  const handleSubmit = () => {
    if (!isPlaying || !allFilled) return

    playTapSfx()

    if (matchesSpellAnswer(buildWordFromSlots(slots, tiles), question.answer)) {
      onAnswer?.(answerIdForQuestion(question.id), true)
      playAnswerSfx(true)
      speakEnglishWord(question.answer, { force: true })
      setResult('correct')
      return
    }

    onAnswer?.(answerIdForQuestion(question.id), false)
    playAnswerSfx(false)
    setResult('wrong')
  }

  const handleFeedbackContinue = () => {
    stopEnglishWordAudio()
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

  if (!question) {
    return null
  }

  return (
    <FigmaAssetFrame src={WORD_SPELL_ASSETS.base} alt="단어 스펠링" bgClassName="bg-white">
      <div className={`absolute inset-0 z-10 ${showFeedback ? 'pointer-events-none' : ''}`}>
        {hideProgressBar ? (
          <BakedProgressBarMask />
        ) : (
          <ExerciseProgressBar
            sessionOffset={sessionOffset}
            completedInSection={completedInSection}
            totalSteps={sessionTotalSteps}
          />
        )}

        {/* SVG 데모 본문·빈칸·잔상 전부 가림 (매 문제 공통) */}
        <div
          aria-hidden
          className="pointer-events-none absolute z-[1] bg-white"
          style={figmaRectStyle(WORD_SPELL_CONTENT_BAKE_MASK)}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute z-[1] rounded-[22px] bg-[#F7FAFF]"
          style={figmaRectStyle(WORD_SPELL_CARD)}
        />
        <div
          key={question.id}
          className="absolute z-[2] overflow-y-auto overflow-x-hidden px-1"
          style={figmaRectStyle(WORD_SPELL_CARD_TEXT)}
        >
          <div className="flex min-h-full flex-col items-center justify-center gap-3 py-3 text-center">
            <p
              className={`${EXERCISE_PASSAGE_KO_MUTED_CLASS} w-full shrink-0 leading-[1.35]`}
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
                overflow: 'hidden',
                overflowWrap: 'anywhere',
                wordBreak: 'keep-all',
              }}
            >
              {question.korean}
            </p>
            <p
              className={`${EXERCISE_PASSAGE_EN_CLASS} w-full whitespace-normal leading-[1.55]`}
              style={{ overflowWrap: 'anywhere' }}
            >
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
        </div>

        {/* SVG 데모 슬롯만 가림 — 별도 빈칸 줄은 문장 인라인으로 대체 */}
        <div
          aria-hidden
          className="pointer-events-none absolute z-[1] bg-white"
          style={figmaRectStyle(WORD_SPELL_SLOTS_MASK)}
        />

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

        {!showFeedback ? (
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
        ) : null}
      </div>

      {showRetryComplete && <RetryWrongCompleteSheet onHome={onRetryFlowHome} />}
      {showFeedback && !showRetryComplete ? (
        <ExerciseContinueButton
          kind={result === 'correct' ? 'correct' : 'wrong'}
          rect={WORD_SPELL_SUBMIT_BTN}
          title={result === 'correct' ? '정답입니다.' : '오답입니다.'}
          hint={
            result === 'wrong' && question.answerHint
              ? `정답은 ${question.answerHint}에요`
              : undefined
          }
          onContinue={handleFeedbackContinue}
        />
      ) : null}
    </FigmaAssetFrame>
  )
}
