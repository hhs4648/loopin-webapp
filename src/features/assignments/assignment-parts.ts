/**
 * 과제를 **단어 / 문장 / 문법** 파트로 가르는 공용 규칙.
 *
 * 러너(`AssignmentRunnerScreen`)가 파트 완료 화면을 끼우는 기준과 **같은 함수**를 써야 한다.
 * 둘이 갈리면 맵의 「파트별 입장하기」가 여는 파트와 러너가 실제로 푸는 파트가 어긋난다.
 */

import type { PartCompleteKind } from '../../components/part-complete/part-complete'
import {
  buildAssignmentSections,
  countSectionQuestions,
  listSectionQuestionIds,
  type AssignmentSection,
} from './build-session-sections'
import type { ContentSnapshot } from '../../lib/sync/types'

/** 학습 파트 — 파트가 끝날 때마다 완료 화면을 한 번 띄운다 */
export function partOfSection(
  kind: AssignmentSection['kind'],
): PartCompleteKind {
  switch (kind) {
    case 'word-match':
    case 'word-listen-match':
    case 'word-quiz':
    case 'word-spell':
      return 'word'
    case 'body-text-a':
    case 'body-text-b':
    case 'body-text-c':
      return 'sentence'
    case 'grammar-type-1':
    case 'grammar-type-2':
      return 'grammar'
  }
}

/** 러너가 섹션을 도는 순서 그대로 — 맵 메뉴도 이 순서로 보여준다 */
const PART_ORDER: PartCompleteKind[] = ['word', 'sentence', 'grammar']

export type AssignmentPartSummary = {
  part: PartCompleteKind
  /** 이 파트의 전체 출제 문항 수 */
  questionTotal: number
  /** 이 파트에 속한 문항 id — 「이미 다 풀었나」 판정용 */
  questionIds: string[]
  /** 러너에서 이 파트가 시작되는 섹션 인덱스 */
  startSectionIndex: number
}

/**
 * 과제에 **실제로 들어 있는** 파트만 추린다.
 *
 * 문항이 0개인 파트는 넣지 않는다 — 눌러 봐야 러너가 곧바로 다음으로 넘어가서
 * 「눌렀는데 아무 일도 안 일어난다」가 된다.
 */
export function listAssignmentParts(
  snapshot: ContentSnapshot,
): AssignmentPartSummary[] {
  const sections = buildAssignmentSections(snapshot)

  const byPart = new Map<PartCompleteKind, AssignmentPartSummary>()
  sections.forEach((section, index) => {
    const part = partOfSection(section.kind)
    const existing = byPart.get(part)
    const questionTotal = countSectionQuestions([section])
    const questionIds = listSectionQuestionIds([section])
    if (existing) {
      existing.questionTotal += questionTotal
      existing.questionIds.push(...questionIds)
      return
    }
    byPart.set(part, {
      part,
      questionTotal,
      questionIds,
      // 섹션 배열에서 이 파트가 처음 나오는 자리 = 러너의 시작 인덱스
      startSectionIndex: index,
    })
  })

  return PART_ORDER.map((part) => byPart.get(part)).filter(
    (item): item is AssignmentPartSummary =>
      item != null && item.questionTotal > 0,
  )
}

/**
 * 이미 답한 문항 id를 받아 파트별 완료 여부를 낸다.
 * 파트의 문항을 **하나도 남김없이** 답했을 때만 완료로 본다 — 러너가 이어풀기에서
 * 답한 문항을 걸러내므로, 하나라도 남아 있으면 들어갈 거리가 있다는 뜻이다.
 */
export function isPartCompleted(
  part: AssignmentPartSummary,
  answeredQuestionIds: ReadonlySet<string>,
): boolean {
  if (part.questionIds.length === 0) return false
  return part.questionIds.every((id) => answeredQuestionIds.has(id))
}
