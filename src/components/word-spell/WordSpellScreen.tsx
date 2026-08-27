import { useEffect, useMemo, useState } from 'react'
import { shuffleArray } from '../../lib/shuffle'
import {
  EXERCISE_CTA_CLASS,
  EXERCISE_OPTION_EN_CLASS,
  EXERCISE_PASSAGE_EN_CLASS,
  EXERCISE_PASSAGE_KO_MUTED_CLASS,
} from '../exercise/exercise-typography'
import { ExerciseProgressBar, BakedProgressBarMask } from '../exercise/ExerciseProgressBar'
import { ExpandablePassageBox } from '../exercise/ExpandablePassageBox'
import { ExerciseContinueButton } from '../exercise/ExerciseContinueButton'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { BACK_MASK_WHITE_HEADER } from '../navigation/figma-navigation'
import {
  buildQuestionState,
  buildWordFromSlots,
  figmaRectStyle,
  getAnswerWordGroups,
  getSpaceAfterSlotIndices,
  getSlotLayouts,
  getSpellingLength,
  getWordSpellTile,
  isPrefilledSlotIndex,
  isPrefilledTileId,
  matchesSpellAnswer,
  WORD_SPELL_ASSETS,
  WORD_SPELL_CARD,
  WORD_SPELL_CONTENT_BAKE_MASK,
  WORD_SPELL_QUESTIONS,
  WORD_SPELL_SLOT_AREA,
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

/** 하단 글자 칸 직전까지 — 카드가 슬롯과 겹치지 않게 */
const WORD_SPELL_PASSAGE_MAX_BOTTOM = WORD_SPELL_SLOT_AREA.y - 8

function trayTileClass() {
  return 'box-border rounded-[14px] border-[3px] border-transparent bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
}

function trayLabelClass() {
  return EXERCISE_OPTION_EN_CLASS
}

function slotBoxClass(isFilled: boolean) {
  if (!isFilled) {
    return 'rounded-[12px] border-2 border-[#E2E8F2] bg-[#F4F7FB]'
  }
  return 'rounded-[12px] border-2 border-[#3C86FF] bg-white'
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
  const wordGroups = getAnswerWordGroups(slotCount, spaceAfterSlotIndices)

  return (
    <span className="inline-flex max-w-full flex-wrap items-end justify-center gap-x-[0.55em] gap-y-1 align-baseline">
      {wordGroups.map((group, groupIndex) => (
        <span
          key={`blank-word-${groupIndex}`}
          className="inline-flex shrink-0 items-end border-b-[2.5px] border-[#1E1E1E] pb-[1px]"
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
                className={[
                  // 본문 20px 기준 — 글자 칸이 문장과 같은 크기·높이로 이어지게
                  'inline-flex h-[1.2em] w-[0.78em] shrink-0 items-center justify-center',
                  'p-0 font-en text-[1em] font-semibold leading-none tracking-normal',
                  isPrefilled
                    ? 'cursor-default text-[#64748B]'
                    : isFilled
                      ? 'cursor-pointer text-[#1E1E1E]'
                      : 'cursor-default text-transparent',
                ].join(' ')}
                onClick={() => {
                  if (isFilled && !isPrefilled) onSlotClick(slotIndex)
                }}
              >
                {/* 빈 칸은 `_` 대신 투명 자리만 — 밑줄만 보이게 */}
                {isFilled ? letter : '\u00A0'}
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
  const slotLayouts = useMemo(
    () => getSlotLayouts(spellingLength, spaceAfterSlotIndices),
    [spellingLength, spaceAfterSlotIndices],
  )

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
    <FigmaAssetFrame backButtonMask={BACK_MASK_WHITE_HEADER} src={WORD_SPELL_ASSETS.base} alt="단어 스펠링" bgClassName="bg-white">
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

        {/* SVG 데모 본문·빈칸·잔상 가림 */}
        <div
          aria-hidden
          className="pointer-events-none absolute z-[1] bg-white"
          style={figmaRectStyle(WORD_SPELL_CONTENT_BAKE_MASK)}
        />

        {/* 회색 카드 + 본문 — 하단 글자 칸 직전까지 */}
        <ExpandablePassageBox
          rect={WORD_SPELL_CARD}
          maxBottom={WORD_SPELL_PASSAGE_MAX_BOTTOM}
          contentKey={question.id}
          className="absolute z-[2] rounded-[22px] bg-[#F7FAFF] shadow-[0_0_12px_#CFDCE9]"
          contentClassName="flex w-full flex-col items-center justify-center gap-3 px-4 py-5 text-center"
        >
          <p
            className={`${EXERCISE_PASSAGE_KO_MUTED_CLASS} w-full shrink-0 leading-[1.4]`}
            style={{
              overflowWrap: 'anywhere',
              wordBreak: 'keep-all',
            }}
          >
            {question.korean}
          </p>
          <p
            className={`${EXERCISE_PASSAGE_EN_CLASS} w-full shrink-0 whitespace-normal leading-[1.5]`}
            style={{ overflowWrap: 'break-word' }}
          >
            <span className="whitespace-pre-wrap">{question.englishBefore}</span>
            <InlineAnswerLine
              slotCount={spellingLength}
              slots={slots}
              tiles={tiles}
              spaceAfterSlotIndices={spaceAfterSlotIndices}
              disabled={!isPlaying}
              onSlotClick={handleSlotClick}
            />
            <span className="whitespace-pre-wrap">{question.englishAfter}</span>
          </p>
        </ExpandablePassageBox>

        {/* 시안 8칸 잔상 가림 — React 슬롯을 위에 올림 */}
        <div
          aria-hidden
          className="pointer-events-none absolute z-[1] bg-white"
          style={figmaRectStyle(WORD_SPELL_SLOTS_MASK)}
        />

        {slotLayouts.map((rect, slotIndex) => {
          const tileId = slots[slotIndex]
          const letter = tileId ? getWordSpellTile(tiles, tileId)?.letter : null
          const isFilled = Boolean(letter)
          const isPrefilled = isPrefilledSlotIndex(slotIndex, slots)

          return (
            <button
              key={`slot-${slotIndex}`}
              type="button"
              disabled={!isPlaying || !isFilled || isPrefilled}
              aria-label={
                isFilled
                  ? `${slotIndex + 1}번째 글자 ${letter}${isPrefilled ? ' (힌트)' : ''}`
                  : `${slotIndex + 1}번째 빈칸`
              }
              className={`absolute z-[2] flex items-center justify-center disabled:opacity-100 ${slotBoxClass(isFilled)} ${
                isFilled && !isPrefilled ? 'cursor-pointer' : 'cursor-default'
              }`}
              style={figmaRectStyle(rect)}
              onClick={() => handleSlotClick(slotIndex)}
            >
              {isFilled ? <span className={trayLabelClass()}>{letter}</span> : null}
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

