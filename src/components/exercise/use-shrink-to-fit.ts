import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * 내용이 상자를 넘치면 **글씨를 줄여 다 보이게** 한다.
 *
 * 문항 상자는 시안 좌표로 크기가 고정돼 있고 `overflow-hidden`이라, 문장이 길어 줄이
 * 늘면 위아래가 그대로 잘렸다(영작 화면에서 실제로 그랬다). 상자를 늘리는 방법도
 * 있지만 아래 버튼들과 겹쳐서, **글씨를 줄이는 쪽**으로 정했다(사용자 결정 2026-08-12).
 *
 * 줄이는 데도 한계가 있어서 `minScale` 아래로는 안 내려간다. 그래도 넘치면
 * `needsScroll`을 돌려주니, 호출 측이 그때만 스크롤을 열면 된다 —
 * 아주 긴 문장은 못 읽을 만큼 작게 만드는 것보다 스크롤이 낫다.
 */
export function useShrinkToFit(
  boxRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  deps: unknown[],
  options: { minScale?: number } = {},
): boolean {
  const { minScale = 0.55 } = options
  const [needsScroll, setNeedsScroll] = useState(false)

  useLayoutEffect(() => {
    const box = boxRef.current
    const content = contentRef.current
    if (!box || !content) return

    const fit = () => {
      // 기준 크기로 되돌리고 시작한다 — 안 그러면 이전 회차의 축소가 누적된다
      content.style.fontSize = ''
      const base = Number.parseFloat(getComputedStyle(content).fontSize)
      if (!Number.isFinite(base) || base <= 0) return

      /*
        글씨를 줄이면 줄바꿈이 달라져서 한 번에 안 맞는다. 넘친 비율만큼 줄이고
        다시 재기를 몇 번 반복하면 수렴한다. 6번이면 충분하고, 변화가 미미해지면
        더 돌지 않는다.
      */
      let scale = 1
      for (let i = 0; i < 6; i += 1) {
        const avail = box.clientHeight
        const need = content.scrollHeight
        if (need <= avail + 0.5) break
        const next = Math.max(minScale, scale * (avail / need))
        if (Math.abs(next - scale) < 0.005) {
          scale = next
          break
        }
        scale = next
        content.style.fontSize = `${base * scale}px`
      }

      setNeedsScroll(content.scrollHeight > box.clientHeight + 0.5)
    }

    fit()

    // 프레임 크기가 바뀌면(회전·창 크기) 다시 맞춘다
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 호출 측이 내용 변화를 넘긴다
  }, deps)

  return needsScroll
}
