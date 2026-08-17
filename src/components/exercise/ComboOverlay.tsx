import { COMBO_BADGE_MIN, COMBO_TONE_COLORS, comboTone } from './combo'
import { useCombo } from './ComboContext'

/**
 * 콤보 배지 + 마일스톤 버스트. `FigmaAssetFrame` 안(393×852 프레임 기준)에 그려진다.
 *
 * 러너 밖에서는 컨텍스트가 없어 아무것도 렌더하지 않는다.
 *
 * **전부 `pointer-events-none`이다** — 문제 화면의 투명 히트영역 위에 뜨기 때문에
 * 하나라도 클릭을 먹으면 답을 못 고르게 된다.
 */
export function ComboOverlay() {
  const state = useCombo()
  if (!state) return null

  const { combo, burst } = state

  return (
    <>
      {combo >= COMBO_BADGE_MIN ? <ComboBadge combo={combo} /> : null}
      {burst ? <ComboBurst key={burst.id} combo={burst.combo} /> : null}
    </>
  )
}

/** 우측 상단 작은 알약 — 3콤보부터 계속 떠 있는다 */
function ComboBadge({ combo }: { combo: number }) {
  const tone = COMBO_TONE_COLORS[comboTone(combo)]

  return (
    <div
      className="pointer-events-none absolute z-30 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[13px] leading-none font-bold whitespace-nowrap"
      style={{
        // 뒤로가기(좌상단)·진행바(상단 중앙)를 피해 오른쪽으로 붙인다
        right: `${(14 / 393) * 100}%`,
        top: `${(62 / 852) * 100}%`,
        color: tone.text,
        boxShadow: `0 2px 10px ${tone.glow}`,
      }}
      aria-live="polite"
    >
      <span aria-hidden>🔥</span>
      {combo}콤보
    </div>
  )
}

/**
 * 마일스톤 순간 화면 가운데 위쪽에 크게 떴다 사라진다.
 *
 * 문제 내용을 잠깐 가리므로 답을 고르는 영역(대개 화면 아래 절반)을 피해 위쪽에 둔다.
 * `key`가 바뀔 때마다 새로 마운트돼서 애니메이션이 다시 돈다.
 */
function ComboBurst({ combo }: { combo: number }) {
  const tone = COMBO_TONE_COLORS[comboTone(combo)]

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-30 flex flex-col items-center"
      style={{ top: `${(300 / 852) * 100}%`, animation: 'combo-burst 900ms ease-out forwards' }}
      aria-hidden
    >
      <span
        className="text-[56px] leading-none font-extrabold tracking-tight"
        style={{ color: tone.text, textShadow: `0 6px 24px ${tone.glow}` }}
      >
        {combo}
      </span>
      <span
        className="mt-1 text-[18px] leading-none font-bold"
        style={{ color: tone.text }}
      >
        콤보!
      </span>
    </div>
  )
}
