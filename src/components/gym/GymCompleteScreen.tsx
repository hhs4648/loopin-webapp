import { playTapSfx } from '../exercise/answer-sfx'
import { FRAME_H } from '../main-home/assignment-home'
import type { MainHomeNavTabId } from '../main-home/assignment-home'
import { formatCorrectSummary } from '../grammar-complete/grammar-complete'
import { gymCompleteHeading } from '../../lib/sync/assignment-title'
import type { ContentSnapshot } from '../../lib/sync/types'
import {
  GYM_COMPLETE_ASSET,
  GYM_COMPLETE_CTA_HIT,
  GYM_COMPLETE_HEADING_MASK,
  GYM_COMPLETE_HOME_HIT,
  GYM_COMPLETE_PERFECT_ASSET,
  GYM_COMPLETE_SUMMARY_MASK,
  GYM_COMPLETE_WRONG_HINT_MASK,
  GYM_EMPTY_STATUS_BAR_H,
  gymRectStyle,
} from './gym'
import { GymNavHits } from './GymNavHits'

/**
 * 헬스장 오답 재출제를 다 푼 뒤. 성 맵 종합 완료(`GrammarCompleteScreen`)와 다르다.
 *
 * - 오답이 하나라도 있으면 `헬스장_완료화면`
 * - 백점이면 `헬스장_완료화면_전체정답`
 *
 * 단원 제목·정답 수는 시안 데모를 가리고 React로 올린다.
 * 오답이 있으면 파란 CTA는 이번 헬스장에서 틀린 문항만 다시 푼다.
 */
export function GymCompleteScreen({
  perfect,
  snapshot,
  correctCount,
  totalCount,
  wrongCount,
  onSelectNav,
  onRetryWrongOnly,
  onHome,
  onDone,
}: {
  perfect: boolean
  snapshot: ContentSnapshot
  correctCount: number
  totalCount: number
  wrongCount: number
  onSelectNav?: (id: MainHomeNavTabId) => void
  /** 오답 있을 때 파란 「틀린 문제만 다시 풀기」 */
  onRetryWrongOnly?: () => void
  /** 오답 있을 때 「다음에 풀게요, 홈으로 가기」 */
  onHome?: () => void
  onDone?: () => void
}) {
  const asset = perfect ? GYM_COMPLETE_PERFECT_ASSET : GYM_COMPLETE_ASSET
  const heading = gymCompleteHeading(snapshot)
  const summary = formatCorrectSummary(correctCount, totalCount)

  return (
    <div
      className="flex min-h-full w-full justify-center bg-white"
      role="dialog"
      aria-modal="true"
      aria-label={`${heading} · ${summary}`}
    >
      <div className="relative isolate aspect-[393/852] w-full max-w-[540px] self-center overflow-hidden">
        <img
          src={asset}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full max-w-none select-none object-fill"
        />

        {/* 시안 가짜 시계 — OS 상태바와 두 겹이 되지 않게 가림 */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[14] bg-white"
          style={{ height: `${(GYM_EMPTY_STATUS_BAR_H / FRAME_H) * 100}%` }}
          aria-hidden
        />

        <div
          className="pointer-events-none absolute z-[21] bg-white"
          style={gymRectStyle(GYM_COMPLETE_HEADING_MASK)}
          aria-hidden
        />
        <p
          className="pointer-events-none absolute z-[22] flex items-center justify-center overflow-hidden px-1 text-center text-[20px] font-bold leading-tight text-[#192533]"
          style={gymRectStyle(GYM_COMPLETE_HEADING_MASK)}
        >
          <span className="line-clamp-2">{heading}</span>
        </p>

        <div
          className="pointer-events-none absolute z-[21] bg-white"
          style={gymRectStyle(GYM_COMPLETE_SUMMARY_MASK)}
          aria-hidden
        />
        <p
          className="pointer-events-none absolute z-[22] flex items-center justify-center text-[14px] font-semibold leading-none text-[#737D8C]"
          style={gymRectStyle(GYM_COMPLETE_SUMMARY_MASK)}
        >
          {summary}
        </p>

        {!perfect ? (
          <>
            <div
              className="pointer-events-none absolute z-[21] bg-white"
              style={gymRectStyle(GYM_COMPLETE_WRONG_HINT_MASK)}
              aria-hidden
            />
            <p
              className="pointer-events-none absolute z-[22] flex items-center justify-center text-[14px] font-semibold leading-none text-[#2F80ED]"
              style={gymRectStyle(GYM_COMPLETE_WRONG_HINT_MASK)}
            >
              {`틀린 문제 ${wrongCount}개가 있어요`}
            </p>
          </>
        ) : null}

        <button
          type="button"
          aria-label={
            perfect ? '확인' : '틀린 문제만 다시 풀기'
          }
          onClick={() => {
            playTapSfx()
            if (!perfect && onRetryWrongOnly) {
              onRetryWrongOnly()
              return
            }
            onDone?.()
          }}
          className="absolute z-20 cursor-pointer bg-transparent"
          style={gymRectStyle(GYM_COMPLETE_CTA_HIT)}
        />

        {!perfect ? (
          <button
            type="button"
            aria-label="다음에 풀게요, 홈으로 가기"
            onClick={() => {
              playTapSfx()
              onHome?.()
            }}
            className="absolute z-20 cursor-pointer bg-transparent"
            style={gymRectStyle(GYM_COMPLETE_HOME_HIT)}
          />
        ) : null}

        <GymNavHits onSelectNav={onSelectNav} />
      </div>
    </div>
  )
}
