import { useEffect, useMemo, useRef, useState } from 'react'

const BIRTH_YEAR_MIN = 1927
const BIRTH_YEAR_MAX = 2021
const BIRTH_YEAR_DEFAULT_SCROLL = 2013

const DROPDOWN_CONTAINER_ASSET = '/assets/birthdate-dropdown-container.svg'

/** Figma frame 393×852 */
const FRAME_W = 393
const FRAME_H = 852

/** birthdate-dropdown-container.svg export size */
const CONTAINER_W = 134
const CONTAINER_H = 210

/** Figma — Inter Medium 14/20, letter-spacing -0.15px */
const BIRTHDATE_TEXT_CLASS =
  "font-['Inter',sans-serif] text-[14px] font-medium leading-[20px] tracking-[-0.15px]"

const FIELD_TOP = '22.89%'
const FIELD_HEIGHT = '4.23%'

const FIELD_LEFT_PX = {
  year: 20,
  month: 141.664,
  day: 263.336,
} as const

const FIELD_LAYOUT = {
  year: { left: '5.09%', width: '27.9%' },
  month: { left: '36.05%', width: '27.9%' },
  day: { left: '67.01%', width: '27.9%' },
} as const

/** birthdate-dropdown-container.svg — inner scroll area (12,12 → 110×166) */
const LIST_INSET = {
  left: `${(12 / CONTAINER_W) * 100}%`,
  top: `${(12 / CONTAINER_H) * 100}%`,
  width: `${(110 / CONTAINER_W) * 100}%`,
  height: `${(166 / CONTAINER_H) * 100}%`,
}

/** Figma — list row height 28px inside 210px container */
const ROW_HEIGHT = `${(28 / CONTAINER_H) * 100}%`

/** Figma — text x≈45px, inner box starts x=12 */
const ROW_PADDING_LEFT = `${(33 / 110) * 100}%`

type FieldId = keyof typeof FIELD_LAYOUT

function dropdownPanelStyle(field: FieldId) {
  return {
    left: `${((FIELD_LEFT_PX[field] - 12) / FRAME_W) * 100}%`,
    top: `${(237 / FRAME_H) * 100}%`,
    width: `${(CONTAINER_W / FRAME_W) * 100}%`,
    height: `${(CONTAINER_H / FRAME_H) * 100}%`,
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 12 8"
      className="h-2 w-3 shrink-0 opacity-50"
      fill="none"
      aria-hidden
    >
      <path
        d="M1 1.5L6 6.5L11 1.5"
        stroke="#717182"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BirthdateTrigger({
  field,
  value,
  placeholder,
  suffix,
  isOpen,
  onToggle,
}: {
  field: FieldId
  value: string
  placeholder: string
  suffix: string
  isOpen: boolean
  onToggle: () => void
}) {
  const layout = FIELD_LAYOUT[field]
  const displayLabel = value ? `${value}${suffix}` : placeholder

  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-label={placeholder}
      className={`absolute flex items-center justify-between rounded-lg bg-[#F3F3F5] px-3 text-left ${BIRTHDATE_TEXT_CLASS}`}
      style={{
        left: layout.left,
        top: FIELD_TOP,
        width: layout.width,
        height: FIELD_HEIGHT,
      }}
      onClick={onToggle}
    >
      <span
        className={`truncate ${value ? 'text-[#0A0A0A]' : 'text-[#717182]'}`}
      >
        {displayLabel}
      </span>
      <ChevronDown />
    </button>
  )
}

function BirthdateDropdownPanel({
  field,
  value,
  placeholder,
  suffix,
  options,
  defaultScrollValue,
  onChange,
  onClose,
}: {
  field: FieldId
  value: string
  placeholder: string
  suffix: string
  options: string[]
  defaultScrollValue?: string
  onChange: (value: string) => void
  onClose: () => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!listRef.current || !defaultScrollValue) return

    const target = listRef.current.querySelector(
      `[data-value="${defaultScrollValue}"]`,
    )
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ block: 'center' })
    }
  }, [defaultScrollValue])

  return (
    <div
      className="absolute z-30"
      style={dropdownPanelStyle(field)}
      role="presentation"
    >
      <img
        src={DROPDOWN_CONTAINER_ASSET}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        draggable={false}
      />

      <div
        ref={listRef}
        role="listbox"
        aria-label={placeholder}
        className="absolute overflow-y-auto bg-white"
        style={LIST_INSET}
      >
        {options.map((option) => {
          const selected = value === option
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={selected}
              data-value={option}
              className={`flex w-full items-center text-left text-[#0A0A0A] ${BIRTHDATE_TEXT_CLASS} ${
                selected ? 'bg-[#EBEBEB]' : 'bg-white hover:bg-[#F3F3F5]'
              }`}
              style={{
                height: ROW_HEIGHT,
                paddingLeft: ROW_PADDING_LEFT,
              }}
              onClick={() => {
                onChange(option)
                onClose()
              }}
            >
              {option}
              {suffix}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function BirthdatePicker({
  birthYear,
  birthMonth,
  birthDay,
  onChangeYear,
  onChangeMonth,
  onChangeDay,
}: {
  birthYear: string
  birthMonth: string
  birthDay: string
  onChangeYear: (value: string) => void
  onChangeMonth: (value: string) => void
  onChangeDay: (value: string) => void
}) {
  const [openField, setOpenField] = useState<FieldId | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const years = useMemo(
    () =>
      Array.from(
        { length: BIRTH_YEAR_MAX - BIRTH_YEAR_MIN + 1 },
        (_, index) => String(BIRTH_YEAR_MAX - index),
      ),
    [],
  )

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, index) => String(index + 1)),
    [],
  )

  const yearNum = Number(birthYear)
  const monthNum = Number(birthMonth)
  const maxDays =
    birthYear && birthMonth ? daysInMonth(yearNum, monthNum) : 31

  const days = useMemo(
    () => Array.from({ length: maxDays }, (_, index) => String(index + 1)),
    [maxDays],
  )

  useEffect(() => {
    if (birthDay && Number(birthDay) > maxDays) {
      onChangeDay('')
    }
  }, [birthDay, maxDays, onChangeDay])

  useEffect(() => {
    if (openField === null) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenField(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openField])

  const toggleField = (field: FieldId) => {
    setOpenField((current) => (current === field ? null : field))
  }

  const fieldConfig = {
    year: {
      value: birthYear,
      placeholder: '년도',
      suffix: '년',
      options: years,
      onChange: onChangeYear,
      defaultScrollValue: String(BIRTH_YEAR_DEFAULT_SCROLL),
    },
    month: {
      value: birthMonth,
      placeholder: '월',
      suffix: '월',
      options: months,
      onChange: onChangeMonth,
      defaultScrollValue: undefined,
    },
    day: {
      value: birthDay,
      placeholder: '일',
      suffix: '일',
      options: days,
      onChange: onChangeDay,
      defaultScrollValue: undefined,
    },
  } as const

  return (
    <div ref={containerRef} className="contents">
      {(Object.keys(fieldConfig) as FieldId[]).map((field) => {
        const config = fieldConfig[field]
        return (
          <BirthdateTrigger
            key={field}
            field={field}
            value={config.value}
            placeholder={config.placeholder}
            suffix={config.suffix}
            isOpen={openField === field}
            onToggle={() => toggleField(field)}
          />
        )
      })}

      {openField && (
        <BirthdateDropdownPanel
          field={openField}
          value={fieldConfig[openField].value}
          placeholder={fieldConfig[openField].placeholder}
          suffix={fieldConfig[openField].suffix}
          options={fieldConfig[openField].options}
          defaultScrollValue={fieldConfig[openField].defaultScrollValue}
          onChange={fieldConfig[openField].onChange}
          onClose={() => setOpenField(null)}
        />
      )}
    </div>
  )
}
