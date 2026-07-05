import {
  figmaRectStyle,
  PILL,
  PILL_DIMMED_SURFACE,
  PILL_LABEL_MASK,
  PILL_LABEL_TEXT,
  PILL_SURFACE,
} from './session-round-dropdown'

const LABEL_TEXT_CLASS =
  "pointer-events-none absolute flex items-center justify-center font-['Pretendard',sans-serif] text-[14px] font-semibold leading-none text-[#1E242F]"

type ClassRoundPillLabelProps = {
  classLabel?: string
  roundLabel?: string
  /** invite/waiting: dimmed pill (SVG has 45% black overlay). assignment: bright white pill */
  surface?: 'dimmed' | 'pill'
}

export function ClassRoundPillLabel({
  classLabel = '1반',
  roundLabel = '1회차',
  surface = 'pill',
}: ClassRoundPillLabelProps) {
  const mask =
    surface === 'dimmed'
      ? {
          rect: { x: PILL.x, y: PILL.y, w: PILL.w - 34, h: PILL.h },
          color: PILL_DIMMED_SURFACE,
          rounded: true,
        }
      : { rect: PILL_LABEL_MASK, color: PILL_SURFACE, rounded: false }

  return (
    <>
      <div
        className={`pointer-events-none absolute${mask.rounded ? ' rounded-[10px]' : ''}`}
        style={{
          ...figmaRectStyle(mask.rect),
          backgroundColor: mask.color,
        }}
        aria-hidden
      />
      <div
        className={LABEL_TEXT_CLASS}
        style={figmaRectStyle(PILL_LABEL_TEXT)}
        aria-hidden
      >
        {classLabel} {roundLabel}
      </div>
    </>
  )
}
