import { useEffect, useState } from 'react'
import { playTapSfx } from '../exercise/answer-sfx'
import type { LearnedWordPartItem } from '../exercise/session-results'
import {
  EXERCISE_REVIEW_KO_CLASS,
  EXERCISE_REVIEW_SUB_CLASS,
} from '../exercise/exercise-typography'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  preloadEnglishWordAudio,
  speakEnglishWord,
} from '../word-quiz/word-quiz'
import {
  figmaRectStyle,
  formatLearnedWordCountLabel,
  formatStudyMinutesLabel,
  LEARNING_COMPLETE_ASSET,
  LEARNING_COMPLETE_BADGE,
  LEARNING_COMPLETE_PRIMARY_BTN,
  LEARNING_COMPLETE_SECONDARY_BTN,
  LEARNING_COMPLETE_STATS_CARD,
  LEARNING_COMPLETE_STATS_DIVIDER_INSET,
  LEARNING_COMPLETE_WORD_CARD,
  LEARNING_COMPLETE_WORD_GRID_PAD,
  LEARNING_COMPLETE_WORD_SCROLL,
} from './learning-complete'

type LearningCompleteScreenProps = {
  /** 교사 부여 버튼명 + 「 완료」 (예: 「단어 1파트 완료」) */
  badgeLabel?: string
  /** 해당 단어 파트에서 학습한 고유 단어 수 */
  wordCount: number
  /** 단어 파트 소요 시간(분, 1분 단위) */
  studyMinutes: number
  /** 오늘 배운 단어 카드 */
  words: LearnedWordPartItem[]
  onContinue?: () => void
  onHome?: () => void
}

function BadgeCheckIcon() {
  return (
    <svg
      aria-hidden
      width="9"
      height="7"
      viewBox="0 0 9 7"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M1 3.6L3.35 6L8 1"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WordCard({
  word,
  selected,
  onSelect,
}: {
  word: LearnedWordPartItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${word.english} ${word.meaningKo}`}
      className={`relative flex w-full items-stretch overflow-hidden rounded-[11px] border bg-[#FEFEFE] text-left transition-shadow ${
        selected
          ? 'border-[#EAEBEF] shadow-[0_0_12px_rgba(36,160,255,1)]'
          : 'border-[#EAEBEF] shadow-none'
      }`}
      style={{ height: LEARNING_COMPLETE_WORD_CARD.h }}
      onClick={onSelect}
    >
      {selected ? (
        <span
          aria-hidden
          className="absolute bottom-[7px] left-[3px] top-[7px] w-[3px] rounded-[1.5px] bg-[#24A0FF]/65"
        />
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col justify-center py-1.5 pl-4 pr-8">
        <span className={`truncate ${EXERCISE_REVIEW_KO_CLASS}`}>
          {word.english}
        </span>
        <span
          className={`truncate ${EXERCISE_REVIEW_SUB_CLASS} ${
            selected ? 'text-[#24A0FF]' : 'text-[#8E9296]'
          }`}
        >
          {word.meaningKo}
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

/**
 * 단어 A~D 유형 전체 완료 화면.
 * Figma `단어파트 완료화면` + 실데이터 통계·오늘 배운 단어(선택 이펙트·TTS·스크롤).
 */
export function LearningCompleteScreen({
  badgeLabel = '단어 파트 완료',
  wordCount,
  studyMinutes,
  words,
  onContinue,
  onHome,
}: LearningCompleteScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => words[0]?.id ?? null,
  )

  useEffect(() => {
    void preloadEnglishWordAudio()
  }, [])

  useEffect(() => {
    if (words.length === 0) {
      setSelectedId(null)
      return
    }
    setSelectedId((prev) =>
      prev && words.some((word) => word.id === prev) ? prev : words[0]!.id,
    )
  }, [words])

  const handleWordSelect = (word: LearnedWordPartItem) => {
    setSelectedId(word.id)
    speakEnglishWord(word.english, { force: true })
  }

  return (
    <FigmaAssetFrame
      src={LEARNING_COMPLETE_ASSET}
      alt="단어 파트 완료"
      bgClassName="bg-white"
      backButton="labeled"
    >
      {/*
        베이크된 「1파트 완료」를 교사 부여명 배지로 덮음.
        높이 %는 **바깥 래퍼**에 준다 — 안쪽 알약에 주면 부모 높이가 auto라 %가 풀리지 않아
        알약이 글자 높이(약 17px)로 줄고, 베이크 배지(24px) 아랫부분이 삐져나온다.
      */}
      <div
        className="absolute z-[5] left-0 right-0 flex justify-center"
        style={{
          top: figmaRectStyle(LEARNING_COMPLETE_BADGE).top,
          height: figmaRectStyle(LEARNING_COMPLETE_BADGE).height,
        }}
      >
        <div
          className="flex h-full items-center justify-center gap-[9px] rounded-full bg-[#24A0FF] px-4"
          style={{ minWidth: figmaRectStyle(LEARNING_COMPLETE_BADGE).width }}
          aria-label={badgeLabel}
        >
          <BadgeCheckIcon />
          <span className="whitespace-nowrap font-sans text-[12px] font-bold leading-none text-white">
            {badgeLabel}
          </span>
        </div>
      </div>

      <div
        className="absolute z-[5] flex overflow-hidden rounded-[16.7px] border border-[#E2E7F0] bg-white"
        style={figmaRectStyle(LEARNING_COMPLETE_STATS_CARD)}
        aria-label={`학습 단어 ${formatLearnedWordCountLabel(wordCount)}, 공부 시간 ${formatStudyMinutesLabel(studyMinutes)}`}
      >
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5">
          <p className="font-sans text-[13px] font-medium leading-none text-[#8E9296]">
            학습 단어
          </p>
          <p className="font-sans text-[28px] font-bold leading-none tracking-[-0.02em] text-[#24A0FF]">
            {formatLearnedWordCountLabel(wordCount)}
          </p>
        </div>
        <div
          aria-hidden
          className="w-px shrink-0 bg-[#CCD6E6]/60"
          style={{
            marginTop: LEARNING_COMPLETE_STATS_DIVIDER_INSET,
            marginBottom: LEARNING_COMPLETE_STATS_DIVIDER_INSET,
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5">
          <p className="font-sans text-[13px] font-medium leading-none text-[#8E9296]">
            공부 시간
          </p>
          <p className="font-sans text-[28px] font-bold leading-none tracking-[-0.02em] text-[#24A0FF]">
            {formatStudyMinutesLabel(studyMinutes)}
          </p>
        </div>
      </div>

      {/* 베이크 단어칸 덮고 실데이터 그리드 — 영역만 세로 스크롤 */}
      <div
        className="absolute z-[5] overflow-y-auto overscroll-y-contain bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={figmaRectStyle(LEARNING_COMPLETE_WORD_SCROLL)}
      >
        <div
          className="grid grid-cols-2 gap-x-[9px] gap-y-[6px] px-2"
          style={{
            paddingTop: LEARNING_COMPLETE_WORD_GRID_PAD,
            paddingBottom: LEARNING_COMPLETE_WORD_GRID_PAD,
          }}
          role="list"
          aria-label="오늘 배운 단어"
        >
          {words.map((word) => (
            <div key={word.id} role="listitem">
              <WordCard
                word={word}
                selected={selectedId === word.id}
                onSelect={() => handleWordSelect(word)}
              />
            </div>
          ))}
        </div>
      </div>

      {onContinue ? (
        <button
          type="button"
          aria-label="계속하기"
          className="absolute z-10 cursor-pointer bg-transparent"
          style={figmaRectStyle(LEARNING_COMPLETE_PRIMARY_BTN)}
          onClick={() => {
            playTapSfx()
            onContinue()
          }}
        />
      ) : null}

      {onHome ? (
        <button
          type="button"
          aria-label="홈으로"
          className="absolute z-10 cursor-pointer bg-transparent"
          style={figmaRectStyle(LEARNING_COMPLETE_SECONDARY_BTN)}
          onClick={() => {
            playTapSfx()
            onHome()
          }}
        />
      ) : null}
    </FigmaAssetFrame>
  )
}
