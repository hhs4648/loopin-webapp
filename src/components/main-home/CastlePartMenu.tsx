import { framePx } from './assignment-home'
import type { PartCompleteKind } from '../part-complete/part-complete'
import { resolvePartLabel } from '../part-complete/part-complete'
import type { AssignmentPartSummary } from '../../features/assignments/assignment-parts'

/**
 * 성을 탭하면 그 위에 뜨는 **파트별 입장** 카드.
 *
 * 시안 `파트 입장.svg`(카드 129×129)의 구성을 따르되 **이미지를 깔지 않고 React로 그린다.**
 * 시안은 글자가 전부 벡터 path로 아웃라인화돼 있어(`<text>` 0개) 파트명·문항수를 바꿔 넣을 수
 * 없고, 이미지 위에 글씨를 덧그리면 `docs/uiux.md`의 「이미지 위 텍스트 중복 렌더 금지」에 걸린다.
 *
 * 크기는 시안보다 키웠다(글씨가 작았다). 다만 한 줄에 「단어 1파트 · 12문항」을 다 넣으려면
 * 카드가 210은 돼야 해서, **파트명과 문항수를 두 줄로 쌓아** 폭을 172까지 줄였다.

 */

/** 카드 폭. 프레임(393) 기준 px — 시안보다 키웠다가 다시 살짝 줄임(2026-08-10) */
const CARD_W = 152
/** 카드 안쪽 좌우 여백 */
const PAD = 8
/** 줄 간격(세로) — 너무 붙지 않게 살짝 띄움 */
const ROW_H = 32
/** 첫 줄 알약의 카드 기준 y — 위쪽 마감 문구와 파트 사이 여백 */
const FIRST_ROW_Y = 40
/**
 * 알약 — **글자에 맞춘 고정 크기**.
 * 좁아진 카드(152)에 맞춰 70×22. 10px 「점수 보기」가 들어간다.
 */
const PILL = { w: 70, h: 22 } as const
/** 파트명과 알약 사이 가로 간격 */
const LABEL_GAP = 8
/** 한 줄 콘텐츠 높이 */
const ROW_BOX_H = 30
/** 마지막 줄 아래 여백 */
const BOTTOM_PAD = 8

/**
 * 글자 크기를 **프레임 폭에 비례**시킨다.
 *
 * 카드·알약은 %로 그려서 화면이 393→540으로 넓어지면 같이 커지는데, 글자만 px 고정이면
 * 넓은 화면에서 카드만 커지고 글씨는 그대로라 **빈 공간이 생긴다**(2026-08-10 실제 화면에서 확인).
 * 아래 값은 **393px 기준 px**이고, 실제로는 그 비율을 유지한 채 540px까지 같이 커진다.
 */
/** 393 기준 크기 → 프레임 폭 비례 (공식은 `assignment-home.ts` 한 곳) */
const fs = framePx

/**
 * 393px 기준 크기 — `fs()`가 화면 폭에 맞춰 키운다.
 *
 * - 마감: 12px
 * - 파트명·문항수·알약 글자: 10px (2026-08-10 — 기존 대비 2px 축소)
 */
const FONT = { deadline: 12, label: 10, sub: 10, pill: 10 } as const

export type CastlePartMenuItem = {
  summary: AssignmentPartSummary
  completed: boolean
}

/** 카드 전체 높이 — 줄 수에 따라 줄어든다 */
export function castlePartMenuHeight(
  rowCount: number,
  showScoreRow: boolean,
): number {
  const rows = Math.max(1, rowCount) + (showScoreRow ? 1 : 0)
  return FIRST_ROW_Y + ROW_H * (rows - 1) + PILL.h + BOTTOM_PAD
}

export const CASTLE_PART_MENU_WIDTH = CARD_W

/** `2026-08-12` → `8월 12일`. 파싱 실패 시 null */
function formatDeadlineDay(isoDate: string | undefined): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((isoDate ?? '').trim())
  if (!match) return null
  return `${Number(match[2])}월 ${Number(match[3])}일`
}

/**
 * 상단 마감 문구.
 *
 * 날짜는 **교사 웹에서 지정한 마감일**(`deadlineDate`)이다. 마이그레이션 007 이전에
 * 만들어진 과제에는 그 값이 없어서 수업일로 대체한다 — 둘이 다른 과제에서는 실제 마감보다
 * 이르게 보일 수 있다. 시간(HH:MM)은 한 줄에 안 들어가서 넣지 않았다.
 */
export function resolveDeadlineNote(assignment: {
  deadlineDate?: string
  deadlineUntilNextLesson?: boolean
  lessonDate: string
}): string {
  // 「다음 수업 전까지 할 수 있어요」는 161px로 헤더칸(154)을 넘어 짧게 쓴다
  if (assignment.deadlineUntilNextLesson) return '다음 수업 전까지예요'
  const day =
    formatDeadlineDay(assignment.deadlineDate) ??
    formatDeadlineDay(assignment.lessonDate)
  return day ? `${day}까지 할 수 있어요` : '기한 안에 풀어 주세요'
}

export function CastlePartMenu({
  deadlineNote,
  assignmentTitle,
  items,
  showScoreRow,
  onEnterPart,
  onOpenScore,
  style,
}: {
  deadlineNote: string
  /** 파트 이름을 뽑아낼 원본 제목 — 선생님이 붙인 「단어 1파트」를 그대로 쓴다 */
  assignmentTitle: string
  items: CastlePartMenuItem[]
  /** 모든 파트를 다 풀었을 때만 true — 「점수 보기」 줄을 붙인다 */
  showScoreRow: boolean
  onEnterPart: (part: PartCompleteKind) => void
  onOpenScore: () => void
  style?: React.CSSProperties
}) {
  const totalHeight = castlePartMenuHeight(items.length, showScoreRow)

  return (
    <div
      className="absolute z-[46] select-none"
      style={style}
      role="dialog"
      aria-label="파트 선택"
    >
      <div
        className="relative h-full w-full rounded-[11px] bg-white shadow-[0_4px_16px_rgba(24,27,31,0.18)]"
        // 카드 밖(맵)을 눌러야 닫히도록, 카드 안 클릭은 막는다
        onClick={(event) => event.stopPropagation()}
      >
        {/* 마감 문구는 파랑 — 카드 안 알약(`#4F91EB`)과 같은 톤으로 맞춘다 */}
        <p
          className="absolute truncate font-['Pretendard',sans-serif] font-bold text-[#4F91EB]"
          style={{
            left: `${(PAD / CARD_W) * 100}%`,
            right: `${(PAD / CARD_W) * 100}%`,
            top: `${(11 / totalHeight) * 100}%`,
            fontSize: fs(FONT.deadline),
            lineHeight: 1.2,
          }}
        >
          {deadlineNote}
        </p>

        {items.map((item, index) => (
          <PartRow
            key={item.summary.part}
            index={index}
            totalHeight={totalHeight}
            label={resolvePartLabel(item.summary.part, assignmentTitle)}
            sub={`${item.summary.questionTotal}문항`}
            actionLabel={item.completed ? '완료' : '입장하기'}
            disabled={item.completed}
            onPress={() => onEnterPart(item.summary.part)}
          />
        ))}

        {showScoreRow ? (
          <PartRow
            index={items.length}
            totalHeight={totalHeight}
            label="모두 완료"
            actionLabel="점수 보기"
            onPress={onOpenScore}
            tone="score"
          />
        ) : null}

      </div>
    </div>
  )
}

function PartRow({
  index,
  totalHeight,
  label,
  sub,
  actionLabel,
  disabled = false,
  onPress,
  tone = 'enter',
}: {
  index: number
  totalHeight: number
  label: string
  sub?: string
  actionLabel: string
  disabled?: boolean
  onPress: () => void
  tone?: 'enter' | 'score'
}) {
  const top = FIRST_ROW_Y + ROW_H * index
  const pct = (value: number) => `${(value / totalHeight) * 100}%`

  /* 파트명은 왼쪽, 알약은 오른쪽 정렬 — 줄마다 버튼이 같은 세로줄에 맞춰진다. */
  return (
    <div
      className="absolute flex items-center"
      style={{
        left: `${(PAD / CARD_W) * 100}%`,
        right: `${(PAD / CARD_W) * 100}%`,
        top: pct(top - (ROW_BOX_H - PILL.h) / 2),
        height: pct(ROW_BOX_H),
        gap: LABEL_GAP,
        justifyContent: 'space-between',
      }}
    >
      <span className="min-w-0 flex-1">
        <span
          className="block truncate font-['Pretendard',sans-serif] font-bold text-[#181B1F]"
          style={{ fontSize: fs(FONT.label), lineHeight: 1.1 }}
        >
          {label}
        </span>
        {sub ? (
          <span
            className="block truncate font-['Pretendard',sans-serif] font-medium text-[#808287]"
            style={{ fontSize: fs(FONT.sub), lineHeight: 1.1, marginTop: 1 }}
          >
            {sub}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onPress}
        className={`flex shrink-0 items-center justify-center rounded-full font-['Pretendard',sans-serif] font-bold whitespace-nowrap leading-none ${
          disabled
            ? 'bg-[#EDEFF2] text-[#808287]'
            : tone === 'score'
              ? 'bg-[#2F80ED] text-white active:opacity-90'
              : 'bg-[#4F91EB] text-white active:opacity-90'
        }`}
        style={{
          width: `${(PILL.w / (CARD_W - PAD * 2)) * 100}%`,
          /*
            높이는 **줄(ROW_BOX_H) 기준** %여야 한다.
            예전에 카드 전체 높이(totalHeight) 기준 %를 넣었더니, 실제 기준 박스가 줄이라
            알약이 4~5px짜리 파란 띠로 찌그러지고 글자가 잘렸다(2026-08-10).
          */
          height: `${(PILL.h / ROW_BOX_H) * 100}%`,
          fontSize: fs(FONT.pill),
        }}
      >
        {actionLabel}
      </button>
    </div>
  )
}
