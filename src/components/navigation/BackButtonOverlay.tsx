import { useCurrentBackNavigation } from './BackNavigationProvider'
import {
  BACK_BUTTON_HIT,
  BACK_CHEVRON,
  BACK_CHEVRON_COLOR,
  figmaNavRectStyle,
  type BackButtonMask,
} from './figma-navigation'

export type BackButtonOverlayVariant = 'figma-hit' | 'labeled'

type BackButtonOverlayProps = {
  /**
   * @deprecated 이제 모든 화면이 `<`를 직접 그린다 — 구분이 필요 없다.
   * 남겨 둔 건 호출부를 한꺼번에 안 고쳐도 되게 하려는 것.
   */
  variant?: BackButtonOverlayVariant
  /** 에셋에 구워진 `<`를 가릴 덮개. 안 넘기면 덮지 않는다(구운 화살표가 없는 화면) */
  mask?: BackButtonMask
  className?: string
}

/**
 * 모든 화면 공통 뒤로가기.
 *
 * **위치·크기·색이 화면마다 달랐다** (2026-08-08 전수 실측 — `figma-navigation.ts` 표 참고).
 * 화살표가 에셋에 구워져 있어서 히트 영역만 맞춰서는 통일되지 않는다. 그래서
 * **구운 화살표는 `mask`로 덮고, 여기서 한 자리에 다시 그린다.**
 *
 * `<`를 SVG 뷰박스 안에 그리는 이유: 프레임이 393→540px로 커져도 화살표가 같은 비율로
 * 따라 커지게 하려는 것. 고정 px로 그리면 큰 화면에서 혼자 작아 보인다.
 */
export function BackButtonOverlay({
  mask,
  className = '',
}: BackButtonOverlayProps) {
  const { visible, onBack } = useCurrentBackNavigation()

  if (!visible) return null

  const cx = BACK_BUTTON_HIT.w / 2
  const cy = BACK_BUTTON_HIT.h / 2
  const halfW = BACK_CHEVRON.w / 2
  const halfH = BACK_CHEVRON.h / 2

  return (
    <>
      {mask ? (
        <span
          aria-hidden
          className="pointer-events-none absolute z-[99]"
          style={{ ...figmaNavRectStyle(mask.rect), background: mask.color }}
        />
      ) : null}

      <button
        type="button"
        aria-label="뒤로가기"
        className={`absolute z-[100] cursor-pointer bg-transparent p-0 ${className}`}
        style={figmaNavRectStyle(BACK_BUTTON_HIT)}
        onClick={onBack}
      >
        <svg
          aria-hidden
          viewBox={`0 0 ${BACK_BUTTON_HIT.w} ${BACK_BUTTON_HIT.h}`}
          className="h-full w-full"
          fill="none"
        >
          <path
            d={`M${cx + halfW} ${cy - halfH}L${cx - halfW} ${cy}L${cx + halfW} ${cy + halfH}`}
            stroke={BACK_CHEVRON_COLOR}
            strokeWidth={BACK_CHEVRON.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  )
}
