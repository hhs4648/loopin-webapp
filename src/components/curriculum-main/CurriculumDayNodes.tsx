import type { ReactElement } from 'react'
import {
  CHECKERED_START_RECT,
  CURRICULUM_CHECKERED_COLS,
  CURRICULUM_CHECKERED_ROWS,
  CURRICULUM_DAY_NODES,
  CURRICULUM_RUNNING_CHARACTER_ASSET,
  CURRICULUM_START_CHARACTER_ASSET,
  DAY_LOCK_BADGE_R,
  DAY_LOCK_BADGE_STROKE,
  DAY_LOCK_BODY,
  DAY_LOCK_ICON_FILL,
  DAY_LOCK_SHACKLE,
  DAY_NODE_STROKE,
  dayLockBadgeRect,
  dayNodeActiveFill,
  dayNodeRect,
  getInProgressDay,
  getWeekLabelStatus,
  isDayUnlocked,
  longMapRectStyle,
  runningCharacterFacesLeft,
  runningCharacterRect,
  START_CHARACTER_RECT,
  CURRICULUM_WEEK_LABELS,
  weekLabelColor,
  weekLabelText,
  WEEK_LABEL_FONT_FAMILY,
  WEEK_LABEL_FONT_SIZE,
  WEEK_LABEL_FONT_WEIGHT,
  type CurriculumDayId,
} from './curriculum-main'

type CurriculumDayNodesProps = {
  completedDays: ReadonlySet<number>
  /** 학습 세션 연동 전 — 해금·미완료 Day 탭 시 완료 처리 */
  onCompleteDay: (day: CurriculumDayId) => void
}

const DIGIT_SIZE = 24
const DIGIT_WEIGHT = 700

/** Figma 4·5주차 베이크 자물쇠와 동일 치수(원 r·스트로크·몸통·고리) */
function DayLockBadge({ cx, cy }: { cx: number; cy: number }) {
  const r = DAY_LOCK_BADGE_R
  const view = r * 2
  const bodyX = r + DAY_LOCK_BODY.ox
  const bodyY = r + DAY_LOCK_BODY.oy
  const shackleCx = r + DAY_LOCK_SHACKLE.ox
  const shackleCy = r + DAY_LOCK_SHACKLE.oy
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${view} ${view}`}
      className="pointer-events-none absolute z-[3] block overflow-visible"
      style={longMapRectStyle(dayLockBadgeRect({ cx, cy }))}
    >
      {/* 회색 원 + 흰 테두리 (filter19 경로와 동일) */}
      <circle cx={r} cy={r} r={r} fill="#D1D6DB" />
      <circle
        cx={r}
        cy={r}
        r={r - DAY_LOCK_BADGE_STROKE / 2}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={DAY_LOCK_BADGE_STROKE}
      />
      {/* 자물쇠: 고리(스트로크 원) + 몸통 사각 — week4 SVG와 동일 */}
      <circle
        cx={shackleCx}
        cy={shackleCy}
        r={DAY_LOCK_SHACKLE.r}
        fill="none"
        stroke={DAY_LOCK_ICON_FILL}
        strokeWidth={DAY_LOCK_SHACKLE.stroke}
      />
      <rect
        x={bodyX}
        y={bodyY}
        width={DAY_LOCK_BODY.w}
        height={DAY_LOCK_BODY.h}
        rx={DAY_LOCK_BODY.rx}
        fill={DAY_LOCK_ICON_FILL}
      />
    </svg>
  )
}

/** 노란 길 높이를 가득 채우는 세로 체크무늬 출발선 */
function CheckeredStartLine() {
  const cols = CURRICULUM_CHECKERED_COLS
  const rows = CURRICULUM_CHECKERED_ROWS
  const cells: ReactElement[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const black = (row + col) % 2 === 0
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={col}
          y={row}
          width={1}
          height={1}
          fill={black ? '#111111' : '#FFFFFF'}
        />,
      )
    }
  }

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute z-[1] block"
      style={longMapRectStyle(CHECKERED_START_RECT)}
    >
      {cells}
    </svg>
  )
}

/**
 * Day 1~15 순차 해금 오버레이.
 * - 길 지그재그: 홀수 주 좌→우(1·2·3), 짝수 주 우→좌(화면상 6·5·4)
 * - 1주차는 항상 활성(빨강) — LONG 베이크 1~3·파란 글로우는 `opacity=0`
 * - 해금 색: 1~3 빨강 · 4~6 주황 · 7~9 노랑 · 10~12 초록 · 13~15 파랑
 * - 이전 주 3 Day 모두 완료 → 다음 주 해금
 * - 잠금 주: LONG 회색 숫자 원 + React 자물쇠 뱃지(원 위)
 * - 캐릭터: 미시작=서 있기 / 진행 중=Day 원 **위** 러닝(짝수 주 좌향) · z는 버튼보다 앞
 * - 주차 라벨: 캐릭터 머리 위에 배치(겹침 방지)
 * - 출발선: 길 높이 채움 · Day 번호판 · 캐릭터 최상위
 */
export function CurriculumDayNodes({
  completedDays,
  onCompleteDay,
}: CurriculumDayNodesProps) {
  const showStartCharacter = completedDays.size === 0
  const inProgressDay = getInProgressDay(completedDays)

  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      {/* 주차 라벨: 시작 #3B6FF5 · 완료 #000000 · 잠금 #8C94A1 */}
      {CURRICULUM_WEEK_LABELS.map((label) => {
        const status = getWeekLabelStatus(label.week, completedDays)
        return (
          <svg
            key={label.week}
            aria-hidden
            className="pointer-events-none absolute z-[3] overflow-visible"
            style={longMapRectStyle(label.rect)}
            viewBox={`0 0 ${label.rect.w} ${label.rect.h}`}
          >
            <text
              x={label.rect.w / 2}
              y={label.rect.h / 2 + 0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fill={weekLabelColor(status)}
              fontSize={WEEK_LABEL_FONT_SIZE}
              fontWeight={WEEK_LABEL_FONT_WEIGHT}
              fontFamily={WEEK_LABEL_FONT_FAMILY}
            >
              {weekLabelText(label.week, status)}
            </text>
          </svg>
        )
      })}

      {/* 잠긴 Day(2·3주차 등) 위 자물쇠 — 1주차는 항상 해금이라 없음 */}
      {CURRICULUM_DAY_NODES.map((node) => {
        if (isDayUnlocked(node.day, completedDays)) return null
        return (
          <DayLockBadge key={`lock-${node.day}`} cx={node.cx} cy={node.cy} />
        )
      })}

      {/* 출발선 — 캐릭터보다 뒤 */}
      <CheckeredStartLine />

      {CURRICULUM_DAY_NODES.map((node) => {
        const unlocked = isDayUnlocked(node.day, completedDays)
        if (!unlocked) return null

        const completed = completedDays.has(node.day)
        const view = node.r * 2

        return (
          <button
            key={node.day}
            type="button"
            aria-label={
              completed
                ? `${node.day}일차 완료`
                : `${node.day}일차 학습 시작`
            }
            aria-disabled={completed}
            className={`pointer-events-auto absolute z-[4] ${
              completed ? 'cursor-default' : 'cursor-pointer'
            }`}
            style={longMapRectStyle(dayNodeRect(node))}
            onClick={() => {
              if (!completed) onCompleteDay(node.day)
            }}
          >
            <svg
              viewBox={`0 0 ${view} ${view}`}
              className="block h-full w-full"
              aria-hidden
            >
              <circle
                cx={node.r}
                cy={node.r}
                r={node.r - DAY_NODE_STROKE / 2}
                fill={dayNodeActiveFill(node.day)}
                stroke="#FFFFFF"
                strokeWidth={DAY_NODE_STROKE}
              />
              <text
                x={node.r}
                y={node.r + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#FFFFFF"
                fontSize={DIGIT_SIZE}
                fontWeight={DIGIT_WEIGHT}
                fontFamily="Pretendard, system-ui, sans-serif"
              >
                {node.day}
              </text>
            </svg>
          </button>
        )
      })}

      {showStartCharacter ? (
        <img
          src={CURRICULUM_START_CHARACTER_ASSET}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute z-[5] object-contain object-bottom select-none"
          style={longMapRectStyle(START_CHARACTER_RECT)}
        />
      ) : null}

      {inProgressDay != null ? (
        <img
          src={CURRICULUM_RUNNING_CHARACTER_ASSET}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute z-[5] object-contain object-bottom select-none"
          style={{
            ...longMapRectStyle(runningCharacterRect(inProgressDay)),
            transform: runningCharacterFacesLeft(inProgressDay)
              ? 'scaleX(-1)'
              : undefined,
          }}
        />
      ) : null}
    </div>
  )
}
