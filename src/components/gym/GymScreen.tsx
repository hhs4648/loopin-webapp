import { useEffect, useMemo, useState } from 'react'
import { playTapSfx } from '../exercise/answer-sfx'
import {
  FRAME_H,
  type MainHomeNavTabId,
} from '../main-home/assignment-home'
import type { StudentAssignment } from '../../lib/sync/types'
import { gymStartHeading } from '../../lib/sync/assignment-title'
import {
  buildAssignmentSections,
  listSectionQuestionIds,
} from '../../features/assignments/build-session-sections'
import { estimateMinutesForQuestionIds } from '../../features/review/review-stats'
import {
  GYM_ASSET,
  GYM_EMPTY_ASSET,
  GYM_START_ASSET,
  GYM_CHARACTER_HIT,
  GYM_EMPTY_HOME_HIT,
  GYM_EMPTY_STATUS_BAR_H,
  GYM_START_BACK_HIT,
  GYM_START_BADGE,
  GYM_START_CARD_BLUE,
  GYM_START_CTA_HIT,
  GYM_START_METRIC_LABEL_COLOR,
  GYM_START_METRICS,
  GYM_START_METRICS_MASK,
  GYM_START_TITLE,
  GYM_START_TITLE_MASK,
  gymRectStyle,
} from './gym'
import { GymNavHits } from './GymNavHits'

/**
 * 헬스장 — 하단 내비 「헬스장」 탭으로 들어온다.
 *
 * 교사 웹 「오답만 다시 출제」로 내려온 개인 과제를 여기서 푼다.
 * 복습하기(`ReviewMainWindow`)와 같은 **풀스크린 오버레이** 방식이다(라우트 아님).
 *
 * 시안에 내비가 구워져 있어서 React 내비를 겹쳐 올리지 않고 **투명 히트영역만** 얹는다.
 * 겹쳐 올리면 내비가 두 겹으로 보이고, 구워진 쪽의 「헬스장」 활성 표시도 가려진다.
 */
export function GymScreen({
  assignments = [],
  onSelectNav,
  onStart,
}: {
  /** 밀려 있는 오답 과제 — **오래된 순**으로 들어온다 */
  assignments?: StudentAssignment[]
  onSelectNav?: (id: MainHomeNavTabId) => void
  onStart?: (assignment: StudentAssignment) => void
}) {
  // 여러 개 쌓여 있으면 **먼저 낸 것부터** 푼다(사용자 지정 2026-08-11)
  const next = assignments[0] ?? null
  const waitingExtra = Math.max(0, assignments.length - 1)
  const [readyToStart, setReadyToStart] = useState(false)
  const startStats = useMemo(() => {
    if (!next) return { wrongCount: 0, estimatedMinutes: 0 }
    const questionIds = listSectionQuestionIds(
      buildAssignmentSections(next.contentSnapshot),
    )
    return {
      wrongCount: questionIds.length,
      estimatedMinutes: estimateMinutesForQuestionIds(questionIds),
    }
  }, [next])

  useEffect(() => {
    if (!next) setReadyToStart(false)
  }, [next])

  const asset = !next
    ? GYM_EMPTY_ASSET
    : readyToStart
      ? GYM_START_ASSET
      : GYM_ASSET

  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="헬스장"
    >
      <img
        src={asset}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full max-w-none select-none object-fill"
      />

      {next && !readyToStart ? (
        <>
          <button
            type="button"
            aria-label={`오답 다시 풀기 · ${next.title}${
              waitingExtra > 0 ? ` 외 ${waitingExtra}개 대기` : ''
            }`}
            onClick={() => {
              playTapSfx()
              setReadyToStart(true)
            }}
            className="absolute z-10 cursor-pointer bg-transparent"
            style={gymRectStyle(GYM_CHARACTER_HIT)}
          />
        </>
      ) : null}

      {next && readyToStart ? (
        <>
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => {
              playTapSfx()
              setReadyToStart(false)
            }}
            className="absolute z-20 cursor-pointer bg-transparent"
            style={gymRectStyle(GYM_START_BACK_HIT)}
          />
          <button
            type="button"
            aria-label={`지금 시작하기 · 틀린 문항 ${startStats.wrongCount}문제 · 예상 시간 ${startStats.estimatedMinutes}분`}
            onClick={() => {
              playTapSfx()
              onStart?.(next)
            }}
            className="absolute z-20 cursor-pointer bg-transparent"
            style={gymRectStyle(GYM_START_CTA_HIT)}
          />
          {/* 시안 데모 단원·제목을 가리고 실제 출제 정보를 올린다 */}
          <div
            className="pointer-events-none absolute z-[21] flex items-center justify-center overflow-hidden rounded-full bg-white"
            style={gymRectStyle(GYM_START_BADGE)}
            aria-hidden
          >
            <span className="text-[12px] font-semibold leading-none text-[#2F80ED]">
              오답 풀기
            </span>
          </div>
          <div
            className="pointer-events-none absolute z-[21]"
            style={{
              ...gymRectStyle(GYM_START_TITLE_MASK),
              background: GYM_START_CARD_BLUE,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute z-[22] flex items-center overflow-hidden"
            style={gymRectStyle(GYM_START_TITLE)}
          >
            <p className="line-clamp-2 text-[22px] font-bold leading-tight text-white">
              {gymStartHeading(next.contentSnapshot)}
            </p>
          </div>
          <div
            className="pointer-events-none absolute z-[21]"
            style={{
              ...gymRectStyle(GYM_START_METRICS_MASK),
              background: GYM_START_CARD_BLUE,
            }}
            aria-hidden
          />
          <dl
            className="pointer-events-none absolute z-[22] grid grid-cols-2"
            style={gymRectStyle(GYM_START_METRICS)}
          >
            <GymStartMetric
              value={`${startStats.wrongCount}문제`}
              label="틀린 문항"
            />
            <GymStartMetric
              value={`${startStats.estimatedMinutes}분`}
              label="예상 시간"
            />
          </dl>
        </>
      ) : null}

      {!next ? (
        <>
          {/* 시안 가짜 시계 — OS 상태바와 두 겹이 되지 않게 가림 */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[14] bg-white"
            style={{ height: `${(GYM_EMPTY_STATUS_BAR_H / FRAME_H) * 100}%` }}
            aria-hidden
          />
          <button
            type="button"
            aria-label="홈으로 가기"
            onClick={() => {
              playTapSfx()
              onSelectNav?.('home')
            }}
            className="absolute z-10 cursor-pointer bg-transparent"
            style={gymRectStyle(GYM_EMPTY_HOME_HIT)}
          />
        </>
      ) : null}

      <GymNavHits onSelectNav={onSelectNav} />
    </div>
  )
}

function GymStartMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="relative">
      <dd className="text-[22px] font-bold leading-none text-white">{value}</dd>
      <dt
        className="absolute top-[28px] text-[12px] leading-none"
        style={{ color: GYM_START_METRIC_LABEL_COLOR }}
      >
        {label}
      </dt>
    </div>
  )
}
