/**
 * 연속 정답 「콤보」 규칙.
 *
 * 콤보 값 자체는 러너(`AssignmentRunnerScreen`)가 들고 있다 — 파트(섹션)를 넘어가도 이어지도록.
 * 오답이 하나라도 나오면 0으로 끊긴다.
 *
 * **단어 A/B 짝맞추기**는 예외: 짝마다 올리지 않고, 보드를 전부 첫 시도에 맞추면
 * 섹션 끝날 때 **1콤보**만 올린다. (중간 오답이 있으면 그 짝 확정 시 콤보 끊김)
 *
 * **배지는 3콤보부터 계속 보이고, 이펙트(버스트 + 소리)는 마일스톤에서만 터진다.**
 * 매 정답마다 소리를 내면 시끄럽기만 하고 콤보가 특별하게 느껴지지 않는다.
 */

/** 배지가 나타나기 시작하는 콤보 */
export const COMBO_BADGE_MIN = 3

/** 10콤보 전까지의 마일스톤 */
const EARLY_MILESTONES = [3, 5]

/** 여기부터 간격이 10 → 20으로 늘어난다 */
const WIDE_STEP_FROM = 100

/**
 * 이펙트가 터지는 지점인가.
 *
 * 3 · 5 · 10 · 20 · 30 … 90 · 100 · 120 · 140 …
 * 콤보가 길어질수록 간격을 벌린다 — 안 그러면 후반에 이펙트가 계속 터져서 방해가 된다.
 */
export function isComboMilestone(combo: number): boolean {
  if (combo < COMBO_BADGE_MIN) return false
  if (EARLY_MILESTONES.includes(combo)) return true
  if (combo < 10) return false
  if (combo < WIDE_STEP_FROM) return combo % 10 === 0
  return combo % 20 === 0
}

/**
 * 몇 번째 마일스톤인가 (3 → 1, 5 → 2, 10 → 3, 20 → 4 … 100 → 12, 120 → 13).
 * 소리 음높이와 버스트 색 단계를 여기서 뽑는다.
 */
export function comboMilestoneIndex(combo: number): number {
  if (combo < 3) return 0
  if (combo < 5) return 1
  if (combo < 10) return 2
  if (combo < WIDE_STEP_FROM) return 2 + Math.floor(combo / 10)
  return 12 + Math.floor((combo - WIDE_STEP_FROM) / 20)
}

export type ComboTone = 'warm' | 'hot' | 'blaze'

/**
 * 버스트 색 단계. 숫자가 아니라 단계로 나눠 두면 색을 바꿀 때 한 곳만 고치면 된다.
 * 10콤보 미만은 `warm`, 10~40은 `hot`, 50 이상은 `blaze`.
 */
export function comboTone(combo: number): ComboTone {
  if (combo >= 50) return 'blaze'
  if (combo >= 10) return 'hot'
  return 'warm'
}

export const COMBO_TONE_COLORS: Record<
  ComboTone,
  { text: string; glow: string }
> = {
  warm: { text: '#F5A524', glow: 'rgba(245,165,36,0.35)' },
  hot: { text: '#F5730B', glow: 'rgba(245,115,11,0.40)' },
  blaze: { text: '#EF3E36', glow: 'rgba(239,62,54,0.45)' },
}

/** 버스트가 떠 있는 시간(ms). `combo-burst` 키프레임 길이와 맞춰야 한다. */
export const COMBO_BURST_MS = 900

/**
 * 정답/오답 시퀀스에서 **최고 연속 정답(MAX COMBO)** 을 구한다.
 *
 * 종합 완료 화면 배지는 끝에서 유지 중이던 콤보가 아니라 이 값을 쓴다.
 * 예: 10연속 → 오답 → 끝 3연속 → 10.
 */
export function maxComboFromAnswerResults(results: readonly boolean[]): number {
  let peak = 0
  let current = 0
  for (const isCorrect of results) {
    if (isCorrect) {
      current += 1
      if (current > peak) peak = current
    } else {
      current = 0
    }
  }
  return peak
}
