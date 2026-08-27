import { useEffect, useState } from 'react'

import { MainHomeBottomNav } from '../main-home/MainHomeBottomNav'
import {
  FRAME_H,
  FRAME_W,
  NAV_H,
  type MainHomeNavTabId,
} from '../main-home/assignment-home'
import { BackButtonOverlay } from '../navigation/BackButtonOverlay'
import { resolveActiveClassId } from '../../lib/sync/student-api'
import { isSyncEnabled } from '../../lib/sync/supabase-client'
import { fetchReviewAnswers } from '../../lib/sync/review-api'
import type { ContentSnapshot } from '../../lib/sync/types'
import {
  buildReviewSession,
  type ReviewSession,
} from '../../features/review/build-review-session'
import {
  summarizeReviewTypes,
  wrongRateTone,
  TARGET_ACCURACY_PERCENT,
  MIN_ANSWERED_FOR_REVIEW,
  type ReviewAnswerInput,
  type ReviewSummary,
  type ReviewTypeStat,
} from '../../features/review/review-stats'
import { loadReviewPracticeAnswers } from '../../features/review/review-practice-answers'
import { loadReviewedAt } from '../../features/review/reviewed-categories'
import { useStudyStreak } from '../../features/review/use-study-streak'
import { StudyStreakPill } from './StudyStreakPill'
import { ReviewStreakCard } from './ReviewStreakCard'
import {
  REVIEW_CARD,
  REVIEW_CARD_FONT,
  REVIEW_CAT_CHEER_ASSET,
  REVIEW_CAT_READING_ASSET,
  REVIEW_COLORS,
} from './review-main'

/**
 * 뒤로가기 히트 **바로 아래**에 제목 (옆이 아님).
 * `padding-top` %는 높이 기준이 아니라 **너비** 기준(CSS)이라 FRAME_W로 나눈다.
 */
const REVIEW_CONTENT_PAD_TOP_PCT =
  // 뒤로가기를 좌상단으로 옮겨도(2026-08-10) 본문은 제자리에 둔다 —
  // 따라 올라가면 복습 목록 전체가 62px 위로 밀린다. 예전 값(68+44+2)을 고정.
  (114 / FRAME_W) * 100

const EMPTY_SUMMARY: ReviewSummary = {
  recommended: null,
  unitStats: [],
  grammarStats: [],
}


type ReviewMainWindowProps = {
  onSelectNav: (id: MainHomeNavTabId) => void
  /** 분류의 전체 문항으로 복습 세션 시작 */
  onStartReview?: (session: ReviewSession) => void
}

export type ReviewLoadState =
  | { phase: 'loading' }
  | {
      phase: 'ready'
      summary: ReviewSummary
      hasRecords: boolean
      answers: ReviewAnswerInput[]
      snapshots: ContentSnapshot[]
    }
  | { phase: 'offline' }

/**
 * 복습하기 화면.
 *
 * 학생이 푼 모든 답안을 분류별로 묶어 보여준다 — 단어·문장은 **단원별**, 문법은 **개념별**.
 * 맨 위 「오늘의 맞춤 복습」 카드가 1개를 추천하고, 아래는 골라 들어갈 수 있는 전체 목록이다.
 *
 * 시안 이미지를 덮지 않고 직접 그린다 — 이유는 `review-main.ts` 주석 참고.
 */
export function ReviewMainWindow({
  onSelectNav,
  onStartReview,
}: ReviewMainWindowProps) {
  const [state, setState] = useState<ReviewLoadState>({ phase: 'loading' })
  /**
   * 화면 안에서 잠깐 띄우는 안내.
   *
   * 예전에는 `window.alert`이었다. 앱 안에서 브라우저 알럿은 이질적이고,
   * 웹뷰로 감싸면 위에 도메인 이름까지 같이 뜬다. 확인을 누르기 전까지 화면 전체가
   * 멈추기도 한다 — 「다시 시도해 보세요」 한 줄에 그만한 무게가 필요하지 않다.
   */
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!isSyncEnabled()) {
        if (!cancelled) setState({ phase: 'offline' })
        return
      }

      const classId = await resolveActiveClassId()
      if (cancelled) return
      if (!classId) {
        setState({
          phase: 'ready',
          summary: EMPTY_SUMMARY,
          hasRecords: false,
          answers: [],
          snapshots: [],
        })
        return
      }

      const { answers, snapshots } = await fetchReviewAnswers(classId)
      if (cancelled) return

      // 복습 연습 결과를 합친다 — 서버 answers보다 새면 오답률·추천 카드가 바뀐다
      const mergedAnswers = [
        ...answers,
        ...loadReviewPracticeAnswers(classId, [
          ...snapshots,
          ...answers.map((answer) => answer.snapshot),
        ]),
      ]

      setState({
        phase: 'ready',
        summary: summarizeReviewTypes(
          mergedAnswers,
          loadReviewedAt(classId),
          snapshots,
        ),
        hasRecords: answers.length > 0 || mergedAnswers.length > 0,
        answers: mergedAnswers,
        snapshots,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const handleStart = (stat: ReviewTypeStat) => {
    if (!onStartReview || state.phase !== 'ready') return
    const session = buildReviewSession(
      state.answers,
      stat.category,
      stat.label,
      state.snapshots,
    )
    if (!session || session.questionIds.length === 0) {
      setNotice('이 분류에서 다시 풀 문제를 찾지 못했어요. 잠시 후 다시 시도해 주세요.')
      return
    }
    onStartReview(session)
  }

  // 하단 내비는 absolute라 자리를 차지하지 않는다. 본문이 그 아래로 숨지 않도록
  // 내비 높이만큼 비워 둔다 (기존 이미지 오버레이가 쓰던 계산 그대로).
  const bodyBottomPct = (NAV_H / FRAME_H) * 100

  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden"
      style={{ background: REVIEW_COLORS.pageBg }}
      role="dialog"
      aria-modal="true"
      aria-label="복습하기"
    >
      <div
        className="absolute inset-x-0 top-0"
        style={{ bottom: `${bodyBottomPct}%` }}
      >
        <ReviewMainContent state={state} onStart={handleStart} />
      </div>

      {/* 메인·설정과 동일 — 위 시계/아이콘, 그 아래 `<` */}
      {/* 호출 측 useBackNavigation이 닫기를 담당 · 자리는 BACK_BUTTON_HIT(시계 아래) */}
      <BackButtonOverlay variant="labeled" />

      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-5 z-[60] flex justify-center"
          style={{ bottom: `${bodyBottomPct + 3}%` }}
        >
          <p className="max-w-full rounded-xl bg-[#1E242F]/92 px-4 py-3 text-center font-sans text-[14px] font-semibold leading-snug text-white shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
            {notice}
          </p>
        </div>
      ) : null}

      <MainHomeBottomNav activeId="review" onSelect={(id) => onSelectNav(id)} />
    </div>
  )
}

/**
 * 하단 내비를 뺀 본문. 데이터 로딩과 분리해 두어 시안 대조용 미리보기에서 그대로 쓸 수 있다.
 */
export function ReviewMainContent({
  state,
  onStart,
}: {
  state: ReviewLoadState
  onStart?: (stat: ReviewTypeStat) => void
}) {
  const summary = state.phase === 'ready' ? state.summary : EMPTY_SUMMARY
  const streak = useStudyStreak()
  const top = summary.recommended

  return (
    <div
      className="h-full overflow-y-auto overscroll-y-contain px-5 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ paddingTop: `${REVIEW_CONTENT_PAD_TOP_PCT}%` }}
    >
      {/*
        알약을 제목 아래가 아니라 **같은 줄 오른쪽**에 둔다. 스트릭은 별도 조회라 본문보다 늦게
        올 수 있는데, 흐름에 넣으면 도착하는 순간 아래 카드가 밀린다. 여기에 두면 제목은 그대로고
        `min-h`가 줄 높이를 미리 잡아 둬서 나타나도 아무것도 움직이지 않는다.
        복습할 게 없는 날에도 띄운다 — 습관에 대한 칭찬이라 목록 유무와 무관하다.
      */}
      <div className="flex min-h-[34px] items-center justify-between gap-3">
        <h1
          className="text-[26px] font-bold tracking-tight"
          style={{ color: REVIEW_COLORS.text }}
        >
          복습하기
        </h1>
        <StudyStreakPill streak={streak} />
      </div>

      {state.phase === 'loading' ? (
        <ReviewSkeleton />
      ) : state.phase === 'offline' ? (
        <ReviewEmpty
          title="서버 연결이 없어요"
          body="복습 기록을 불러오려면 인터넷 연결이 필요해요."
        />
      ) : top ? (
        <>
          <TodayReviewCard stat={top} onStart={onStart} />
          <ReviewStreakCard streak={streak} />

          {/*
            추천 1개는 아래 목록에서 빼지 않는다 — 단원별 목록은 순위표가 아니라 「골라 들어가는」
            목록이라, 추천된 단원만 빠지면 단원 번호 사이에 구멍이 생겨서 오히려 헷갈린다.
          */}
          <ReviewSection
            title="단원별"
            stats={summary.unitStats}
            onStart={onStart}
          />
          <ReviewSection
            title="문법"
            stats={summary.grammarStats}
            onStart={onStart}
          />
        </>
      ) : state.hasRecords ? (
        <ReviewEmpty
          title="지금은 복습할 게 없어요"
          body={`${MIN_ANSWERED_FOR_REVIEW}문항 이상 푼 단원·문법 중에 틀린 게 없어요. 아주 잘하고 있어요!`}
        />
      ) : (
        <ReviewEmpty
          title="아직 복습할 기록이 없어요"
          body="과제를 풀고 나면 자주 틀리는 단원을 모아서 알려드릴게요."
        />
      )}
    </div>
  )
}

/**
 * 「단원별」 / 「문법」 구역. 두 목록은 기준이 달라서(단원 vs 개념) 한 목록에 섞으면
 * 무슨 기준으로 나열된 건지 읽히지 않는다 — 헤더로 갈라 둔다.
 */
function ReviewSection({
  title,
  stats,
  onStart,
}: {
  title: string
  stats: ReviewTypeStat[]
  onStart?: (stat: ReviewTypeStat) => void
}) {
  if (stats.length === 0) return null

  return (
    <>
      <h2
        className="mt-5 mb-3 text-[19px] font-bold"
        style={{ color: REVIEW_COLORS.text }}
      >
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {stats.map((stat) => (
          <li key={stat.key}>
            <ReviewListCard stat={stat} onStart={onStart} />
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * 1순위 유형 — 파란 카드. 시안 `Rectangle.svg` 좌표 그대로 (`REVIEW_CARD`).
 * 세로 위치는 절대 배치로 고정하고, 가로만 카드 폭에 맞춰 늘어난다.
 */
function TodayReviewCard({
  stat,
  onStart,
}: {
  stat: ReviewTypeStat
  onStart?: (stat: ReviewTypeStat) => void
}) {
  const c = REVIEW_CARD

  return (
    <section
      className="relative mt-2 w-full overflow-hidden shadow-[0_8px_24px_rgba(36,160,255,0.25)]"
      style={{
        height: c.height,
        borderRadius: c.radius,
        background: REVIEW_COLORS.card,
      }}
      aria-label={`오늘의 맞춤 복습 ${stat.label} · 최근 가장 많이 틀렸어요`}
    >
      {/* 고양이 — 흰 원 밖으로 책·효과선이 삐져나온다 (시안 그대로) */}
      <span
        aria-hidden
        className="absolute rounded-full bg-white"
        style={{ top: c.circle.top, right: c.circle.right, width: c.circle.size, height: c.circle.size }}
      />
      <img
        src={REVIEW_CAT_READING_ASSET}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute max-w-none select-none object-contain"
        style={{
          top: c.circle.top + c.catImage.offsetY,
          right: c.circle.right - (c.catImage.width - c.circle.size) - c.catImage.offsetX,
          width: c.catImage.width,
          height: c.catImage.height,
        }}
      />

      <p
        className="absolute truncate font-semibold leading-none text-white/85"
        style={{
          fontSize: REVIEW_CARD_FONT.eyebrow,
          top: c.eyebrowTop,
          left: c.padX,
          maxWidth: `calc(100% - ${c.padX + c.circle.right + c.circle.size + 8}px)`,
        }}
      >
        오늘의 맞춤 복습
      </p>
      <p
        className="absolute truncate font-bold leading-none text-white"
        style={{
          fontSize: REVIEW_CARD_FONT.typeName,
          top: c.typeNameTop,
          left: c.padX,
          // 고양이 원을 침범하지 않도록
          maxWidth: `calc(100% - ${c.padX + c.circle.right + c.circle.size + 8}px)`,
        }}
      >
        {stat.label}
      </p>
      <p
        className="absolute leading-none text-white"
        style={{
          fontSize: REVIEW_CARD_FONT.subtitle,
          top: c.subtitleTop,
          left: c.padX,
        }}
      >
        최근 가장 많이 틀렸어요
      </p>

      <span
        aria-hidden
        className="absolute h-[2px] rounded-full bg-white/40"
        style={{ top: c.dividerTop, left: c.padX, right: c.padX }}
      />

      <dl
        className="absolute grid grid-cols-3"
        style={{ top: c.metricValueTop, left: c.padX, right: c.padX }}
      >
        {/* 오답 수가 아니라 분류 전체 문항 수 — 복습은 그 분류를 통째로 다시 푼다 */}
        <ReviewMetric value={`${stat.questionTotal}문제`} label="복습 문제" />
        <ReviewMetric value={`${stat.estimatedMinutes}분`} label="예상 시간" />
        <ReviewMetric value={`${TARGET_ACCURACY_PERCENT}%`} label="목표 정확도" />
      </dl>

      <button
        type="button"
        aria-label={`${stat.label} 복습 지금 시작하기`}
        onClick={() => onStart?.(stat)}
        className="absolute flex items-center justify-center gap-2 rounded-full bg-white font-bold active:opacity-90"
        style={{
          fontSize: REVIEW_CARD_FONT.button,
          top: c.buttonTop,
          left: c.padX,
          right: c.padX,
          height: c.buttonHeight,
          color: REVIEW_COLORS.cardButtonText,
        }}
      >
        지금 시작하기
        <span aria-hidden className="leading-none" style={{ fontSize: REVIEW_CARD_FONT.button + 1 }}>
          →
        </span>
      </button>
    </section>
  )
}

function ReviewMetric({ value, label }: { value: string; label: string }) {
  const c = REVIEW_CARD
  return (
    <div className="relative">
      <dd
        className="font-bold leading-none text-white"
        style={{ fontSize: REVIEW_CARD_FONT.metricValue }}
      >
        {value}
      </dd>
      <dt
        className="absolute leading-none text-white"
        style={{
          fontSize: REVIEW_CARD_FONT.metricLabel,
          top: c.metricLabelTop - c.metricValueTop,
        }}
      >
        {label}
      </dt>
    </div>
  )
}

/**
 * 목록 한 칸 — 흰 카드 + 좌측 강조선 + 오답률 막대.
 *
 * 시안에는 `2순위` 뱃지가 있었지만 뺐다. 목록이 4칸짜리 순위표에서 전체 단원 목록으로 바뀌어
 * (단원 8개 × 단어/문장 + 문법 개념 = 20칸 안팎) 순위 번호가 의미를 잃었다.
 */
function ReviewListCard({
  stat,
  onStart,
}: {
  stat: ReviewTypeStat
  onStart?: (stat: ReviewTypeStat) => void
}) {
  const tone = wrongRateTone(stat.wrongPercent)
  const barColor =
    tone === 'low' ? REVIEW_COLORS.toneLowBar : REVIEW_COLORS.toneHighBar
  const textColor =
    tone === 'low' ? REVIEW_COLORS.toneLowText : REVIEW_COLORS.toneHighText

  return (
    <button
      type="button"
      aria-label={`${stat.label} 복습 시작하기 · 오답율 ${stat.wrongPercent}퍼센트 · ${stat.questionTotal}문항`}
      onClick={() => onStart?.(stat)}
      className="relative w-full overflow-hidden rounded-2xl bg-white px-4 py-4 text-left shadow-[0_2px_10px_rgba(33,38,51,0.06)] active:opacity-95"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[5px]"
        style={{ background: barColor }}
      />

      <div className="flex items-center gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[18px] font-bold"
            style={{ color: REVIEW_COLORS.text }}
          >
            {stat.label}
          </p>
          <p
            className="mt-0.5 text-[14px] font-semibold"
            style={{ color: textColor }}
          >
            오답율 {stat.wrongPercent}%
          </p>
        </div>

        <div
          className="shrink-0 text-right text-[13px] leading-snug"
          style={{ color: REVIEW_COLORS.textMuted }}
        >
          <p>{stat.estimatedMinutes}분</p>
          <p>{stat.questionTotal}문항</p>
        </div>
      </div>

      <div
        className="mt-3 ml-2 h-[7px] overflow-hidden rounded-full"
        style={{ background: REVIEW_COLORS.track }}
        aria-hidden
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${Math.max(stat.wrongPercent, 3)}%`,
            background: barColor,
          }}
        />
      </div>
    </button>
  )
}

function ReviewEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-8 flex flex-col items-center px-6 text-center">
      <img
        src={REVIEW_CAT_CHEER_ASSET}
        alt=""
        aria-hidden
        draggable={false}
        className="h-[120px] w-[120px] select-none object-contain"
      />
      <p
        className="mt-4 text-[19px] font-bold"
        style={{ color: REVIEW_COLORS.text }}
      >
        {title}
      </p>
      <p
        className="mt-2 text-[14px] leading-relaxed"
        style={{ color: REVIEW_COLORS.textMuted }}
      >
        {body}
      </p>
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="sr-only">복습 기록을 불러오는 중이에요</span>
      <div className="mt-2 h-[280px] w-full animate-pulse rounded-3xl bg-white/70" />
      <div className="mt-5 h-[104px] w-full animate-pulse rounded-2xl bg-white/70" />
      <div className="mt-3 h-[104px] w-full animate-pulse rounded-2xl bg-white/70" />
    </div>
  )
}
