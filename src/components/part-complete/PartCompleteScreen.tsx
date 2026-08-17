import { playTapSfx } from '../exercise/answer-sfx'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import {
  calcPartScore,
  encouragementForPartScore,
  figmaCamouflageStyle,
  figmaRectStyle,
  formatPartCorrectSummary,
  partCompleteAssetForScore,
  PART_COMPLETE_BADGE,
  PART_COMPLETE_ENCOURAGE,
  PART_COMPLETE_PRIMARY_BTN,
  PART_COMPLETE_SCORE,
  PART_COMPLETE_SECONDARY_BTN,
  PART_COMPLETE_SUMMARY,
  PART_COMPLETE_TEXT_MASK,
  PART_LABEL,
  type PartCompleteKind,
} from './part-complete'

type PartCompleteScreenProps = {
  /** 문장 / 문법 — aria 라벨용 */
  part: Exclude<PartCompleteKind, 'word'>
  /** 교사 부여 버튼명 + 「 완료」 (예: 「문장 1파트 완료」) */
  badgeLabel: string
  correctCount: number
  totalCount: number
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

/**
 * 문장 파트 · 문법 파트 완료 화면.
 * Figma `문장,문법 완료화면` + 실데이터 점수·정답수.
 * 하단 CTA: 계속하기(다음 파트 / 마지막이면 종합 완료화면) | 홈.
 */
export function PartCompleteScreen({
  part,
  badgeLabel,
  correctCount,
  totalCount,
  onContinue,
  onHome,
}: PartCompleteScreenProps) {
  const score = calcPartScore(correctCount, totalCount)
  const encouragement = encouragementForPartScore(score)
  const summary = formatPartCorrectSummary(correctCount, totalCount)

  return (
    <FigmaAssetFrame
      src={partCompleteAssetForScore(score)}
      alt={`${PART_LABEL[part]} 파트 완료`}
      bgClassName="bg-[#E3F1FF]"
      backButton="labeled"
    >
      {/*
        베이크된 「1파트 완료」알약(w≈144)을 교사 부여명 배지로 덮음.
        높이·minWidth는 단어 파트 완료와 동일 규칙 — 안쪽에 %만 주면 알약이
        줄어 베이크 파란 바탕이 오른쪽/아래로 비치고, 글자가 왼쪽으로 치우쳐 보인다.
      */}
      <div
        className="absolute z-[5] left-0 right-0 flex justify-center"
        style={{
          top: figmaRectStyle(PART_COMPLETE_BADGE).top,
          height: figmaRectStyle(PART_COMPLETE_BADGE).height,
        }}
      >
        <div
          className="flex h-full items-center justify-center gap-[9px] rounded-full bg-[#24A0FF] px-4"
          style={{ minWidth: figmaRectStyle(PART_COMPLETE_BADGE).width }}
          aria-label={badgeLabel}
        >
          <BadgeCheckIcon />
          <span className="whitespace-nowrap font-sans text-[14px] font-bold leading-none text-white">
            {badgeLabel}
          </span>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute z-[5]"
        style={figmaCamouflageStyle(PART_COMPLETE_TEXT_MASK)}
      />

      <p
        className="pointer-events-none absolute z-[6] flex items-baseline justify-center gap-[7px]"
        style={figmaRectStyle(PART_COMPLETE_SCORE)}
      >
        <span className="bg-gradient-to-b from-[#0E9CF7] to-[#0085E9] bg-clip-text font-sans text-[100px] font-bold leading-none text-transparent">
          {score}
        </span>
        <span className="relative top-[-2.5px] font-sans text-[36px] font-bold leading-none text-[#B5D7F8]">
          점
        </span>
      </p>

      <p
        className="pointer-events-none absolute z-[6] flex items-center justify-center font-sans text-[20px] font-bold leading-none text-black"
        style={figmaRectStyle(PART_COMPLETE_ENCOURAGE)}
      >
        {encouragement}
      </p>

      <p
        className="pointer-events-none absolute z-[6] flex items-center justify-center font-sans text-[18px] font-medium leading-none text-[#6B7281]"
        style={figmaRectStyle(PART_COMPLETE_SUMMARY)}
      >
        {summary}
      </p>

      {onContinue ? (
        <button
          type="button"
          aria-label="계속하기"
          className="absolute z-10 cursor-pointer bg-transparent"
          style={figmaRectStyle(PART_COMPLETE_PRIMARY_BTN)}
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
          style={figmaRectStyle(PART_COMPLETE_SECONDARY_BTN)}
          onClick={() => {
            playTapSfx()
            onHome()
          }}
        />
      ) : null}
    </FigmaAssetFrame>
  )
}
