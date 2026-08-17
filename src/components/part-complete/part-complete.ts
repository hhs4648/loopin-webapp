import { stripGradeClassFromTitle } from '../../lib/sync/assignment-title'

export const FRAME_W = 393
export const FRAME_H = 852

/**
 * Figma `문장,문법 완료화면` — 원본 523×1134.
 * 523:1134 = 393:852 이므로 viewBox만 그대로 두고 width/height를 프레임에 맞춘다.
 * 문장 파트·문법 파트가 같은 시안을 공유한다 (점수·정답수·배지만 다름).
 *
 * **점수대별로 시안이 3장이다** (2026-08-06). 배경·캐릭터·격려 문구가 다르고
 * 배지·점수·버튼 좌표는 세 장 모두 동일하다 — 오버레이 rect는 그대로 쓴다.
 */
export const PART_COMPLETE_ASSETS = {
  /** 80점 이상 — 색종이 배경 + 엄지척 */
  high: '/assets/sentence-grammar-complete-high.svg?v=1',
  /** 50점 이상 80점 미만 — 구름 배경 + 시무룩 */
  mid: '/assets/sentence-grammar-complete-mid.svg?v=1',
  /** 50점 미만 — 빗방울 배경 + 우는 표정 */
  low: '/assets/sentence-grammar-complete-low.svg?v=1',
} as const

export type PartCompleteTone = keyof typeof PART_COMPLETE_ASSETS

/** 점수 → 시안 3종 중 하나. 격려 문구도 같은 경계를 쓴다. */
export function partCompleteToneForScore(score: number): PartCompleteTone {
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

export function partCompleteAssetForScore(score: number): string {
  return PART_COMPLETE_ASSETS[partCompleteToneForScore(score)]
}

/** 배경 그라데이션 — 마스크를 배경색으로 위장할 때 사용 */
export const PART_COMPLETE_BG_GRADIENT =
  'linear-gradient(to bottom, #E3F1FF 0%, #F9FDFF 100%)'

/**
 * 파트 완료 배지 자리.
 * 시안 rect `x=155.7 y=74.5 w=191.3 h=42.5`(523×1134) → 393×852.
 * 에셋 「1파트 완료」알약을 React 배지(교사 부여명)로 덮는다.
 * **반드시 이 폭을 minWidth로 쓰고 안쪽은 justify-center** — 안 그러면 베이크
 * 파란 바탕이 오른쪽에 남아 글자가 왼쪽으로 치우쳐 보인다.
 */
export const PART_COMPLETE_BADGE = { x: 117, y: 56, w: 143.7, h: 32 }

/** 베이크된 점수·격려·정답요약 문구를 통째로 가리는 영역 */
export const PART_COMPLETE_TEXT_MASK = { x: 20, y: 468, w: 353, h: 196 }

/** 점수 「90점」 */
export const PART_COMPLETE_SCORE = { x: 20, y: 470, w: 353, h: 90 }

/** 격려 문구 「정말 잘했어요!」 */
export const PART_COMPLETE_ENCOURAGE = { x: 20, y: 597, w: 353, h: 30 }

/** 「10문제 중 9개 정답」 */
export const PART_COMPLETE_SUMMARY = { x: 20, y: 632, w: 353, h: 26 }

/** 파란「계속하기」 */
export const PART_COMPLETE_PRIMARY_BTN = { x: 29, y: 757, w: 228, h: 54 }

/** 흰 배경 + 파란 테두리「홈」 */
export const PART_COMPLETE_SECONDARY_BTN = { x: 265, y: 757, w: 99, h: 54 }

export type PartCompleteKind = 'word' | 'sentence' | 'grammar'

export const PART_LABEL: Record<PartCompleteKind, string> = {
  word: '단어',
  sentence: '문장',
  grammar: '문법',
}

/**
 * 파트 완료 배지 문구 = 교사 과제부여 버튼명 + 「 완료」.
 * - 제목에 「단어 1파트」「문장 파트」등이 있으면 그대로 사용
 * - 없으면 「{단어|문장|문법} 파트 완료」(통으로 낸 경우 — 앱이 임의로 N을 매기지 않음)
 */
/**
 * 선생님이 과제에 붙인 파트 이름을 제목에서 뽑는다 — `단어 1파트` / `문장 파트`.
 *
 * 교사 웹은 「단어 1파트」처럼 번호를 붙여 부여할 수 있다(한 단원을 쪼개 낼 때).
 * 앱이 임의로 번호를 매기면 선생님이 부른 이름과 달라지므로 **제목에 있는 번호만** 쓴다.
 * 번호 없이 통으로 냈으면 `단어 파트`.
 */
export function resolvePartLabel(
  part: PartCompleteKind,
  assignmentTitle: string,
): string {
  const kind = PART_LABEL[part]
  const raw = assignmentTitle.trim()
  if (!raw) return `${kind} 파트`

  // 학년·반 접두만 제거한 뒤 파싱 (예: `중3 · 단어 1파트`)
  const title = stripGradeClassFromTitle(raw)

  // 「단어 1파트」「문장파트」「문법  2  파트」등
  const numbered = title.match(new RegExp(`${kind}\s*(\d+)\s*파트`, 'u'))
  if (numbered?.[1]) return `${kind} ${numbered[1]}파트`

  return `${kind} 파트`
}

export function resolvePartCompleteBadgeLabel(
  part: PartCompleteKind,
  assignmentTitle: string,
): string {
  return `${resolvePartLabel(part, assignmentTitle)} 완료`
}

export function calcPartScore(correctCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0
  return Math.round((Math.max(0, correctCount) / totalCount) * 100)
}

/**
 * 점수대별 격려 문구.
 * **시안 3종에 구워진 문구와 글자 그대로 같아야 한다** — 경계도 `partCompleteToneForScore`와 같다.
 * (문구를 바꾸려면 해당 시안 SVG도 같이 바꿔야 한다. 지금은 마스크로 가리고 다시 그리므로
 *  화면상 어긋나진 않지만, 배경·캐릭터가 문구와 따로 놀게 된다.)
 */
export function encouragementForPartScore(score: number): string {
  switch (partCompleteToneForScore(score)) {
    case 'high':
      return '정말 잘했어요!'
    case 'mid':
      return '좋아요, 다음엔 더 올려봐요!'
    case 'low':
      return '속상하죠? 다음엔 더 잘할 수 있어요!'
  }
}

export function formatPartCorrectSummary(
  correctCount: number,
  totalCount: number,
): string {
  return `${totalCount}문제 중 ${Math.max(0, correctCount)}개 정답`
}

export function figmaRectStyle(rect: {
  x: number
  y: number
  w: number
  h: number
}) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

/**
 * 배경 그라데이션과 이어지게 마스크 박스를 위장.
 * 프레임이 최대 540px까지 늘어나므로 px가 아닌 %로 잡아 배율에 따라가게 한다.
 */
export function figmaCamouflageStyle(rect: {
  x: number
  y: number
  w: number
  h: number
}) {
  return {
    ...figmaRectStyle(rect),
    backgroundImage: PART_COMPLETE_BG_GRADIENT,
    backgroundSize: `100% ${(FRAME_H / rect.h) * 100}%`,
    backgroundPosition: `0 ${(rect.y / (FRAME_H - rect.h)) * 100}%`,
  }
}
