import { playTapSfx } from '../exercise/answer-sfx'
import { BackButtonOverlay } from '../navigation/BackButtonOverlay'
import { ComboStreakBadge } from './ComboStreakBadge'
import { BACK_MASK_COMPLETE } from '../navigation/figma-navigation'
import { useBackNavigation } from '../navigation/BackNavigationProvider'
import {
  assignmentCompleteAssetForScore,
  COMPLETE_BOTTOM_NAV_COVER,
  COMPLETE_BOTTOM_NAV_COVER_FILL,
  COMPLETE_CTA_LABEL_CLASS,
  COMPLETE_RETRY_ALL_BTN,
  COMPLETE_RETRY_WRONG_BTN,
  COMPLETE_SCORE_MASK,
  calcSessionScore,
  encouragementForScore,
  figmaRectStyle,
  formatCorrectSummary,
  formatRoundCompleteLabel,
} from './grammar-complete'

type GrammarCompleteScreenProps = {
  /** 이번 세션 최고 연속 정답 — 「연속 정답」 배지에 쓴다 */
  maxCombo?: number
  correctCount: number
  wrongCount: number
  totalCount: number
  roundNumber?: number
  onRetryAll?: () => void
  onRetryWrongOnly?: () => void
  onHome?: () => void
}

/**
 * 과제/성 완료 점수 화면.
 * Figma `완료 1`·`2`·`3`(점수대별) + 실데이터 점수.
 * 하단 CTA: 틀린문제만 | 재도전 (홈 아이콘 없음 — 상단 `<`로 홈).
 */
export function GrammarCompleteScreen({
  maxCombo = 0,
  correctCount,
  wrongCount,
  totalCount,
  roundNumber = 1,
  onRetryAll,
  onRetryWrongOnly,
  onHome,
}: GrammarCompleteScreenProps) {
  const score = calcSessionScore(correctCount, totalCount)
  const asset = assignmentCompleteAssetForScore(score)
  const canRetryWrongOnly = Boolean(onRetryWrongOnly) && wrongCount > 0
  const canRetryAll = Boolean(onRetryAll)
  const summary = formatCorrectSummary(correctCount, totalCount)
  const roundLabel = formatRoundCompleteLabel(roundNumber)
  const encouragement = encouragementForScore(score)

  // 공통 뒤로가기(BackButtonOverlay)가 이 화면의 onHome을 호출하도록 등록한다
  useBackNavigation(() => {
    playTapSfx()
    onHome?.()
  }, Boolean(onHome))

  return (
    <div className="flex min-h-full w-full justify-center bg-[#E2F7FF]">
      <div className="relative isolate aspect-[393/852] w-full max-w-[540px] self-center overflow-hidden">
        <img
          src={asset}
          alt="과제 완료"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none object-cover"
          draggable={false}
        />

        <div className="absolute inset-0 z-[50]">
          {/*
            뒤로가기 — 다른 화면과 **같은 자리·같은 크기**로 통일했다(2026-08-08).
            이 화면의 구운 `<`는 혼자 아래(y 105~135)에 크게(22×30) 그려져 있어서
            `BACK_MASK_COMPLETE`로 덮고 공통 컴포넌트가 다시 그린다.
          */}
          {onHome ? (
            <BackButtonOverlay mask={BACK_MASK_COMPLETE} />
          ) : null}

          {/* 최고 연속 정답 — 흰 카드 오른쪽 위 꼭짓점 */}
          <ComboStreakBadge combo={maxCombo} />

          {/* 점수 + 안내 (시안 카드 안) */}
          <div
            className="absolute z-[55] flex flex-col items-center bg-white px-3"
            style={figmaRectStyle(COMPLETE_SCORE_MASK)}
          >
            <div className="flex flex-1 flex-col items-center justify-center">
              <p className="font-sans text-[22px] font-bold leading-none text-[#00A63D]">
                {roundLabel}
              </p>
              <p className="mt-3 flex items-end justify-center gap-1 leading-none">
                <span className="font-sans text-[64px] font-bold tracking-[-0.03em] text-[#1E1E1E]">
                  {score}
                </span>
                <span className="mb-1.5 font-sans text-[24px] font-bold text-[#6B7280]">
                  점
                </span>
              </p>
              <p className="mt-2 font-sans text-[24px] font-bold leading-none text-[#1E1E1E]">
                {encouragement}
              </p>
              <p className="mt-2 font-sans text-[16px] font-semibold text-[#6B7280]">
                {summary}
              </p>
            </div>
            <div className="mb-1 w-full space-y-1 pb-1 text-center font-sans text-[12px] font-medium leading-snug">
              <p className="text-[#6B7280]">
                <span className="font-semibold text-[#4F91EA]">재도전</span>
                {' - 다시 풀어서 더 높은 점수를 받을 수 있어요'}
              </p>
              <p className="text-[#6B7280]">
                <span className="font-semibold text-[#4F91EA]">틀린 문제만</span>
                {' - 틀린 문제만 골라서 다시 풀어봐요'}
              </p>
            </div>
          </div>

          {/* 베이크 하단 탭바 가림 */}
          <div
            className="pointer-events-none absolute z-[58]"
            style={{
              ...figmaRectStyle(COMPLETE_BOTTOM_NAV_COVER),
              background: COMPLETE_BOTTOM_NAV_COVER_FILL,
            }}
            aria-hidden
          />

          {/* 틀린문제만 — 시안 왼쪽 슬롯(125×60). 베이크 문구는 불투명이 가림 */}
          <button
            type="button"
            aria-label="틀린문제만 — 오답만 다시 풀기"
            disabled={!canRetryWrongOnly}
            className={`absolute z-[60] box-border flex items-center justify-center rounded-[16px] border-2 outline-none ${COMPLETE_CTA_LABEL_CLASS} ${
              canRetryWrongOnly
                ? 'cursor-pointer border-[#A7D9FF] bg-white text-[#4F91EA]'
                : 'cursor-default border-[#C5D4E0] bg-[#F3F6F8] text-[#9CA3AF]'
            }`}
            style={figmaRectStyle(COMPLETE_RETRY_WRONG_BTN)}
            onClick={() => {
              if (!canRetryWrongOnly) return
              playTapSfx()
              onRetryWrongOnly?.()
            }}
          >
            틀린문제만
          </button>

          {/* 재도전 — 시안 오른쪽 슬롯(191×60) */}
          <button
            type="button"
            aria-label="재도전 — 처음부터 다시 풀기"
            disabled={!canRetryAll}
            className={`absolute z-[60] box-border flex items-center justify-center rounded-[16px] border-2 outline-none ${COMPLETE_CTA_LABEL_CLASS} ${
              canRetryAll
                ? 'cursor-pointer border-[#1E9EFF] text-white'
                : 'cursor-default border-[#D1D5DB] bg-[#E5E7EB] text-[#9CA3AF]'
            }`}
            style={{
              ...figmaRectStyle(COMPLETE_RETRY_ALL_BTN),
              ...(canRetryAll
                ? {
                    background:
                      'linear-gradient(90deg, #46AFFF 0%, #1E9EFF 100%)',
                  }
                : {}),
            }}
            onClick={() => {
              if (!canRetryAll) return
              playTapSfx()
              onRetryAll?.()
            }}
          >
            재도전
          </button>
        </div>
      </div>
    </div>
  )
}



